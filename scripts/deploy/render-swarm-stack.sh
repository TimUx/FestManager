#!/usr/bin/env bash
# Rendert stack.yml aus .env (Installer-Logik)
# Swarm ignoriert .env – alle Werte werden in die Stack-Datei geschrieben.
#
# Verwendung:
#   bash scripts/deploy/render-swarm-stack.sh /srv/apps/festschmiede
#   docker stack deploy -c stack.yml festschmiede
set -euo pipefail

INSTALL_DIR="${1:-.}"
INSTALL_DIR="$(cd "$INSTALL_DIR" && pwd)"
INSTALLER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../installer" && pwd)"

export INSTALL_DIR INSTALLER_DIR
export LOG_FILE="${LOG_FILE:-/tmp/festschmiede-render-swarm.log}"

# shellcheck source=installer/lib/common.sh
source "${INSTALLER_DIR}/lib/common.sh"
source "${INSTALLER_DIR}/lib/config.sh"

load_existing_env || true
CFG[DEPLOYMENT_MODE]="swarm"

if [[ -z "${CFG[SWARM_NODE_ID]:-}" ]]; then
  detect_swarm
  CFG[SWARM_NODE_ID]="${SYS_DETECT[swarm_node_id]:-}"
  CFG[SWARM_NODE_HOSTNAME]="${SYS_DETECT[swarm_node_hostname]:-}"
fi

apply_defaults
generate_swarm_stack
cat "$(swarm_stack_publish_path)"
