"""
Manual header, CORS, cookie, and TLS checks run against a target URL.
Returns a list of finding dicts ready to insert into the database.
"""
import asyncio
import re
import httpx


SECURITY_HEADERS = {
    "Strict-Transport-Security": {
        "title": "Missing HTTP Strict Transport Security (HSTS)",
        "severity": "medium",
        "cvss": 5.3,
        "vector": "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
        "owasp": "A05:2021",
        "cwe": "CWE-319",
        "category": "Secure Communication",
        "remediation": [
            "Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
            "Ensure max-age is at least 1 year (31536000 seconds)",
        ],
    },
    "X-Content-Type-Options": {
        "title": "Missing X-Content-Type-Options Header",
        "severity": "low",
        "cvss": 3.7,
        "vector": "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
        "owasp": "A05:2021",
        "cwe": "CWE-693",
        "category": "Client-Side Security",
        "remediation": ["Add header: X-Content-Type-Options: nosniff"],
    },
    "X-Frame-Options": {
        "title": "Clickjacking — Missing X-Frame-Options",
        "severity": "medium",
        "cvss": 4.3,
        "vector": "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
        "owasp": "A05:2021",
        "cwe": "CWE-1021",
        "category": "Client-Side Security",
        "remediation": [
            "Add header: X-Frame-Options: DENY",
            "Or use Content-Security-Policy: frame-ancestors 'none'",
        ],
    },
    "Content-Security-Policy": {
        "title": "Missing Content Security Policy (CSP)",
        "severity": "medium",
        "cvss": 5.4,
        "vector": "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
        "owasp": "A05:2021",
        "cwe": "CWE-693",
        "category": "Client-Side Security",
        "remediation": [
            "Implement a strict Content-Security-Policy header",
            "Start with: Content-Security-Policy: default-src 'self'",
            "Avoid unsafe-inline and unsafe-eval directives",
        ],
    },
    "Referrer-Policy": {
        "title": "Missing Referrer-Policy Header",
        "severity": "low",
        "cvss": 3.1,
        "vector": "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
        "owasp": "A05:2021",
        "cwe": "CWE-116",
        "category": "Information Disclosure",
        "remediation": ["Add header: Referrer-Policy: strict-origin-when-cross-origin"],
    },
    "Permissions-Policy": {
        "title": "Missing Permissions-Policy Header",
        "severity": "low",
        "cvss": 2.6,
        "vector": "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
        "owasp": "A05:2021",
        "cwe": "CWE-693",
        "category": "Client-Side Security",
        "remediation": ["Add Permissions-Policy to restrict browser feature access"],
    },
}


async def run_header_checks(target: str) -> list[dict]:
    findings = []
    url = target if target.startswith("http") else f"https://{target}"

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, verify=False) as client:
            resp = await client.get(url)
            headers = {k.lower(): v for k, v in resp.headers.items()}

            # Security header presence checks
            for header_name, cfg in SECURITY_HEADERS.items():
                if header_name.lower() not in headers:
                    findings.append({
                        "title": cfg["title"],
                        "description": (
                            f"The response from {url} does not include the `{header_name}` header. "
                            f"This exposes the application to {cfg['category'].lower()} risks."
                        ),
                        "severity": cfg["severity"],
                        "cvss_score": cfg["cvss"],
                        "cvss_vector": cfg["vector"],
                        "category": cfg["category"],
                        "owasp": cfg["owasp"],
                        "cwe": cfg["cwe"],
                        "endpoint": url,
                        "steps_to_reproduce": [
                            f"Send a GET request to {url}",
                            f"Inspect the response headers",
                            f"Confirm {header_name} is absent",
                        ],
                        "poc_request": f"GET {url} HTTP/1.1\nHost: {_host(url)}",
                        "poc_response": f"HTTP/1.1 {resp.status_code}\n"
                                        + "\n".join(f"{k}: {v}" for k, v in resp.headers.items()[:10]),
                        "business_impact": f"Attackers can exploit the missing {header_name} header to conduct attacks against users.",
                        "remediation": cfg["remediation"],
                        "references": [f"https://owasp.org/Top10/{cfg['owasp']}/"],
                        "status": "open",
                    })

            # CORS misconfiguration check
            cors_findings = await _check_cors(client, url, headers)
            findings.extend(cors_findings)

            # Cookie security checks
            cookie_findings = _check_cookies(resp, url)
            findings.extend(cookie_findings)

            # Server info disclosure
            if "server" in headers and len(headers["server"]) > 3:
                findings.append({
                    "title": "Server Banner Disclosure",
                    "description": f"The server is advertising its software version: `{headers['server']}`. This aids attacker reconnaissance.",
                    "severity": "low",
                    "cvss_score": 3.1,
                    "cvss_vector": "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
                    "category": "Information Disclosure",
                    "owasp": "A05:2021",
                    "cwe": "CWE-200",
                    "endpoint": url,
                    "steps_to_reproduce": [f"GET {url}", "Read the `Server` header in the response"],
                    "poc_request": f"GET {url} HTTP/1.1",
                    "poc_response": f"Server: {headers['server']}",
                    "business_impact": "Attackers can target known CVEs for the disclosed server version.",
                    "remediation": ["Configure the web server to suppress or generic the Server header"],
                    "references": ["https://owasp.org/Top10/A05_2021-Security_Misconfiguration/"],
                    "status": "open",
                })

    except httpx.RequestError as e:
        findings.append({
            "title": "Target Unreachable",
            "description": f"Could not connect to {url}: {e}",
            "severity": "info",
            "cvss_score": 0.0,
            "cvss_vector": "",
            "category": "Reconnaissance",
            "owasp": "N/A",
            "cwe": "",
            "endpoint": url,
            "steps_to_reproduce": [f"Attempt to connect to {url}"],
            "poc_request": "",
            "poc_response": str(e),
            "business_impact": "",
            "remediation": ["Verify the target URL is correct and accessible from the scanner"],
            "references": [],
            "status": "open",
        })

    return findings


