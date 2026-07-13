export const PLATFORM_FEATURES = [
  { title: 'Bestellungen', description: 'Online-Bestellungen, Kassenverkauf und Statusverfolgung für Gäste und Helfer.' },
  { title: 'Küche', description: 'Übersichtliche Küchenansicht mit Echtzeit-Updates für reibungslose Abläufe.' },
  { title: 'Abholung', description: 'Abholboard und Benachrichtigungen, damit Gäste ihre Bestellung schnell erhalten.' },
  { title: 'Online-Zahlungen', description: 'Flexible Zahlungsanbieter für bargeldlose Abwicklung vor Ort und online.' },
  { title: 'Benachrichtigungen', description: 'E-Mail-Benachrichtigungen für Bestellungen, Status und Verwaltung.' },
  { title: 'Auswertungen', description: 'Dashboard und Statistiken für fundierte Entscheidungen während der Veranstaltung.' },
  { title: 'Veranstaltungsorganisation', description: 'Veranstaltungen, Speisen, Module und Einstellungen zentral verwalten.' },
];

export const PLATFORM_BENEFITS = [
  'Speziell für Vereine und gemeinnützige Organisationen entwickelt',
  'Mandantenfähig – jede Organisation erhält eine eigene Instanz',
  'Open Source – transparent, erweiterbar und unabhängig',
  'Modular – nur die Funktionen aktivieren, die wirklich gebraucht werden',
  'Responsive – funktioniert auf Smartphone, Tablet und Desktop',
  'Ehrenamtlich gedacht – weniger Papierkram, mehr Zeit fürs Fest',
];

export const TARGET_GROUPS = [
  'Vereine und gemeinnützige Organisationen',
  'Schulen und Jugendgruppen',
  'Feuerwehren und Hilfsorganisationen',
  'Kommunen und kleinere Veranstaltungen',
  'Schützenfeste, Dorffeste und Vereinsfeste',
];

export const FAQ_ITEMS = [
  {
    q: 'Was kostet FestSchmiede?',
    a: 'FestSchmiede ist Open Source. Der Betrieb kann selbst gehostet oder über einen Plattform-Mandanten erfolgen. Für gemeinnützige Organisationen kann ein kostenloser Mandant beantragt werden.',
  },
  {
    q: 'Ist FestSchmiede Open Source?',
    a: 'Ja. Der Quellcode ist auf GitHub verfügbar. Sie können mitlesen, Verbesserungen vorschlagen und selbst hosten.',
  },
  {
    q: 'Wer darf einen Mandanten beantragen?',
    a: 'Vereine, gemeinnützige Organisationen, Schulen, Hilfsorganisationen und ähnliche Gruppen, die FestSchmiede für ihre Veranstaltungen nutzen möchten.',
  },
  {
    q: 'Kann ich FestSchmiede selbst hosten?',
    a: 'Ja. Die Plattform kann eigenständig betrieben werden. Dokumentation und Quellcode unterstützen Sie beim Setup.',
  },
  {
    q: 'Welche Zahlungsanbieter werden unterstützt?',
    a: 'FestSchmiede unterstützt modulare Zahlungsintegrationen. Konkrete Anbieter hängen von der Mandanten-Konfiguration ab.',
  },
  {
    q: 'Brauche ich technisches Know-how?',
    a: 'Für den täglichen Betrieb nicht. Die Verwaltung ist webbasiert. Für Self-Hosting sind grundlegende Server-Kenntnisse hilfreich.',
  },
];

export const ORDER_PROCESS_STEPS = [
  {
    title: 'Bestellen',
    description:
      'Gäste wählen Speisen und Getränke auf der öffentlichen Bestellseite – am Smartphone, Tablet oder am Monitor vor Ort. Die Bestellung geht direkt ins System.',
    screenshot: '/screenshots/01-bestellseite-monitor.png',
    screenshotAlt: 'Öffentliche Bestellseite auf einem Monitor',
  },
  {
    title: 'Küche',
    description:
      'Die Küche sieht alle offenen Bestellungen in Echtzeit. Helfer können Positionen abhaken, Prioritäten erkennen und den Überblick behalten – auch auf dem Tablet.',
    screenshot: '/screenshots/07-kuechenansicht-tablet.png',
    screenshotAlt: 'Küchenansicht mit offenen Bestellungen auf einem Tablet',
  },
  {
    title: 'Abholbereit',
    description:
      'Ist eine Bestellung fertig, markiert die Küche sie als abholbereit. Das Abholboard und die Gäste werden automatisch informiert – kein Zurufen nötig.',
    screenshot: '/screenshots/04-abholboard-monitor.png',
    screenshotAlt: 'Abholboard mit abholbereiten Bestellungen',
  },
  {
    title: 'Abholung',
    description:
      'Gäste holen ihre Bestellung am Tresen ab. Über die Bestellnummer oder den Status-Link sehen sie jederzeit, ob ihre Bestellung noch in Arbeit ist oder bereit liegt.',
    screenshot: '/screenshots/02-kundenstatus.png',
    screenshotAlt: 'Bestellstatus für Gäste mit Abholnummer',
  },
];

export const SCREENSHOTS = [
  { src: '/screenshots/06-dashboard.png', title: 'Dashboard', alt: 'FestSchmiede Dashboard mit Statistiken' },
  { src: '/screenshots/09-bestellung.png', title: 'Bestellung', alt: 'Öffentliche Bestellseite' },
  { src: '/screenshots/07-kuechenansicht-tablet.png', title: 'Küche', alt: 'Küchenansicht auf dem Tablet' },
  { src: '/screenshots/21-payment-admin.png', title: 'Zahlungen', alt: 'Zahlungseinstellungen in der Administration' },
  { src: '/screenshots/16-admin-uebersicht.png', title: 'Administration', alt: 'Administrationsübersicht' },
  { src: '/screenshots/20-modulverwaltung.png', title: 'Module', alt: 'Modulverwaltung' },
];

export const ORGANIZATION_TYPES = [
  'Verein',
  'Gemeinnützige Organisation',
  'Schule / Bildungseinrichtung',
  'Feuerwehr / Hilfsorganisation',
  'Kommune / Öffentliche Einrichtung',
  'Sonstige',
];
