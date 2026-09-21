"""
Nuclei scanner wrapper. Streams findings and log lines via an async generator.
Requires nuclei to be installed: https://nuclei.projectdiscovery.io/
"""
import asyncio
import json
import shutil
from typing import AsyncGenerator


NUCLEI_TEMPLATE_CATEGORIES = [
    "cves",
    "misconfigurations",
    "exposures",
    "default-logins",
    "takeovers",
    "technologies",
]

# Map nuclei severity → our model severity
SEVERITY_MAP = {
    "critical": "critical",
    "high": "high",
    "medium": "medium",
    "low": "low",
    "info": "info",
    "unknown": "info",
}

CVSS_DEFAULTS = {
    "critical": 9.0,
    "high": 7.5,
    "medium": 5.0,
    "low": 2.5,
    "info": 0.0,
}


async def run_nuclei(
    target: str,
    intensity: str = "standard",
) -> AsyncGenerator[dict, None]:
    """
    Yields dicts with either:
      {"type": "log", "level": str, "message": str}
      {"type": "finding", "data": dict}   ← finding dict ready for DB insert
    """
    nuclei_path = shutil.which("nuclei")
    if not nuclei_path:
        yield {"type": "log", "level": "warning", "message": "nuclei not found in PATH — skipping nuclei scan. Install from https://nuclei.projectdiscovery.io/"}
        return

    tags = ",".join(NUCLEI_TEMPLATE_CATEGORIES)
    rate_limit = {"quick": "50", "standard": "150", "full": "300"}.get(intensity, "150")

    cmd = [
        nuclei_path,
        "-u", target,
        "-tags", tags,
        "-j",             # JSON output per line
        "-silent",
        "-rl", rate_limit,
        "-timeout", "10",
        "-no-color",
    ]

    yield {"type": "log", "level": "info", "message": f"[nuclei] starting scan on {target} (intensity={intensity})"}

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        async for line in proc.stdout:
            raw = line.decode("utf-8", errors="ignore").strip()
            if not raw:
                continue
            try:
                hit = json.loads(raw)
                finding = _nuclei_hit_to_finding(hit, target)
                yield {"type": "finding", "data": finding}
                yield {"type": "log", "level": hit.get("info", {}).get("severity", "info"),
                       "message": f"[nuclei] {finding['severity'].upper()}: {finding['title']} ({finding['endpoint']})"}
            except json.JSONDecodeError:
                yield {"type": "log", "level": "info", "message": f"[nuclei] {raw}"}

        await proc.wait()
        yield {"type": "log", "level": "info", "message": f"[nuclei] scan complete (exit={proc.returncode})"}

    except Exception as e:
        yield {"type": "log", "level": "error", "message": f"[nuclei] error: {e}"}


def _nuclei_hit_to_finding(hit: dict, target: str) -> dict:
    info = hit.get("info", {})
    severity_raw = info.get("severity", "info").lower()
    severity = SEVERITY_MAP.get(severity_raw, "info")

    # Pull CVSS score if nuclei provides it
    cvss_score = CVSS_DEFAULTS[severity]
    classification = info.get("classification", {})
    if classification.get("cvss-score"):
        try:
            cvss_score = float(classification["cvss-score"])
        except (ValueError, TypeError):
            pass

    cvss_vector = classification.get("cvss-metrics", "")
    owasp_tags = classification.get("owasp-cwe", [])
    cwe_tags = classification.get("cwe-id", [])

    owasp = ", ".join(owasp_tags) if isinstance(owasp_tags, list) else str(owasp_tags)
    cwe = ", ".join(cwe_tags) if isinstance(cwe_tags, list) else str(cwe_tags)

    matched_url = hit.get("matched-at", hit.get("host", target))
    request = hit.get("request", "")
    response = hit.get("response", "")

    tags = info.get("tags", [])
    category = _infer_category(tags)

    remediation_raw = info.get("remediation", "")
    remediation = [remediation_raw] if remediation_raw else ["Refer to the linked advisory for remediation steps."]

    references = info.get("reference", [])
    if isinstance(references, str):
        references = [references]

    return {
        "title": info.get("name", hit.get("template-id", "Unnamed Finding")),
        "description": info.get("description", f"Nuclei template `{hit.get('template-id', '')}` matched on {matched_url}."),
        "severity": severity,
        "cvss_score": cvss_score,
        "cvss_vector": cvss_vector,
        "category": category,
        "owasp": owasp,
        "cwe": cwe,
        "endpoint": matched_url,
        "steps_to_reproduce": [
            f"Access {matched_url}",
            f"Nuclei template: {hit.get('template-id', '')}",
        ],
        "poc_request": request[:4000] if request else "",
        "poc_response": response[:4000] if response else "",
        "business_impact": f"Exploitation of this {severity} finding could compromise the application.",
        "remediation": remediation,
        "references": references[:5],
        "status": "open",
    }


def _infer_category(tags: list) -> str:
    tag_map = {
        "sqli": "Injection",
        "xss": "Injection",
        "ssti": "Injection",
        "rce": "Injection",
        "lfi": "Injection",
        "ssrf": "Injection",
        "auth": "Authentication & Session",
        "jwt": "Authentication & Session",
        "default-login": "Authentication & Session",
        "cors": "Client-Side Security",
        "csp": "Client-Side Security",
        "clickjacking": "Client-Side Security",
        "ssl": "Secure Communication",
        "tls": "Secure Communication",
        "cve": "CVE",
        "exposure": "Information Disclosure",
        "takeover": "Subdomain Takeover",
        "misconfig": "Misconfiguration",
    }
    for tag in (tags or []):
        t = tag.lower()
        for key, cat in tag_map.items():
            if key in t:
                return cat
    return "Misconfiguration"
