# ADR-009: Printing Module

| Feld | Wert |
|------|------|
| **Status** | Accepted (implementiert) |
| **Datum** | 2026-07-08 |

## Ziel

Automatischen Bondruck für Küche und Kasse als optionales Modul bereitstellen. Der Core kennt keine Drucker-Backends – nur den `printerServiceRegistry` Extension Point.

## Motivation

Viele Vereine arbeiten mit Bondruckern in Küche und Abholung. Das Modul soll:

- bei neuer/bezahlter Bestellung Küchenbon drucken
- Kassenbon bei Vor-Ort-Bestellung optional drucken
- ESC/POS Netzwerk, PDF, Browser-Druck und Bluetooth (Platzhalter) unterstützen

## Architekturentscheidung

### Architektur

```
ORDER_CREATED / ORDER_PAID (Hook)
        ↓
PrintManager → PrinterRegistry → Adapter
        ├── EscPosNetworkAdapter   (TCP 9100, ESC/POS)
        ├── BrowserAdapter           (Socket.IO → window.print)
        ├── PdfAdapter               (minimal PDF ohne externe Deps)
        └── BluetoothAdapter         (Platzhalter, implemented: false)
```

Core optional: `printerServiceRegistry.printKitchenTicket()`

### Komponenten (`modules/printer/`)

| Komponente | Datei | Verantwortung |
|------------|-------|---------------|
| `PrinterService` | `services/PrinterServiceImpl.ts` | Extension-Point-Implementierung |
| `PrintManager` | `PrintManager.ts` | Dispatch, Discovery, Health, Order-Lookup |
| Socket-Brücke | `printJobEmitter.ts` | Browser/PDF → Socket.IO |
| `PrinterRegistry` | `PrinterRegistry.ts` | Adapter-Registry |
| Settings | `module.json` → `module.printer` | 3 Drucker-Slots, Auto-Print |
| Hooks | `hooks.ts` | `ORDER_CREATED`, `ORDER_PAID` |
| Templates | `services/TicketTemplateService.ts` | Küchenbon, Kassenbon |

### Adapter

| Adapter | `implemented` | Beschreibung |
|---------|---------------|--------------|
| ESC/POS Netzwerk | `true` | TCP Port 9100, Bondruck |
| Browser | `true` | `print:job` via Socket.IO → Küchen-Tablet |
| PDF | `true` | Minimal-PDF-Generator |
| Bluetooth | `false` | Platzhalter |

### Integration mit Payment

| Szenario | Druckzeitpunkt |
|----------|----------------|
| Barzahlung / Payment aus | Küchenbon bei `ORDER_CREATED` |
| Online + Payment aktiv | Küchenbon bei `ORDER_PAID` (nicht bei `ORDER_CREATED`) |
| Kassenbestellung | Optional Kassenbon bei `ORDER_CREATED` |

`printManager.shouldDeferOnlineKitchenPrint()` prüft `paymentServiceRegistry.isAvailable()`.

### Admin-UI

- `/admin/settings/module.printer` – Drucker, Auto-Print, Erkennung
- Test-Extension: Drucker 1–3 testen, Netzwerk-Scan
- API: `POST /api/modules/features/printer/admin/printers/:slotId/test`
- API: `GET /api/modules/features/printer/admin/discover`
- Staff: `POST /api/modules/features/printer/staff/kitchen/:orderId` (`printer.print`)

### Deaktivierungsverhalten

| Zustand | Verhalten |
|---------|-----------|
| Modul deaktiviert | Kein Auto-Druck; digitale Küchen-UI unverändert |
| Kein Drucker konfiguriert | `isAvailable()` = false |
| Modul installiert | Settings + Test/Erkennung ohne Aktivierung (`requireActivation: false`) |

### Konfiguration

- Namespace: `module.printer`
- 3 Drucker-Slots (`printer1`–`printer3`) mit Typ, Host, Vorlage
- Discovery-Subnetz für ESC/POS-Scan (Port 9100)

## Vorteile

- Küche ohne Bildschirm möglich (Netzwerkdrucker)
- Optional – digitale Vereine unberührt
- Browser-Druck für Tablet-only Deployments

## Nachteile

- Drucker aus Docker-Netzwerk oft nicht erreichbar (Host-Netzwerk nötig)
- Bluetooth erfordert Web-Bluetooth-Integration (offen)
- ESC/POS-Umlaute limitiert (latin1)

## Auswirkungen

- `mapOrder` liefert `eventId` für Browser-Druck-Routing
- `emitPrintJob` in `socket/index.ts`; `printJobEmitter.ts` kapselt Modul-Zugriff
- Frontend: `printBridge.ts` in `StaffLayout` (Browser/PDF)

## Implementierungsstatus

| Komponente | Status |
|------------|--------|
| PrinterServiceRegistry | ✅ |
| ESC/POS Netzwerk | ✅ |
| PDF | ✅ |
| Browser-Druck | ✅ |
| Bluetooth | ⏳ Platzhalter |
| Hook-Subscriber | ✅ |
| Health Check | ✅ |
| Printer Discovery | ✅ |
| Admin Settings + Test | ✅ |

## Offene Punkte

- [ ] Bluetooth (Web Bluetooth API)
- [ ] Retry-Queue mit Persistenz
- [ ] Bon-Layout-Editor
- [ ] Mehrere Küchenstationen (Kategorie → Drucker)
- [ ] TSE/KassenSichV – Überschneidung mit `cash-register`-Modul
