#!/usr/bin/env bash
# =============================================================================
# MyBMAD Dashboard — Quick Setup Script
# =============================================================================
# Creates a .env file with auto-generated secrets and sensible defaults.
# You only need to fill in the GitHub OAuth credentials manually afterward.
#
# Usage:  bash scripts/setup.sh
# =============================================================================

set -euo pipefail

ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  GREEN='' YELLOW='' CYAN='' BOLD='' NC=''
fi

echo -e "${BOLD}MyBMAD Dashboard — Environment Setup${NC}"
echo ""

# ------------------------------------------------------------------
# 1. Check if .env already exists
# ------------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Warning:${NC} $ENV_FILE already exists."
  read -rp "Overwrite it? (y/N) " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Aborted. Your existing $ENV_FILE was not modified."
    exit 0
  fi
  echo ""
fi

# ------------------------------------------------------------------
# 2. Check .env.example exists
# ------------------------------------------------------------------
if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "Error: $ENV_EXAMPLE not found. Run this script from the project root."
  exit 1
fi

# ------------------------------------------------------------------
# 3. Generate secrets
# ------------------------------------------------------------------
echo -e "${CYAN}Generating secrets...${NC}"

GENERATED_AUTH_SECRET=$(openssl rand -base64 32)
GENERATED_REVALIDATE_SECRET=$(openssl rand -hex 32)

echo "  BETTER_AUTH_SECRET  = (generated)"
echo "  REVALIDATE_SECRET   = (generated)"
echo ""

# ------------------------------------------------------------------
# 4. Create .env from template
# ------------------------------------------------------------------
cp "$ENV_EXAMPLE" "$ENV_FILE"

# Platform-compatible sed (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

"${SED_INPLACE[@]}" "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${GENERATED_AUTH_SECRET}|" "$ENV_FILE"
"${SED_INPLACE[@]}" "s|^REVALIDATE_SECRET=.*|REVALIDATE_SECRET=${GENERATED_REVALIDATE_SECRET}|" "$ENV_FILE"
"${SED_INPLACE[@]}" "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=http://localhost:3000|" "$ENV_FILE"
"${SED_INPLACE[@]}" "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://bmad:bmad_dev_password@localhost:5433/bmad_dashboard|" "$ENV_FILE"

echo -e "${GREEN}Created $ENV_FILE with auto-generated secrets.${NC}"
echo ""

# ------------------------------------------------------------------
# 5. Print remaining manual steps
# ------------------------------------------------------------------
echo -e "${BOLD}Remaining manual steps:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Create a GitHub OAuth App:"
echo "     https://github.com/settings/developers → New OAuth App"
echo ""
echo "     Application name:       MyBMAD (or anything)"
echo "     Homepage URL:           http://localhost:3000"
echo "     Authorization callback: http://localhost:3000/api/auth/callback/github"
echo ""
echo -e "  ${CYAN}2.${NC} Copy the Client ID and Client Secret into ${BOLD}.env${NC}:"
echo "     GITHUB_CLIENT_ID=<your client id>"
echo "     GITHUB_CLIENT_SECRET=<your client secret>"
echo ""
echo -e "  ${CYAN}3.${NC} (Optional) Create a GitHub PAT for higher rate limits:"
echo "     https://github.com/settings/tokens → Generate new token (classic)"
echo "     Required scope: public_repo (or repo for private repos)"
echo ""
echo -e "  ${CYAN}4.${NC} Start the database and run migrations:"
echo "     docker compose up -d postgres"
echo "     pnpm db:migrate"
echo ""
echo -e "  ${CYAN}5.${NC} Start the dev server:"
echo "     pnpm dev"
echo ""
echo -e "${GREEN}Done!${NC} Open http://localhost:3000 after completing the steps above."
