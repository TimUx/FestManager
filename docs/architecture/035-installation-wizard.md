# ADR 035: Installation Wizard

## Status

Accepted (v2.2.0)

## Entscheidung

Der Wizard in `installer/lib/wizard.sh` implementiert 13 konfigurierbare Schritte mit persistentem State in `.installer-state/install.state`.

Schritte: Willkommen → Systemanalyse → Modus → Docker → Netzwerk → Proxy → Domain → Plattform → DB → Redis → Mail → Sicherheit → Module → Zusammenfassung.

Navigation über `tui_nav()` mit Zurück/Weiter/Abbrechen.

## Konsequenzen

- Wizard-State überlebt Unterbrechungen
- Schritte sind modular erweiterbar
