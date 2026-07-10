# ADR 037: Configuration Generation

## Status

Accepted (v2.2.0)

## Entscheidung

`installer/lib/config.sh` generiert automatisch:

- `.env` mit allen erforderlichen Variablen (chmod 600)
- `installer/generated/compose.override.yml` für profilspezifische Erweiterungen
- Compose-Dateiliste: `docker-compose.yml` + optional `docker-compose.prod.yml` + Override

Vorhandene `.env` wird vor Überschreiben nach `.installer-state/backups/` gesichert.

## Konsequenzen

- Keine manuelle Bearbeitung von Docker-Dateien nötig
- Upgrade-Pfad durch Erkennung vorhandener Werte
