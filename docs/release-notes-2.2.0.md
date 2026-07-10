# FestSchmiede 2.2.0 – Professioneller interaktiver Installer

**Veröffentlichung:** 2026-07-10

## Highlights

### Interaktiver TUI-Installations-Assistent

- Einstieg über `./install.sh`
- 13-stufiger Wizard mit Vor/Zurück/Abbrechen
- TUI via `dialog` (Debian/Ubuntu), optional `gum`
- Automatische Systemanalyse (OS, Docker, Netzwerke, Reverse Proxy, Ports)
- Automatische Generierung von `.env` und `compose.override.yml`
- Sichere Zufallswerte für JWT, Encryption, Datenbank, Admin-Passwort
- Fortschrittsanzeige während der Installation
- Rollback bei Fehlern mit Pre-Install-Backup
- Vollständiges Installationsprotokoll

### Installationsmodi

- Neuinstallation, Upgrade, Migration, Reparatur, Nur Konfiguration

### Dokumentation

- Neue [Installationsanleitung](INSTALLATION.md)
- ADRs 034–038
- Aktualisiertes README mit Installer-Schnellstart

## Verzeichnisstruktur

```
installer/
  install.sh          # Haupt-Assistent
  lib/                # TUI, Erkennung, Config, Docker, Rollback
  tests/run-tests.sh  # Automatisierte Tests
  logs/               # Installationsprotokolle
  generated/          # Erzeugte Compose-Overrides
```

## Tests

```bash
./installer/tests/run-tests.sh
# Ergebnis: 16 Tests bestanden
```

## ADRs

- [034 – Interactive Installer](architecture/034-interactive-installer.md)
- [035 – Installation Wizard](architecture/035-installation-wizard.md)
- [036 – Environment Detection](architecture/036-environment-detection.md)
- [037 – Configuration Generation](architecture/037-configuration-generation.md)
- [038 – Rollback Strategy](architecture/038-rollback-strategy.md)
