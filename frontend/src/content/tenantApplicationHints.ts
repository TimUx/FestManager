export interface ApplicationFieldHint {
  title: string;
  example: string;
  minLength?: number;
}

export const TENANT_APPLICATION_FIELD_HINTS = {
  reason: {
    title: 'Warum wird FestSchmiede benötigt?',
    minLength: 20,
    example:
      'Beispiel: „Wir organisieren jährlich unser Vereinsfest mit über 500 Gästen. Bisher lief die Speisenbestellung über Zettel und Funkgeräte – wir suchen eine übersichtliche digitale Lösung für Küche, Abholung und Wartezeiten.“',
  },
  desiredFeatures: {
    title: 'Welche Funktionen sollen genutzt werden?',
    minLength: 10,
    example:
      'Beispiel: „Online-Bestellung für Gäste per QR-Code, Küchenübersicht mit Bestellstatus, Abholnummern am Tresen, Speisekarte selbst pflegen, Auswertung nach dem Fest.“',
  },
  freeTierJustification: {
    title: 'Warum ein kostenloser Mandant?',
    minLength: 20,
    example:
      'Beispiel: „Als gemeinnütziger Verein ohne Gewinnerzielungsabsicht haben wir kein Budget für kommerzielle Software. FestSchmiede würde unsere ehrenamtliche Arbeit beim Fest erheblich erleichtern.“',
  },
  plannedUsage: {
    title: 'Geplante Nutzung',
    minLength: 10,
    example:
      'Beispiel: „Einmal jährlich beim Sommerfest (2 Tage), voraussichtlich 200–400 Bestellungen. Zusätzlich ein kleineres Grillfest im Herbst.“',
  },
  notes: {
    title: 'Bemerkungen',
    example:
      'Beispiel: „Wir haben bereits Erfahrung mit ähnlichen Systemen und können bei Tests Feedback geben. Gewünschter Start: Frühjahr nächsten Jahres.“',
  },
} satisfies Record<string, ApplicationFieldHint>;
