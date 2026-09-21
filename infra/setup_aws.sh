#!/usr/bin/env bash
# World Monitor — AWS Infrastructure Setup
# Region: eu-north-1 (Stockholm) | Account: vivek_aws (826787194506)
# Run: bash infra/setup_aws.sh
# Prerequisites: AWS CLI configured with IAM user credentials

set -euo pipefail

REGION="eu-north-1"
ACCOUNT_ID="826787194506"
APP_NAME="worldmonitor"
KEY_NAME="${APP_NAME}-key"
BUCKET_FRONTEND="${APP_NAME}-frontend-$(date +%s)"
BUCKET_EVIDENCE="${APP_NAME}-pentest-evidence"
DB_PASSWORD="WMSec_$(openssl rand -hex 8)_2026"
SECRET_KEY="$(openssl rand -hex 32)"
ALERT_EMAIL="7stardevelopers7777@gmail.com"

echo "=========================================="
echo " World Monitor — AWS Setup (eu-north-1)"
echo "=========================================="
echo ""

# ── 1. EC2 Key Pair ─────────────────────────────────────────────────────────
echo "[1/10] Creating EC2 key pair..."
aws ec2 create-key-pair \
  --key-name "$KEY_NAME" \
  --region "$REGION" \
  --query 'KeyMaterial' \
  --output text > "${KEY_NAME}.pem"
chmod 600 "${KEY_NAME}.pem"
echo "  Key saved: ${KEY_NAME}.pem (keep this file — needed to SSH into EC2)"

# ── 2. VPC & Subnets ─────────────────────────────────────────────────────────
echo "[2/10] Creating VPC and subnets..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.10.0.0/16 \
  --region "$REGION" \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${APP_NAME}-vpc}]" \
  --query 'Vpc.VpcId' --output text)

# Enable DNS resolution
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames --region "$REGION"
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-support --region "$REGION"

SUBNET_PUBLIC=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" --cidr-block 10.10.1.0/24 \
  --availability-zone "${REGION}a" --region "$REGION" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public}]" \
  --query 'Subnet.SubnetId' --output text)

SUBNET_PRIVATE=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" --cidr-block 10.10.2.0/24 \
  --availability-zone "${REGION}a" --region "$REGION" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-private}]" \
  --query 'Subnet.SubnetId' --output text)

