#!/usr/bin/env bash
# Postgres-Volume-Backup (N7)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${BACKUP_DIR}/vereinsbestellung-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

POSTGRES_USER="${POSTGRES_USER:-verein}"
POSTGRES_DB="${POSTGRES_DB:-vereinsbestellung}"
CONTAINER="${POSTGRES_CONTAINER:-vereins-postgres}"

docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"
echo "Backup erstellt: $FILE"