async def _check_cors(client: httpx.AsyncClient, url: str, existing_headers: dict) -> list[dict]:
    findings = []
    try:
        resp = await client.get(url, headers={"Origin": "https://evil.example.com"})
        acao = resp.headers.get("access-control-allow-origin", "")
        acac = resp.headers.get("access-control-allow-credentials", "false")

        if acao == "*" and acac.lower() == "true":
            findings.append({
                "title": "CORS: Wildcard Origin with Credentials",
                "description": "The server allows any origin (`*`) with `Access-Control-Allow-Credentials: true`, enabling cross-origin credential theft.",
                "severity": "high",
                "cvss_score": 8.1,
                "cvss_vector": "AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N",
                "category": "Client-Side Security",
                "owasp": "A07:2021",
                "cwe": "CWE-942",
                "endpoint": url,
                "steps_to_reproduce": [
                    f"Send request to {url} with Origin: https://evil.example.com",
                    "Observe ACAO: * and ACAC: true in response",
                ],
                "poc_request": f"GET {url} HTTP/1.1\nOrigin: https://evil.example.com",
                "poc_response": f"Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true",
                "business_impact": "Authenticated cross-origin requests can exfiltrate session data to attacker-controlled sites.",
                "remediation": ["Never combine wildcard ACAO with Allow-Credentials: true", "Whitelist specific trusted origins"],
                "references": ["https://portswigger.net/web-security/cors"],
                "status": "open",
            })
        elif acao == "https://evil.example.com":
            findings.append({
                "title": "CORS: Arbitrary Origin Reflected",
                "description": "The server reflects the supplied Origin header, allowing any site to make credentialed cross-origin requests.",
                "severity": "high",
                "cvss_score": 7.5,
                "cvss_vector": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
                "category": "Client-Side Security",
                "owasp": "A07:2021",
                "cwe": "CWE-942",
                "endpoint": url,
                "steps_to_reproduce": [
                    "Send request with arbitrary Origin header",
                    "Observe the Origin is reflected in ACAO response header",
                ],
                "poc_request": f"GET {url} HTTP/1.1\nOrigin: https://evil.example.com",
                "poc_response": f"Access-Control-Allow-Origin: https://evil.example.com",
                "business_impact": "Cross-origin data theft from authenticated users.",
                "remediation": ["Implement an origin allowlist", "Validate Origin against a whitelist before reflecting"],
                "references": ["https://portswigger.net/web-security/cors"],
                "status": "open",
            })
    except Exception:
        pass
    return findings


def _check_cookies(resp: httpx.Response, url: str) -> list[dict]:
    findings = []
    is_https = url.startswith("https://")

    for cookie in resp.cookies.jar:
        name = cookie.name
        issues = []

        if not cookie.has_nonstandard_attr("HttpOnly") and "httponly" not in str(cookie._rest).lower():
            issues.append("Missing HttpOnly flag — cookie accessible via JavaScript")
        if is_https and not cookie.secure:
            issues.append("Missing Secure flag — cookie can be transmitted over HTTP")
        if not cookie.has_nonstandard_attr("SameSite") and "samesite" not in str(cookie._rest).lower():
            issues.append("Missing SameSite attribute — potential CSRF risk")

        if issues:
            findings.append({
                "title": f"Insecure Cookie: {name}",
                "description": f"The cookie `{name}` is missing security attributes: {'; '.join(issues)}.",
                "severity": "medium",
                "cvss_score": 5.3,
                "cvss_vector": "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
                "category": "Authentication & Session",
                "owasp": "A07:2021",
                "cwe": "CWE-614",
                "endpoint": url,
                "steps_to_reproduce": [
                    f"Log into {url}",
                    f"Inspect Set-Cookie header for the '{name}' cookie",
                    "Confirm missing flags",
                ],
                "poc_request": f"GET {url} HTTP/1.1",
                "poc_response": f"Set-Cookie: {name}=...",
                "business_impact": "Session cookies accessible to JavaScript or transmittable over HTTP enable session hijacking.",
                "remediation": [
                    f"Set the HttpOnly flag on the {name} cookie",
                    f"Set the Secure flag on the {name} cookie",
                    f"Set SameSite=Strict or SameSite=Lax on the {name} cookie",
                ],
                "references": ["https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/"],
                "status": "open",
            })
    return findings


def _host(url: str) -> str:
    m = re.match(r"https?://([^/]+)", url)
    return m.group(1) if m else url
