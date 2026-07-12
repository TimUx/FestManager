# ADR 035: Installation Wizard

## Status

Accepted (v2.2.0)

## Entscheidung

Der Wizard in `installer/lib/wizard.sh` implementiert konfigurierbare Schritte mit persistentem State in `.installer-state/install.state`.

Schritte: Willkommen → Installationspfad → Systemanalyse → Modus → Docker → **Ausrollung (Compose/Swarm)** → Reverse Proxy → Proxy-Netzwerk (optional) → Domain → Plattform → DB → Redis → Mail → Sicherheit → Zusammenfassung.

Bei **Docker Swarm** erzeugt der Installer `stack.yml` mit `deploy.labels` für Traefik (@swarm), Placement-Constraint auf dem Installations-Host (`node.id`) und 1 Replica pro Service. Docker Secrets werden für sensible Werte angelegt.

Navigation über `tui_nav()` mit Zurück/Weiter/Abbrechen.

## Konsequenzen

- Wizard-State überlebt Unterbrechungen
- Schritte sind modular erweiterbar
