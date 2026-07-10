#!/usr/bin/env bash
# FestSchmiede Installer – TUI-Abstraktion (gum > dialog > whiptail)

TUI_BACKEND=""
DIALOG_HEIGHT=20
DIALOG_WIDTH=78

_detect_tui_backend() {
  if [[ -n "$TUI_BACKEND" ]]; then return 0; fi
  if command -v gum >/dev/null 2>&1; then
    TUI_BACKEND="gum"
  elif command -v dialog >/dev/null 2>&1; then
    TUI_BACKEND="dialog"
  elif command -v whiptail >/dev/null 2>&1; then
    TUI_BACKEND="whiptail"
  else
    TUI_BACKEND="plain"
  fi
  log_debug "TUI backend: $TUI_BACKEND"
}

_tui_backtitle() {
  echo "${PRODUCT_NAME} Installer v${INSTALLER_VERSION}"
}

tui_welcome() {
  _detect_tui_backend
  local platform="${SYS_DETECT[os_id]:-Linux} ${SYS_DETECT[os_version]:-}"
  local arch="${SYS_DETECT[arch]:-$(uname -m)}"
  local body
  body=$(cat <<EOF
Willkommen beim ${PRODUCT_NAME} Installationsassistenten

Version:    ${INSTALLER_VERSION}
Copyright:  © $(date +%Y) FestSchmiede – Open Source (MIT)

Plattform:  ${platform} (${arch})

Dieser Assistent führt Sie Schritt für Schritt durch die
Installation der FestSchmiede-Plattform.

Die Installation ist idempotent und kann jederzeit wiederholt werden.
Vorhandene Einstellungen werden erkannt und übernommen.

Protokoll: $(basename "$LOG_FILE")
EOF
)
  case "$TUI_BACKEND" in
    gum)
      gum style --border double --padding "1 2" --align center "$body"
      gum confirm "Installation starten?" && return 0 || return 1
      ;;
    dialog|whiptail)
      local cmd=$TUI_BACKEND
      $cmd --backtitle "$(_tui_backtitle)" \
        --title "Willkommen" \
        --yesno "$body\n\nInstallation starten?" "$DIALOG_HEIGHT" "$DIALOG_WIDTH"
      ;;
    *)
      echo "$body"
      read -r -p "Installation starten? [j/N] " ans
      [[ "$ans" =~ ^[jJyY] ]]
      ;;
  esac
}

tui_msgbox() {
  local title="$1" body="$2"
  _detect_tui_backend
  case "$TUI_BACKEND" in
    gum) gum style "$body"; read -r -p "Enter..." _ ;;
    dialog|whiptail)
      $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" --msgbox "$body" "$DIALOG_HEIGHT" "$DIALOG_WIDTH"
      ;;
    *) echo "=== $title ==="; echo "$body"; ;;
  esac
}

tui_yesno() {
  local title="$1" body="$2"
  _detect_tui_backend
  case "$TUI_BACKEND" in
    gum) gum confirm "$body" ;;
    dialog|whiptail)
      $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" --yesno "$body" "$DIALOG_HEIGHT" "$DIALOG_WIDTH"
      ;;
    *)
      read -r -p "$body [j/N] " ans
      [[ "$ans" =~ ^[jJyY] ]]
      ;;
  esac
}

tui_input() {
  local title="$1" prompt="$2" default="${3:-}"
  local result=""
  _detect_tui_backend
  case "$TUI_BACKEND" in
    gum)
      result=$(gum input --placeholder "$prompt" --value "$default" --width 60) || return 1
      ;;
    dialog|whiptail)
      result=$($TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --inputbox "$prompt" 10 70 "$default" 3>&1 1>&2 2>&3) || return 1
      ;;
    *)
      read -r -p "$prompt [$default]: " result
      result="${result:-$default}"
      ;;
  esac
  echo "$result"
}

tui_password() {
  local title="$1" prompt="$2"
  local result=""
  _detect_tui_backend
  case "$TUI_BACKEND" in
    gum)
      result=$(gum input --password --placeholder "$prompt" --width 60) || return 1
      ;;
    dialog|whiptail)
      result=$($TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --passwordbox "$prompt" 10 70 3>&1 1>&2 2>&3) || return 1
      ;;
    *)
      read -r -s -p "$prompt: " result; echo >&2
      ;;
  esac
  echo "$result"
}

