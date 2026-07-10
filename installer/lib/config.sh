#!/usr/bin/env bash
# FestSchmiede Installer – Konfigurationsgenerierung (.env, compose)

apply_defaults() {
  CFG[POSTGRES_USER]="${CFG[POSTGRES_USER]:-verein}"
  CFG[POSTGRES_DB]="${CFG[POSTGRES_DB]:-vereinsbestellung}"
  CFG[GHCR_IMAGE_PREFIX]="${CFG[GHCR_IMAGE_PREFIX]:-ghcr.io/timux/festschmiede}"
  CFG[IMAGE_TAG]="${CFG[IMAGE_TAG]:-latest}"
  CFG[JWT_EXPIRES_IN]="${CFG[JWT_EXPIRES_IN]:-8h}"
  CFG[DEFAULT_TENANT_SLUG]="${CFG[DEFAULT_TENANT_SLUG]:-default}"
  CFG[TRUSTED_PROXY_HOPS]="${CFG[TRUSTED_PROXY_HOPS]:-2}"
  CFG[LOG_FORMAT]="${CFG[LOG_FORMAT]:-json}"
  CFG[PLATFORM_NAME]="${CFG[PLATFORM_NAME]:-FestSchmiede}"
  CFG[PLATFORM_LOCALE]="${CFG[PLATFORM_LOCALE]:-de-DE}"
  CFG[PLATFORM_TIMEZONE]="${CFG[PLATFORM_TIMEZONE]:-Europe/Berlin}"

  if [[ "${CFG[INSTALL_PROFILE]:-}" == "production" ]]; then
    CFG[MULTI_TENANT_ENABLED]="true"
    CFG[PLATFORM_DOMAIN]="${CFG[PLATFORM_DOMAIN]:-festschmiede.local}"
    CFG[PLATFORM_WILDCARD_DOMAIN]="*.${CFG[PLATFORM_DOMAIN]}"
    CFG[WWW_SUBDOMAIN]="${CFG[WWW_SUBDOMAIN]:-www}"
    CFG[APP_SUBDOMAIN]="${CFG[APP_SUBDOMAIN]:-app}"
    CFG[API_SUBDOMAIN]="${CFG[API_SUBDOMAIN]:-api}"
    CFG[ACME_EMAIL]="${CFG[ACME_EMAIL]:-admin@${CFG[PLATFORM_DOMAIN]}}"
    CFG[CORS_ORIGIN]="https://${CFG[APP_SUBDOMAIN]:-app}.${CFG[PLATFORM_DOMAIN]}"
    CFG[VITE_API_URL]="https://${CFG[API_SUBDOMAIN]:-api}.${CFG[PLATFORM_DOMAIN]}"
    CFG[VITE_WS_URL]="https://${CFG[API_SUBDOMAIN]:-api}.${CFG[PLATFORM_DOMAIN]}"
    CFG[PLATFORM_ALLOWED_ORIGINS]="https://${CFG[PLATFORM_DOMAIN]},https://*.${CFG[PLATFORM_DOMAIN]}"
  else
    CFG[MULTI_TENANT_ENABLED]="false"
    CFG[PLATFORM_DOMAIN]="${CFG[PLATFORM_DOMAIN]:-localhost}"
    CFG[CORS_ORIGIN]="${CFG[CORS_ORIGIN]:-http://localhost:5173}"
    CFG[VITE_API_URL]="${CFG[VITE_API_URL]:-http://localhost:3001}"
    CFG[VITE_WS_URL]="${CFG[VITE_WS_URL]:-http://localhost:3001}"
  fi
}

build_compose_files() {
  COMPOSE_FILES=("-f" "${INSTALL_DIR}/docker-compose.yml")

  if [[ "${CFG[INSTALL_PROFILE]:-}" == "production" ]]; then
    COMPOSE_FILES+=("-f" "${INSTALL_DIR}/docker-compose.prod.yml")
  fi

  if [[ -f "${INSTALL_DIR}/installer/generated/compose.override.yml" ]]; then
    COMPOSE_FILES+=("-f" "${INSTALL_DIR}/installer/generated/compose.override.yml")
  fi
}

generate_compose_override() {
  local out="${INSTALL_DIR}/installer/generated"
  mkdir -p "$out"

  local network_name="${CFG[DOCKER_NETWORK]:-festschmiede_public}"
  local use_redis="${CFG[USE_REDIS]:-no}"

  cat >"${out}/compose.override.yml" <<EOF
# Automatisch generiert vom FestSchmiede Installer v${INSTALLER_VERSION}
# $(date -Iseconds)

services:
  backend:
    environment:
      PLATFORM_ADMIN_EMAIL: ${CFG[PLATFORM_ADMIN_EMAIL]:-platform@festschmiede.local}
      PLATFORM_ADMIN_PASSWORD: \${PLATFORM_ADMIN_PASSWORD}
EOF

  if [[ "$use_redis" == "yes" ]]; then
    cat >>"${out}/compose.override.yml" <<EOF
      REDIS_URL: redis://:\${REDIS_PASSWORD:-}@redis:6379
EOF
  fi

  if [[ "${CFG[SMTP_ENABLED]:-no}" == "yes" ]]; then
    cat >>"${out}/compose.override.yml" <<EOF
      INSTALL_SMTP_HOST: ${CFG[SMTP_HOST]:-}
      INSTALL_SMTP_PORT: ${CFG[SMTP_PORT]:-587}
EOF
  fi

  log_info "Compose-Override erzeugt: ${out}/compose.override.yml"
}

