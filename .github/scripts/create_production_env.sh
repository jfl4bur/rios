#!/usr/bin/env bash
# create_production_env.sh
# Usage:
#   ./create_production_env.sh OWNER REPO [reviewer1 reviewer2 ...]
# Example:
#   ./create_production_env.sh jfl4bur rios jfl4bur other-user

set -euo pipefail
OWNER=${1:-}
REPO=${2:-}
shift 2 || true
REVIEWERS=("$@")
ENV_NAME=production

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 OWNER REPO [reviewer1 reviewer2 ...]"
  exit 2
fi

# Check gh CLI
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/ and authenticate (gh auth login)."
  exit 3
fi

echo "Creating environment '$ENV_NAME' on $OWNER/$REPO..."
# Create or update environment with minimal body
gh api --method PUT "/repos/${OWNER}/${REPO}/environments/${ENV_NAME}" -f wait_timer=0 >/dev/null

echo "Environment '${ENV_NAME}' created or updated."

UI_URL="https://github.com/${OWNER}/${REPO}/settings/environments/${ENV_NAME}"
echo "Open the environment settings to add required reviewers and protection rules:
  $UI_URL"

if [ ${#REVIEWERS[@]} -eq 0 ]; then
  echo "No reviewers provided. You can add required reviewers from the UI link above."
  exit 0
fi

echo "Reviewers provided: ${REVIEWERS[*]}"

cat <<'NOTE'
Important: Adding required reviewers via the API requires user or team IDs and the
appropriate JSON structure. The easiest and safest approach is to add reviewers
manually from the UI (link printed above).

If you prefer API automation, provide the numeric user IDs or team IDs and I can
generate the exact `gh api` payload for you. Example (not executed here):

  gh api --method PUT "/repos/OWNER/REPO/environments/production/protection" \
    -F '{"required_reviewers":[{"type":"User","id":123456}],"required_approving_review_count":1}'

Replace 123456 with the user id. To fetch a user's id:
  gh api /users/USERNAME --jq .id

NOTE

echo "Script completed. Now open the URL above and add reviewers (or provide user IDs to automate)."
exit 0