tui_menu() {
  local title="$1" prompt="$2"
  shift 2
  local items=("$@")
  _detect_tui_backend
  case "$TUI_BACKEND" in
    gum)
      local -a choices=()
      local i=0
      while [[ $i -lt ${#items[@]} ]]; do
        choices+=("${items[$i]}" "${items[$((i+1))]}")
        i=$((i+2))
      done
      gum choose --header "$prompt" "${choices[@]}"
      ;;
    dialog|whiptail)
      local menu_args=()
      local i=0
      while [[ $i -lt ${#items[@]} ]]; do
        menu_args+=("${items[$i]}" "${items[$((i+1))]}")
        i=$((i+2))
      done
      $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --menu "$prompt" "$DIALOG_HEIGHT" "$DIALOG_WIDTH" 12 \
        "${menu_args[@]}" 3>&1 1>&2 2>&3
      ;;
    *)
      echo "$prompt"
      local i=0 n=1
      while [[ $i -lt ${#items[@]} ]]; do
        echo "  $n) ${items[$i]} – ${items[$((i+1))]}"
        n=$((n+1)); i=$((i+2))
      done
      read -r -p "Auswahl: " sel
      local idx=$(( (sel-1)*2 ))
      echo "${items[$idx]}"
      ;;
  esac
}

tui_checklist() {
  local title="$1" prompt="$2"
  shift 2
  local items=("$@")
  _detect_tui_backend
  case "$TUI_BACKEND" in
    dialog)
      local checklist_args=()
      local i=0
      while [[ $i -lt ${#items[@]} ]]; do
        checklist_args+=("${items[$i]}" "${items[$((i+1))]}" "${items[$((i+2))]}")
        i=$((i+3))
      done
      $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --checklist "$prompt" "$DIALOG_HEIGHT" "$DIALOG_WIDTH" 10 \
        "${checklist_args[@]}" 3>&1 1>&2 2>&3
      ;;
    whiptail)
      local checklist_args=()
      local i=0
      while [[ $i -lt ${#items[@]} ]]; do
        checklist_args+=("${items[$i]}" "${items[$((i+1))]}" "${items[$((i+2))]}")
        i=$((i+3))
      done
      $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --checklist "$prompt" "$DIALOG_HEIGHT" "$DIALOG_WIDTH" 10 \
        "${checklist_args[@]}" 3>&1 1>&2 2>&3
      ;;
    *)
      echo "$prompt (kommagetrennt eingeben):"
      local i=0
      while [[ $i -lt ${#items[@]} ]]; do
        echo "  [${items[$((i+2))]}] ${items[$i]} – ${items[$((i+1))]}"
        i=$((i+3))
      done
      read -r -p "Module: " sel
      echo "$sel"
      ;;
  esac
}

tui_radiolist() {
  local title="$1" prompt="$2"
  shift 2
  local items=("$@")
  _detect_tui_backend
  case "$TUI_BACKEND" in
    dialog)
      local args=()
      local i=0
      while [[ $i -lt ${#items[@]} ]]; do
        args+=("${items[$i]}" "${items[$((i+1))]}" "${items[$((i+2))]}")
        i=$((i+3))
      done
      $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --radiolist "$prompt" "$DIALOG_HEIGHT" "$DIALOG_WIDTH" 10 \
        "${args[@]}" 3>&1 1>&2 2>&3
      ;;
    *)
      tui_menu "$title" "$prompt" "${items[@]}"
      ;;
  esac
}

tui_gauge() {
  local title="$1" percent="$2" message="$3"
  _detect_tui_backend
  case "$TUI_BACKEND" in
    dialog)
      echo "$percent" | $TUI_BACKEND --backtitle "$(_tui_backtitle)" --title "$title" \
        --gauge "$message" 8 70 0 2>&1
      ;;
    *)
      echo "[$percent%] $message"
      ;;
  esac
}

# Navigation: 0=back, 1=next, 2=cancel
tui_nav() {
  local step_name="$1"
  _detect_tui_backend
  case "$TUI_BACKEND" in
    dialog)
      local choice
      choice=$(dialog --backtitle "$(_tui_backtitle)" --title "Navigation" \
        --menu "Schritt: $step_name" 12 60 3 \
        "next" "Weiter" \
        "back" "Zurück" \
        "cancel" "Abbrechen" \
        3>&1 1>&2 2>&3) || { WIZARD_CANCELLED=1; return 2; }
      case "$choice" in
        back) return 0 ;;
        next) return 1 ;;
        cancel) WIZARD_CANCELLED=1; return 2 ;;
      esac
      ;;
    *)
      echo ""; echo "[$step_name] (b)=Zurück  (w)=Weiter  (a)=Abbrechen"
      read -r -p "> " nav
      case "$nav" in
        b|B) return 0 ;;
        a|A) WIZARD_CANCELLED=1; return 2 ;;
        *) return 1 ;;
      esac
      ;;
  esac
}

tui_summary_confirm() {
  local body="$1"
  tui_yesno "Zusammenfassung" "$body\n\nInstallation jetzt starten?"
}

tui_success() {
  local body="$1"
  tui_msgbox "Installation abgeschlossen" "$body"
}

tui_error_menu() {
  local msg="$1"
  _detect_tui_backend
  case "$TUI_BACKEND" in
    dialog)
      local choice
      choice=$(dialog --backtitle "$(_tui_backtitle)" --title "Fehler" \
        --menu "$msg" 14 70 4 \
        "retry" "Erneut versuchen" \
        "rollback" "Rollback durchführen" \
        "log" "Protokoll anzeigen" \
        "cancel" "Abbrechen" \
        3>&1 1>&2 2>&3) || echo "cancel"
      echo "$choice"
      ;;
    *)
      echo "FEHLER: $msg"
      echo "Optionen: retry / rollback / log"
      read -r -p "> " choice
      echo "${choice:-cancel}"
      ;;
  esac
}
