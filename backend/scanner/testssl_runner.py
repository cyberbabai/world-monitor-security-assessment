"""
testssl.sh wrapper. Parses JSON output to extract TLS findings.
Requires testssl.sh: https://testssl.sh/
"""
import asyncio
import json
import shutil
import tempfile
import os
from typing import AsyncGenerator


SEVERITY_MAP = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
    "INFO": "info",
    "OK": "info",
    "WARN": "medium",
    "NOT ok": "high",
    "not ok": "high",
}

CVSS_MAP = {"critical": 9.0, "high": 7.0, "medium": 5.0, "low": 2.5, "info": 0.0}

# IDs we care about — skip pure informational banners
INTERESTING_IDS = {
    "SSLv2", "SSLv3", "TLS1", "TLS1_1",
    "POODLE_SSL", "DROWN", "ROBOT", "BEAST", "LUCKY13",
    "RC4", "3DES_IDEA", "EXPORT_CIPHERS", "NULL_CIPHERS",
    "HSTS", "HSTS_preload",
    "HPKP",
    "cert_notAfter", "cert_chain_of_trust",
    "cipher_order",
    "OCSP_stapling",
    "CAA_record",
}


async def run_testssl(target: str) -> AsyncGenerator[dict, None]:
    """
    Yields {"type": "log", ...} and {"type": "finding", "data": dict}.
    """
    testssl = shutil.which("testssl") or shutil.which("testssl.sh")
    if not testssl:
        yield {"type": "log", "level": "warning", "message": "testssl.sh not found — skipping TLS audit. Install from https://testssl.sh/"}
        return

    host = target.replace("https://", "").replace("http://", "").rstrip("/")
    yield {"type": "log", "level": "info", "message": f"[testssl] starting TLS audit on {host}"}

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmppath = tmp.name

    try:
        cmd = [testssl, "--jsonfile", tmppath, "--quiet", "--color", "0", host]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        async for line in proc.stdout:
            text = line.decode("utf-8", errors="ignore").strip()
            if text:
                yield {"type": "log", "level": "info", "message": f"[testssl] {text}"}

        await proc.wait()

        if os.path.exists(tmppath) and os.path.getsize(tmppath) > 0:
            with open(tmppath) as f:
                data = json.load(f)
            findings = _parse_testssl_json(data, target)
            for finding in findings:
                yield {"type": "finding", "data": finding}
                yield {"type": "log", "level": finding["severity"],
                       "message": f"[testssl] {finding['severity'].upper()}: {finding['title']}"}

        yield {"type": "log", "level": "info", "message": "[testssl] TLS audit complete"}

    except Exception as e:
        yield {"type": "log", "level": "error", "message": f"[testssl] error: {e}"}
    finally:
        if os.path.exists(tmppath):
            os.unlink(tmppath)


def _parse_testssl_json(data: dict, target: str) -> list[dict]:
    findings = []
    results = data if isinstance(data, list) else data.get("scanResult", [{}])[0].get("findings", [])
    if isinstance(data, dict):
        scan_results = data.get("scanResult", [])
        if scan_results:
            results = scan_results[0].get("findings", [])

    for item in results:
        item_id = item.get("id", "")
        severity_raw = item.get("severity", "INFO")
        finding_str = item.get("finding", "")

        severity = SEVERITY_MAP.get(severity_raw, "info")
        if severity == "info" and item_id not in INTERESTING_IDS:
            continue

        # Map well-known IDs to structured findings
        title, description, owasp, cwe, remediation = _map_id(item_id, finding_str)

        findings.append({
            "title": title,
            "description": description,
            "severity": severity,
            "cvss_score": CVSS_MAP[severity],
            "cvss_vector": "",
            "category": "Secure Communication",
            "owasp": owasp,
            "cwe": cwe,
            "endpoint": target,
            "steps_to_reproduce": [
                f"Run: testssl.sh {target}",
                f"Review finding ID: {item_id}",
            ],
            "poc_request": f"openssl s_client -connect {target.replace('https://', '').replace('http://', '')}:443",
            "poc_response": finding_str[:2000],
            "business_impact": f"Weak TLS configuration can allow man-in-the-middle attacks and data interception.",
            "remediation": remediation,
            "references": ["https://owasp.org/Top10/A02_2021-Cryptographic_Failures/"],
            "status": "open",
        })

    return findings


def _map_id(item_id: str, finding: str) -> tuple:
    MAPS = {
        "SSLv2":       ("SSLv2 Supported", "Server accepts SSLv2 — a broken protocol deprecated since 1996.", "A02:2021", "CWE-327", ["Disable SSLv2 in the server configuration"]),
        "SSLv3":       ("SSLv3 Supported (POODLE)", "Server accepts SSLv3, vulnerable to the POODLE attack.", "A02:2021", "CWE-327", ["Disable SSLv3; enable TLS 1.2+ only"]),
        "TLS1":        ("TLS 1.0 Supported", "TLS 1.0 is deprecated (RFC 8996). Vulnerable to BEAST and POODLE-TLS.", "A02:2021", "CWE-327", ["Disable TLS 1.0; require TLS 1.2 minimum"]),
        "TLS1_1":      ("TLS 1.1 Supported", "TLS 1.1 is deprecated (RFC 8996).", "A02:2021", "CWE-327", ["Disable TLS 1.1; require TLS 1.2+"]),
        "RC4":         ("RC4 Cipher Suite Enabled", "RC4 is a broken stream cipher. IETF prohibits its use (RFC 7465).", "A02:2021", "CWE-327", ["Remove all RC4 cipher suites from the configuration"]),
        "3DES_IDEA":   ("3DES/SWEET32 Cipher Suite", "3DES is vulnerable to SWEET32 birthday attack.", "A02:2021", "CWE-327", ["Remove 3DES and IDEA cipher suites"]),
        "NULL_CIPHERS":("NULL Cipher Suites Enabled", "NULL ciphers provide no encryption.", "A02:2021", "CWE-327", ["Disable all NULL cipher suites immediately"]),
        "HSTS":        ("Missing HTTP Strict Transport Security", "HSTS header not present or max-age too short.", "A05:2021", "CWE-319", ["Add HSTS header with max-age ≥ 31536000; includeSubDomains"]),
        "POODLE_SSL":  ("POODLE SSL Vulnerability", "Server is vulnerable to POODLE (CVE-2014-3566).", "A02:2021", "CWE-311", ["Disable SSLv3 and CBC mode ciphers"]),
        "ROBOT":       ("ROBOT Attack (RSA Key Exchange)", "Server is vulnerable to the ROBOT (Return Of Bleichenbacher's Oracle Threat) attack.", "A02:2021", "CWE-203", ["Disable RSA key exchange; prefer ECDHE"]),
        "BEAST":       ("BEAST Attack (TLS 1.0 CBC)", "TLS 1.0 + CBC ciphers make this server vulnerable to the BEAST attack.", "A02:2021", "CWE-327", ["Disable TLS 1.0; prefer GCM cipher modes"]),
    }
    if item_id in MAPS:
        title, desc, owasp, cwe, rem = MAPS[item_id]
        return title, desc, owasp, cwe, rem
    return (
        f"TLS Issue: {item_id}",
        finding or f"testssl.sh flagged {item_id}.",
        "A02:2021",
        "CWE-327",
        ["Review the testssl.sh output and apply the recommended TLS hardening"],
    )