generate_env_file() {
  apply_defaults
  local env_file="${INSTALL_DIR}/.env"
  local backup="${BACKUP_DIR}/.env.$(date +%Y%m%d-%H%M%S)"

  if [[ -f "$env_file" ]]; then
    cp "$env_file" "$backup"
    log_info "Backup der .env: $backup"
  fi

  cat >"$env_file" <<EOF
# FestSchmiede – automatisch generiert vom Installer v${INSTALLER_VERSION}
# $(date -Iseconds)
# Modus: ${INSTALL_MODE} | Profil: ${CFG[INSTALL_PROFILE]:-local}

POSTGRES_USER=${CFG[POSTGRES_USER]}
POSTGRES_PASSWORD=${CFG[POSTGRES_PASSWORD]}
POSTGRES_DB=${CFG[POSTGRES_DB]}

GHCR_IMAGE_PREFIX=${CFG[GHCR_IMAGE_PREFIX]}
IMAGE_TAG=${CFG[IMAGE_TAG]}

JWT_SECRET=${CFG[JWT_SECRET]}
JWT_EXPIRES_IN=${CFG[JWT_EXPIRES_IN]}
APP_ENCRYPTION_KEY=${CFG[APP_ENCRYPTION_KEY]}

CORS_ORIGIN=${CFG[CORS_ORIGIN]}
VITE_API_URL=${CFG[VITE_API_URL]}
VITE_WS_URL=${CFG[VITE_WS_URL]}

MULTI_TENANT_ENABLED=${CFG[MULTI_TENANT_ENABLED]}
PLATFORM_DOMAIN=${CFG[PLATFORM_DOMAIN]}
PLATFORM_WILDCARD_DOMAIN=${CFG[PLATFORM_WILDCARD_DOMAIN]:-}
WWW_SUBDOMAIN=${CFG[WWW_SUBDOMAIN]:-www}
APP_SUBDOMAIN=${CFG[APP_SUBDOMAIN]:-app}
API_SUBDOMAIN=${CFG[API_SUBDOMAIN]:-api}
PLATFORM_ALLOWED_ORIGINS=${CFG[PLATFORM_ALLOWED_ORIGINS]:-}
DEFAULT_TENANT_SLUG=${CFG[DEFAULT_TENANT_SLUG]}
TRUSTED_PROXY_HOPS=${CFG[TRUSTED_PROXY_HOPS]}
LOG_FORMAT=${CFG[LOG_FORMAT]}

PLATFORM_ADMIN_EMAIL=${CFG[PLATFORM_ADMIN_EMAIL]:-platform@festschmiede.local}
PLATFORM_ADMIN_PASSWORD=${CFG[PLATFORM_ADMIN_PASSWORD]}

ACME_EMAIL=${CFG[ACME_EMAIL]:-}
REDIS_URL=${CFG[REDIS_URL]:-}

# Installer-Metadaten
INSTALLER_VERSION=${INSTALLER_VERSION}
INSTALL_MODULES=${CFG[INSTALL_MODULES]:-payment,legal,notifications}
INSTALL_PROFILE=${CFG[INSTALL_PROFILE]:-local}
EOF

  chmod 600 "$env_file"
  log_info ".env erzeugt: $env_file"
}

format_config_summary() {
  apply_defaults
  local s=""
  s+="Modus:           $INSTALL_MODE\n"
  s+="Profil:           ${CFG[INSTALL_PROFILE]:-local}\n"
  s+="Plattform:        ${CFG[PLATFORM_NAME]:-FestSchmiede}\n"
  s+="Domain:           ${CFG[PLATFORM_DOMAIN]}\n"
  s+="Datenbank:        ${CFG[DB_MODE]:-internal} (PostgreSQL)\n"
  s+="Redis:            ${CFG[USE_REDIS]:-no}\n"
  s+="Reverse Proxy:    ${CFG[PROXY_MODE]:-none}\n"
  s+="Docker-Netzwerk:  ${CFG[DOCKER_NETWORK]:-festschmiede_public}\n"
  s+="SMTP:             ${CFG[SMTP_ENABLED]:-no}\n"
  s+="Module:           ${CFG[INSTALL_MODULES]:-payment,legal,notifications}\n"
  s+="\n"
  s+="$(format_secrets_summary)"
  echo -e "$s"
}

get_access_urls() {
  apply_defaults
  if [[ "${CFG[INSTALL_PROFILE]}" == "production" ]]; then
    echo "Homepage:  https://${CFG[WWW_SUBDOMAIN]:-www}.${CFG[PLATFORM_DOMAIN]}"
    echo "APP:       https://${CFG[APP_SUBDOMAIN]:-app}.${CFG[PLATFORM_DOMAIN]}/platform"
    echo "Mandant:   https://<tenant>.${CFG[PLATFORM_DOMAIN]}"
  else
    echo "Frontend:  http://localhost:5173"
    echo "Backend:   http://localhost:3001"
    echo "Plattform: http://localhost:5173/platform"
  fi
}
