# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Bitte melden Sie Sicherheitslücken **nicht** öffentlich als Issue.

1. E-Mail an den Maintainer (siehe GitHub-Profil des Repository-Besitzers)
2. Beschreibung, Schritte zur Reproduktion, Auswirkung
3. Antwort innerhalb von 7 Werktagen

## Sicherheitshinweise für Betreiber

- Setzen Sie `JWT_SECRET` und `APP_ENCRYPTION_KEY` (jeweils min. 32 Zeichen) in Produktion
- Postgres nicht öffentlich exponieren
- HTTPS vor der Anwendung terminieren
- Regelmäßige Backups (`scripts/backup/postgres-backup.sh`)
- `npm audit` und Dependency-Review-Workflow nutzen

## Bekannte Schutzmaßnahmen

- Rate Limiting auf Login und öffentliche Bestellungen
- Socket.IO-Authentifizierung für Mitarbeiter-Räume
- Stripe-Webhook-Signaturprüfung
- Verschlüsselte Modul-Settings (AES-256-GCM)
