# ADR 036: Environment Detection

## Status

Accepted (v2.2.0)

## Entscheidung

`installer/lib/detect.sh` erkennt automatisch:

- OS/Distribution, CPU, RAM, Architektur
- Docker und Compose
- Docker-Netzwerke, Volumes, Container
- Reverse Proxy (Traefik, NGINX, Caddy, Apache, HAProxy)
- Firewall (ufw, firewalld, iptables)
- Port-Belegung (80, 443, 3001, 5173)
- Bestehende FestSchmiede-Installation

Erkannte Werte werden als Standardvorschläge im Wizard verwendet.

## Konsequenzen

- Weniger manuelle Eingaben
- Bestehende Infrastruktur wird respektiert