# Internet Gateway for public subnet
IGW_ID=$(aws ec2 create-internet-gateway --region "$REGION" \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID" --region "$REGION"

# Route table for public subnet
RT_ID=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --region "$REGION" \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id "$RT_ID" --destination-cidr-block 0.0.0.0/0 \
  --gateway-id "$IGW_ID" --region "$REGION" > /dev/null
aws ec2 associate-route-table --subnet-id "$SUBNET_PUBLIC" --route-table-id "$RT_ID" \
  --region "$REGION" > /dev/null

echo "  VPC: $VPC_ID | Public subnet: $SUBNET_PUBLIC | Private subnet: $SUBNET_PRIVATE"

# ── 3. Security Groups ────────────────────────────────────────────────────────
echo "[3/10] Creating security groups..."

# App server SG — SSH + HTTP + HTTPS + FastAPI
SG_APP=$(aws ec2 create-security-group \
  --group-name "${APP_NAME}-app-sg" \
  --description "World Monitor app server" \
  --vpc-id "$VPC_ID" --region "$REGION" \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id "$SG_APP" --region "$REGION" \
  --protocol tcp --port 22 --cidr 0.0.0.0/0   # SSH (restrict to your IP in production)
aws ec2 authorize-security-group-ingress --group-id "$SG_APP" --region "$REGION" \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$SG_APP" --region "$REGION" \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$SG_APP" --region "$REGION" \
  --protocol tcp --port 8000 --cidr 0.0.0.0/0  # FastAPI

# RDS SG — only from app SG
SG_RDS=$(aws ec2 create-security-group \
  --group-name "${APP_NAME}-rds-sg" \
  --description "World Monitor RDS" \
  --vpc-id "$VPC_ID" --region "$REGION" \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id "$SG_RDS" --region "$REGION" \
  --protocol tcp --port 5432 --source-group "$SG_APP"

echo "  App SG: $SG_APP | RDS SG: $SG_RDS"

# ── 4. RDS Subnet Group ──────────────────────────────────────────────────────
echo "[4/10] Creating RDS subnet group..."

# RDS needs 2 subnets in different AZs — create a second AZ subnet
SUBNET_RDS2=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" --cidr-block 10.10.3.0/24 \
  --availability-zone "${REGION}b" --region "$REGION" \
  --query 'Subnet.SubnetId' --output text)

aws rds create-db-subnet-group \
  --db-subnet-group-name "${APP_NAME}-subnet-group" \
  --db-subnet-group-description "World Monitor RDS subnet group" \
  --subnet-ids "$SUBNET_PRIVATE" "$SUBNET_RDS2" \
  --region "$REGION" > /dev/null

echo "  Subnet group created"

# ── 5. RDS PostgreSQL ─────────────────────────────────────────────────────────
echo "[5/10] Creating RDS PostgreSQL (db.t3.micro)..."
echo "  DB password: $DB_PASSWORD  ← SAVE THIS"

aws rds create-db-instance \
  --db-instance-identifier "${APP_NAME}-db" \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version "16.4" \
  --master-username wmsec \
  --master-user-password "$DB_PASSWORD" \
  --db-name worldmonitor \
  --vpc-security-group-ids "$SG_RDS" \
  --db-subnet-group-name "${APP_NAME}-subnet-group" \
  --no-multi-az \
  --no-publicly-accessible \
  --storage-type gp3 \
  --allocated-storage 20 \
  --backup-retention-period 0 \
  --region "$REGION" > /dev/null

echo "  RDS instance creating (takes 5–10 min)..."

# ── 6. EC2 App Server ─────────────────────────────────────────────────────────
echo "[6/10] Launching EC2 t3.small (Amazon Linux 2023)..."

# Amazon Linux 2023 AMI for eu-north-1
AMI_ID=$(aws ec2 describe-images \
  --region "$REGION" \
  --owners amazon \
  --filters \
    "Name=name,Values=al2023-ami-2023.*-x86_64" \
    "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

INSTANCE_ID=$(aws ec2 run-instances \
  --region "$REGION" \
  --image-id "$AMI_ID" \
  --instance-type t3.small \
  --key-name "$KEY_NAME" \
  --subnet-id "$SUBNET_PUBLIC" \
  --security-group-ids "$SG_APP" \
  --associate-public-ip-address \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --user-data "$(cat <<'USERDATA'
#!/bin/bash
set -e
# Update system
dnf update -y

# Install Python 3.12, git, pip
dnf install -y python3.12 python3.12-pip git

# Install Docker (for nuclei and testssl)
dnf install -y docker
systemctl enable --now docker

# Pull nuclei
docker pull projectdiscovery/nuclei:latest

# Install testssl.sh
git clone https://github.com/drwetter/testssl.sh /opt/testssl.sh
ln -sf /opt/testssl.sh/testssl.sh /usr/local/bin/testssl

# Clone app
git clone https://github.com/PLACEHOLDER/world-monitor-security-assessment /opt/wmsec || true

echo "Bootstrap complete" > /var/log/wmsec-bootstrap.log
USERDATA
)" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${APP_NAME}-app}]" \
  --query 'Instances[0].InstanceId' --output text)

echo "  Instance: $INSTANCE_ID (starting...)"

# ── 7. S3 — Frontend Hosting ──────────────────────────────────────────────────
echo "[7/10] Creating S3 bucket for frontend..."

aws s3api create-bucket \
  --bucket "$BUCKET_FRONTEND" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" > /dev/null

aws s3api put-bucket-policy \
  --bucket "$BUCKET_FRONTEND" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET_FRONTEND}/*\"
    }]
  }"

aws s3api put-bucket-website \
  --bucket "$BUCKET_FRONTEND" \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

# Disable block public access for website hosting
aws s3api put-public-access-block \
  --bucket "$BUCKET_FRONTEND" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "  Frontend bucket: $BUCKET_FRONTEND"
echo "  Website URL: http://${BUCKET_FRONTEND}.s3-website.${REGION}.amazonaws.com"

# ── 8. S3 — Evidence Bucket (encrypted) ──────────────────────────────────────
echo "[8/10] Creating encrypted evidence bucket..."

aws s3api create-bucket \
  --bucket "$BUCKET_EVIDENCE" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" > /dev/null

aws s3api put-bucket-encryption \
  --bucket "$BUCKET_EVIDENCE" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block \
  --bucket "$BUCKET_EVIDENCE" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-bucket-versioning \
  --bucket "$BUCKET_EVIDENCE" \
  --versioning-configuration Status=Enabled

echo "  Evidence bucket: $BUCKET_EVIDENCE (private, encrypted, versioned)"

# ── 9. AWS Budget Alert ───────────────────────────────────────────────────────
echo "[9/10] Setting budget alert at \$50..."

aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget "{
    \"BudgetName\": \"wmsec-budget\",
    \"BudgetLimit\": {\"Amount\": \"50\", \"Unit\": \"USD\"},
    \"BudgetType\": \"COST\",
    \"TimeUnit\": \"MONTHLY\"
  }" \
  --notifications-with-subscribers "[{
    \"Notification\": {
      \"NotificationType\": \"ACTUAL\",
      \"ComparisonOperator\": \"GREATER_THAN\",
      \"Threshold\": 80
    },
    \"Subscribers\": [{
      \"SubscriptionType\": \"EMAIL\",
      \"Address\": \"${ALERT_EMAIL}\"
    }]
  }]" 2>/dev/null || echo "  Budget may already exist — skipping"

# ── 10. Wait for EC2 & print summary ─────────────────────────────────────────
echo "[10/10] Waiting for EC2 to reach running state..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo ""
echo "=========================================="
echo " SETUP COMPLETE"
echo "=========================================="
echo ""
echo " EC2 App Server"
echo "   Instance ID:  $INSTANCE_ID"
echo "   Public IP:    $PUBLIC_IP"
echo "   SSH:          ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
echo " RDS PostgreSQL"
echo "   Identifier:   ${APP_NAME}-db (still creating...)"
echo "   Username:     wmsec"
echo "   Password:     $DB_PASSWORD"
echo "   DB Name:      worldmonitor"
echo ""
echo " S3 Frontend"
echo "   Bucket:       $BUCKET_FRONTEND"
echo "   Website:      http://${BUCKET_FRONTEND}.s3-website.${REGION}.amazonaws.com"
echo ""
echo " S3 Evidence"
echo "   Bucket:       $BUCKET_EVIDENCE"
echo ""
echo " NEXT STEPS:"
echo "   1. Wait ~5 min for RDS to finish creating"
echo "   2. Get RDS endpoint:"
echo "      aws rds describe-db-instances --db-instance-identifier ${APP_NAME}-db"
echo "      --region $REGION --query 'DBInstances[0].Endpoint.Address' --output text"
echo "   3. SSH into EC2 and start the backend:"
echo "      ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo "      cd /opt/wmsec/backend"
echo "      pip3.12 install -r requirements.txt"
echo "      DATABASE_URL=postgresql://wmsec:${DB_PASSWORD}@<RDS_ENDPOINT>:5432/worldmonitor \\"
echo "      SECRET_KEY=${SECRET_KEY} \\"
echo "      uvicorn main:app --host 0.0.0.0 --port 8000"
echo "   4. Build and deploy frontend:"
echo "      cd frontend && npm run build"
echo "      aws s3 sync dist/ s3://${BUCKET_FRONTEND} --delete --region $REGION"
echo "      Set VITE_API_URL=http://${PUBLIC_IP}:8000 in .env before building"
echo ""
echo "   Budget alert will email ${ALERT_EMAIL} at 80% of \$50 threshold"
echo "=========================================="

# Save config for later use
cat > infra/aws-config.env << EOF
REGION=${REGION}
ACCOUNT_ID=${ACCOUNT_ID}
INSTANCE_ID=${INSTANCE_ID}
PUBLIC_IP=${PUBLIC_IP}
VPC_ID=${VPC_ID}
SG_APP=${SG_APP}
SG_RDS=${SG_RDS}
BUCKET_FRONTEND=${BUCKET_FRONTEND}
BUCKET_EVIDENCE=${BUCKET_EVIDENCE}
DB_PASSWORD=${DB_PASSWORD}
SECRET_KEY=${SECRET_KEY}
KEY_NAME=${KEY_NAME}
EOF
echo ""
echo " Config saved to infra/aws-config.env (keep this file secure)"
