# ADR 034: Interactive Installer

## Status

Accepted (v2.2.0)

## Kontext

Die manuelle Installation (`.env` kopieren, Docker Compose starten) erfordert technisches Vorwissen und ist fehleranfällig.

## Entscheidung

Ein professioneller TUI-Installations-Assistent (`./install.sh`) führt Administratoren Schritt für Schritt durch die Installation.

- Einstieg: `install.sh` → `installer/install.sh`
- TUI-Backend: `dialog` (primär), `gum` (optional), `whiptail` (Fallback)
- 13 Wizard-Schritte mit Vor/Zurück/Abbrechen
- Idempotent und wiederholbar

## Konsequenzen

- Deutlich niedrigere Einstiegshürde für ehrenamtliche Administratoren
- Wartung des Installer-Codes als separates Modul unter `installer/`
