#!/usr/bin/env bash
# FestSchmiede Installer – Logging

_log_ts() { date '+%Y-%m-%d %H:%M:%S'; }

log_info() {
  echo "[$(_log_ts)] INFO  $*" | tee -a "$LOG_FILE"
}

log_warn() {
  echo "[$(_log_ts)] WARN  $*" | tee -a "$LOG_FILE" >&2
}

log_error() {
  echo "[$(_log_ts)] ERROR $*" | tee -a "$LOG_FILE" >&2
}

log_debug() {
  [[ "${INSTALLER_DEBUG:-}" == "1" ]] && echo "[$(_log_ts)] DEBUG $*" >>"$LOG_FILE"
}

show_log_path() {
  echo "$LOG_FILE"
}
