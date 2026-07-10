# ADR 038: Installer Rollback Strategy

## Status

Accepted (v2.2.0)

## Entscheidung

Vor jeder Installation erstellt `create_pre_install_backup()` ein Backup von `.env` und `compose.override.yml`.

Bei Fehlern bietet `handle_install_error()`:

1. Erneut versuchen (max. 3 Versuche)
2. Rollback zur letzten Backup-Version
3. Protokoll anzeigen

Alle Aktionen werden in `installer/logs/install-*.log` protokolliert.

## Konsequenzen

- Fehlertolerante Installation
- Nachvollziehbare Fehleranalyse
