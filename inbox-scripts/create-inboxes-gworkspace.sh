#!/usr/bin/env bash
# ============================================================================
# India Gully — Google Workspace Inbox Provisioning
# ============================================================================
# Creates all 19 inboxes using the Google Workspace Admin SDK via gam CLI.
#
# PRE-REQUISITES:
#   1. Install GAM: https://github.com/GAM-team/GAM/wiki/How-to-Install-GAM
#   2. Authenticate: gam oauth create
#   3. Verify domain: indiagully.com must be your primary domain in Google Workspace
#
# Usage: bash inbox-scripts/create-inboxes-gworkspace.sh
# ============================================================================
set -euo pipefail

DOMAIN="indiagully.com"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

banner() { echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"; }
ok()     { echo -e "  ${GREEN}✅ $1${NC}"; }
warn()   { echo -e "  ${YELLOW}⚠  $1${NC}"; }

banner "India Gully — Google Workspace Inbox Provisioning"
echo "  Domain: $DOMAIN | Users: 19 | Date: 21 Mar 2026"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# GROUP 1: System Critical inboxes (accounts with passwords + roles)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}▶ Group 1: System Critical${NC}"

# info@
gam create user info@${DOMAIN} \
  firstname "India Gully" lastname "Info" \
  password "$(openssl rand -base64 18)" \
  changepassword false
ok "info@${DOMAIN}"

# admin@
gam create user admin@${DOMAIN} \
  firstname "India Gully" lastname "Admin" \
  password "$(openssl rand -base64 18)" \
  changepassword false
gam user admin@${DOMAIN} update admin on
ok "admin@${DOMAIN} (Super Admin)"

# dpo@
gam create user dpo@${DOMAIN} \
  firstname "Data Protection" lastname "Officer" \
  password "$(openssl rand -base64 18)" \
  changepassword false
ok "dpo@${DOMAIN}"

# noreply@
gam create user noreply@${DOMAIN} \
  firstname "India Gully" lastname "No Reply" \
  password "$(openssl rand -base64 18)" \
  changepassword false
ok "noreply@${DOMAIN}"

# superadmin@
gam create user superadmin@${DOMAIN} \
  firstname "India Gully" lastname "SuperAdmin" \
  password "$(openssl rand -base64 18)" \
  changepassword false
gam user superadmin@${DOMAIN} update admin on
ok "superadmin@${DOMAIN} (Super Admin)"

# ─────────────────────────────────────────────────────────────────────────────
# GROUP 2: Leadership / Board
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Group 2: Leadership / Board${NC}"

gam create user akm@${DOMAIN} \
  firstname "Arun Kumar" lastname "Manikonda" \
  password "Arun@IG2026" \
  changepassword true
ok "akm@${DOMAIN} — Arun Manikonda (MD)"

gam create user pavan@${DOMAIN} \
  firstname "Pavan" lastname "Manikonda" \
  password "Pavan@IG2026" \
  changepassword true
ok "pavan@${DOMAIN} — Pavan Manikonda (ED)"

gam create user amit.jhingan@${DOMAIN} \
  firstname "Amit" lastname "Jhingan" \
  password "Amit@IG2026" \
  changepassword true
ok "amit.jhingan@${DOMAIN} — Amit Jhingan (KMP) ⚠ DSC renewal required"

# ─────────────────────────────────────────────────────────────────────────────
# GROUP 3: Employee inboxes
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Group 3: Employees${NC}"

gam create user riya.sharma@${DOMAIN} \
  firstname "Riya" lastname "Sharma" \
  password "Riya@IG2026" \
  changepassword true \
  employeeid "IG-EMP-0001" \
  department "Analytics"
ok "riya.sharma@${DOMAIN} (IG-EMP-0001)"

gam create user arjun.mehta@${DOMAIN} \
  firstname "Arjun" lastname "Mehta" \
  password "Arjun@IG2026" \
  changepassword true \
  employeeid "IG-EMP-0002" \
  department "Advisory"
ok "arjun.mehta@${DOMAIN} (IG-EMP-0002)"

gam create user priya.nair@${DOMAIN} \
  firstname "Priya" lastname "Nair" \
  password "Priya@IG2026" \
  changepassword true \
  employeeid "IG-EMP-0003" \
  department "Operations"
ok "priya.nair@${DOMAIN} (IG-EMP-0003)"

gam create user vikram.singh@${DOMAIN} \
  firstname "Vikram" lastname "Singh" \
  password "Vikram@IG2026" \
  changepassword true \
  employeeid "IG-EMP-0004" \
  department "Advisory"
ok "vikram.singh@${DOMAIN} (IG-EMP-0004)"

gam create user neha.joshi@${DOMAIN} \
  firstname "Neha" lastname "Joshi" \
  password "Neha@IG2026" \
  changepassword true \
  employeeid "IG-EMP-0005" \
  department "Analytics"
ok "neha.joshi@${DOMAIN} (IG-EMP-0005)"

# ─────────────────────────────────────────────────────────────────────────────
# GROUP 4: Functional alias groups (distribution lists)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Group 4: Functional Alias Groups${NC}"

# advisory@ → vikram.singh
gam create group advisory@${DOMAIN} name "Advisory Team"
gam update group advisory@${DOMAIN} add member vikram.singh@${DOMAIN}
ok "advisory@${DOMAIN} → vikram.singh"

# horeca@ → priya.nair
gam create group horeca@${DOMAIN} name "HoReCa Division"
gam update group horeca@${DOMAIN} add member priya.nair@${DOMAIN}
ok "horeca@${DOMAIN} → priya.nair"

# realestate@ → amit.jhingan
gam create group realestate@${DOMAIN} name "Real Estate Division"
gam update group realestate@${DOMAIN} add member amit.jhingan@${DOMAIN}
ok "realestate@${DOMAIN} → amit.jhingan"

# finance@ → admin
gam create group finance@${DOMAIN} name "Finance & Accounts"
gam update group finance@${DOMAIN} add member admin@${DOMAIN}
ok "finance@${DOMAIN} → admin"

# hr@ → priya.nair
gam create group hr@${DOMAIN} name "Human Resources"
gam update group hr@${DOMAIN} add member priya.nair@${DOMAIN}
ok "hr@${DOMAIN} → priya.nair"

# legal@ → admin
gam create group legal@${DOMAIN} name "Legal & Compliance"
gam update group legal@${DOMAIN} add member admin@${DOMAIN}
ok "legal@${DOMAIN} → admin"

echo ""
banner "✅ All 19 inboxes provisioned on $DOMAIN"
echo ""
echo "  Next steps:"
echo "  1. Update MX records in Cloudflare DNS → Google Workspace MX"
echo "  2. Verify domain ownership in Google Workspace Admin"
echo "  3. Set up SPF: v=spf1 include:_spf.google.com include:sendgrid.net ~all"
echo "  4. Set up DKIM: Admin console → Apps → Gmail → Authenticate email"
echo "  5. Set up DMARC: _dmarc TXT → v=DMARC1; p=quarantine; rua=mailto:dpo@indiagully.com"
echo "  6. Verify noreply@ in SendGrid as sender"
