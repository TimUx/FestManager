import { prisma } from '../config/database';

export type PlatformLegalPageType = 'impressum' | 'datenschutz' | 'nutzungsbedingungen';

export interface PlatformLegalTemplateContext {
  platformName: string;
  operatorName: string;
  operatorAddress: string;
  operatorEmail: string;
  operatorEmailRaw: string;
  operatorPhone: string;
  website: string;
  baseDomain: string;
}

function readString(settings: Record<string, unknown>, key: string): string {
  const value = settings[key];
  return typeof value === 'string' ? value.trim() : '';
}

function placeholder(label: string, value: string): string {
  return value || `<strong>[${label} – bitte in Plattform → Einstellungen ergänzen]</strong>`;
}

export async function buildPlatformLegalTemplateContext(): Promise<PlatformLegalTemplateContext> {
  const rows = await prisma.platformSettings.findMany();
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  const platformName = readString(settings, 'platform.name') || 'FestSchmiede';
  const baseDomain = readString(settings, 'platform.baseDomain') || 'example.de';
  const contactName = readString(settings, 'platform.contact.name');
  const contactAddress = readString(settings, 'platform.contact.address');
  const contactEmail = readString(settings, 'platform.contact.email');
  const contactPhone = readString(settings, 'platform.contact.phone');
  const contactWebsite = readString(settings, 'platform.contact.website');

  return {
    platformName,
    operatorName: placeholder('Name des Plattformbetreibers', contactName),
    operatorAddress: placeholder('Anschrift (Straße, PLZ Ort)', contactAddress),
    operatorEmail: placeholder('Kontakt-E-Mail', contactEmail),
    operatorEmailRaw: contactEmail,
    operatorPhone: contactPhone
      ? contactPhone
      : '<em>[Telefon optional – in Plattform → Einstellungen ergänzen]</em>',
    website: contactWebsite || `https://www.${baseDomain}`,
    baseDomain,
  };
}

function disclaimer(): string {
  return `<p><em>Dieser Text ist ein Mustervorschlag zur Orientierung und ersetzt keine Rechtsberatung. Bitte prüfen und anpassen Sie ihn vor Veröffentlichung an Ihre konkrete Situation — idealerweise mit rechtlicher Unterstützung.</em></p>`;
}

function impressumTemplate(ctx: PlatformLegalTemplateContext): string {
  return `${disclaimer()}
<h1>Impressum</h1>
<p>Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV (sofern redaktionelle Inhalte bereitgestellt werden):</p>

<h2>Anbieter dieser Plattform</h2>
<p>
  ${ctx.operatorName}<br>
  ${ctx.operatorAddress}
</p>

<h2>Kontakt</h2>
<p>
  E-Mail: ${ctx.operatorEmailRaw ? `<a href="mailto:${ctx.operatorEmailRaw}">${ctx.operatorEmailRaw}</a>` : ctx.operatorEmail}<br>
  Telefon: ${ctx.operatorPhone}<br>
  Website: <a href="${ctx.website}" rel="noopener noreferrer">${ctx.website}</a>
</p>

<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>${ctx.operatorName}<br>${ctx.operatorAddress}</p>

<h2>Plattform ${ctx.platformName}</h2>
<p>
  ${ctx.platformName} ist eine mandantenfähige Open-Source-Plattform für Veranstaltungs-Bestellungen
  (Vorausbestellung, Küche, Abholung, Kasse und Administration). Die Plattform wird unter der Domain
  <strong>${ctx.baseDomain}</strong> betrieben. Mandanten (z.&nbsp;B. Vereine) erhalten einen eigenen
  Bereich unter einem Pfad wie <code>https://app.${ctx.baseDomain}/&lt;mandant&gt;/</code>.
</p>

<h2>Haftung für Inhalte der Mandanten</h2>
<p>
  Die auf Mandanten-Bereichen veröffentlichten Inhalte (Speisekarten, Veranstaltungsdaten, Bestellungen,
  rechtliche Texte der Vereine usw.) werden von den jeweiligen Mandanten verantwortet. Für diese Inhalte
  ist der jeweilige Mandant Anbieter im Sinne des Telemediengesetzes; dieses Impressum betrifft die
  Plattform ${ctx.platformName} als Gesamtangebot.
</p>

<h2>Haftung für Links</h2>
<p>
  Unser Angebot kann Links zu externen Websites Dritter enthalten. Für deren Inhalte übernehmen wir keine
  Gewähr. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar. Eine permanente
  inhaltliche Kontrolle ist ohne konkrete Anhaltspunkte nicht zumutbar.
</p>

<h2>Streitbeilegung</h2>
<p>
  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
  <a href="https://ec.europa.eu/consumers/odr/" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.
  Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
  Verbraucherschlichtungsstelle teilzunehmen, sofern nicht gesetzlich zwingend.
</p>`;
}

function datenschutzTemplate(ctx: PlatformLegalTemplateContext): string {
  return `${disclaimer()}
<h1>Datenschutzerklärung</h1>
<p>
  Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst. Nachfolgend informieren wir Sie über die
  Verarbeitung personenbezogener Daten beim Besuch und der Nutzung der Plattform <strong>${ctx.platformName}</strong>
  (Website unter <strong>${ctx.baseDomain}</strong>).
</p>

<h2>1. Verantwortlicher</h2>
<p>
  ${ctx.operatorName}<br>
  ${ctx.operatorAddress}<br>
  E-Mail: ${ctx.operatorEmail}
</p>

<h2>2. Überblick über die Verarbeitung</h2>
<p>Wir verarbeiten personenbezogene Daten insbesondere zu folgenden Zwecken:</p>
<ul>
  <li>Bereitstellung und Betrieb der Plattform (technischer Betrieb, Sicherheit, Fehleranalyse)</li>
  <li>Verwaltung von Plattform-Administratoren und Mandanten-Bewerbungen</li>
  <li>Kommunikation per E-Mail (z.&nbsp;B. Bestätigungen, Systemnachrichten), sofern konfiguriert</li>
  <li>Erfüllung gesetzlicher Pflichten</li>
</ul>
<p>
  Für Bestellungen, Kundenkonten und Veranstaltungsdaten in Mandanten-Bereichen ist in der Regel der
  jeweilige Mandant (Verein/Veranstalter) Verantwortlicher. Dort gelten — sofern veröffentlicht — die
  Datenschutzhinweise des Mandanten.
</p>

<h2>3. Rechtsgrundlagen (Art. 6 DSGVO)</h2>
<ul>
  <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung bzw. vorvertragliche Maßnahmen (z.&nbsp;B. Mandantenbewerbung, Plattformnutzung durch Administratoren)</li>
  <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — berechtigtes Interesse (Betrieb, IT-Sicherheit, Missbrauchsprävention, Protokollierung)</li>
  <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — rechtliche Verpflichtung, soweit einschlägig</li>
  <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung, sofern wir diese ausdrücklich einholen (z.&nbsp;B. optionale Cookies oder Newsletter)</li>
</ul>

<h2>4. Hosting und technische Protokolldaten</h2>
<p>
  Beim Aufruf unserer Seiten werden durch den Browser automatisch Informationen an unseren Server übermittelt
  (z.&nbsp;B. IP-Adresse, Datum/Uhrzeit, angeforderte URL, User-Agent, Referrer). Diese Daten werden in
  Server-Logfiles verarbeitet, um den stabilen Betrieb und die Sicherheit der Plattform zu gewährleisten.
  Logdaten werden nur so lange gespeichert, wie es für den Zweck erforderlich ist.
</p>
<p>
  Die Plattform wird in der Regel auf eigener oder gemieteter Infrastruktur betrieben. Sofern externe
  Hosting- oder Infrastruktur-Dienstleister eingesetzt werden, werden diese als Auftragsverarbeiter
  vertraglich gebunden (<strong>[Hosting-Anbieter und Standort ergänzen]</strong>).
</p>

<h2>5. Cookies und lokale Speicherung</h2>
<p>
  Wir setzen technisch notwendige Cookies bzw. vergleichbare Technologien ein, die für Login, Sitzungen
  und die sichere Nutzung der Plattform erforderlich sind. Diese können nicht abgewählt werden, solange
  Sie die Plattform nutzen möchten.
</p>
<p>
  Sofern darüber hinaus Analyse- oder Marketing-Cookies eingesetzt werden, holen wir vorab Ihre Einwilligung
  ein und informieren gesondert über Art, Umfang und Widerrufsmöglichkeit.
</p>

<h2>6. Mandanten-Bewerbung</h2>
<p>
  Wenn Sie eine Mandanten-Bewerbung stellen, verarbeiten wir die von Ihnen angegebenen Daten
  (z.&nbsp;B. Organisation, Ansprechpartner, Adresse, E-Mail, Telefon, gewünschter Pfad/Slug, Angaben zur
  geplanten Nutzung). Die Verarbeitung dient der Prüfung und Bearbeitung Ihrer Anfrage.
</p>
<p>Speicherdauer: bis zur abschließenden Bearbeitung der Bewerbung, längstens jedoch <strong>[Frist ergänzen, z.&nbsp;B. 24 Monate]</strong>, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

<h2>7. Plattform- und Mandanten-Administratoren</h2>
<p>
  Für Plattform- und Mandanten-Administratoren verarbeiten wir Kontodaten (z.&nbsp;B. Name, E-Mail,
  Rollen/Berechtigungen, Anmeldezeitpunkte) zur Verwaltung des Zugangs und zur Nachvollziehbarkeit
  administrativer Aktionen (Audit-Logs), soweit aktiviert.
</p>

<h2>8. E-Mail-Versand</h2>
<p>
  Sofern ein SMTP-Server konfiguriert ist, können System-E-Mails (z.&nbsp;B. Passwort-Reset, Benachrichtigungen)
  über diesen versendet werden. Dabei werden Empfängeradresse, Betreff und Inhalt verarbeitet.
  <strong>[SMTP-Anbieter und ggf. Auftragsverarbeitungsvertrag ergänzen]</strong>.
</p>

<h2>9. Empfänger und Drittlandübermittlung</h2>
<p>
  Eine Weitergabe an Dritte erfolgt nur, wenn dies zur Vertragserfüllung erforderlich ist, wir gesetzlich
  dazu verpflichtet sind oder Sie eingewilligt haben. Eine Übermittlung in Drittländer findet nur statt,
  wenn geeignete Garantien (z.&nbsp;B. Angemessenheitsbeschluss, Standardvertragsklauseln) vorliegen —
  <strong>[falls zutreffend konkretisieren]</strong>.
</p>

<h2>10. Speicherdauer</h2>
<p>
  Personenbezogene Daten werden gelöscht, sobald der Zweck entfällt und keine gesetzlichen
  Aufbewahrungspflichten entgegenstehen. Konkrete Fristen können je nach Datenkategorie variieren
  (z.&nbsp;B. Bewerbungen, Logfiles, Vertragsdaten).
</p>

<h2>11. Ihre Rechte</h2>
<p>Sie haben gegenüber uns folgende Rechte, soweit die gesetzlichen Voraussetzungen erfüllt sind:</p>
<ul>
  <li>Auskunft (Art. 15 DSGVO)</li>
  <li>Berichtigung (Art. 16 DSGVO)</li>
  <li>Löschung (Art. 17 DSGVO)</li>
  <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
  <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
  <li>Widerspruch gegen Verarbeitung (Art. 21 DSGVO)</li>
  <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
</ul>
<p>
  Zur Ausübung Ihrer Rechte wenden Sie sich an: ${ctx.operatorEmail}.
  Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
</p>

<h2>12. Änderungen</h2>
<p>
  Wir passen diese Datenschutzerklärung an, wenn sich Rechtslage, Plattformfunktionen oder unsere
  Verarbeitungstätigkeiten ändern. Es gilt die jeweils veröffentlichte Fassung auf dieser Seite.
</p>
<p><em>Stand: ${new Date().toLocaleDateString('de-DE')}</em></p>`;
}

function nutzungsbedingungenTemplate(ctx: PlatformLegalTemplateContext): string {
  return `${disclaimer()}
<h1>Nutzungsbedingungen</h1>
<p>
  Diese Nutzungsbedingungen regeln die Nutzung der Plattform <strong>${ctx.platformName}</strong>
  unter <strong>${ctx.baseDomain}</strong> durch Besucher, Bewerber und autorisierte Nutzer
  (Plattform- und Mandanten-Administratoren). Mit der Nutzung erkennen Sie diese Bedingungen an,
  soweit sie für Sie gelten.
</p>

<h2>1. Anbieter</h2>
<p>
  Anbieter ist ${ctx.operatorName}, ${ctx.operatorAddress} (Kontakt: ${ctx.operatorEmail}).
</p>

<h2>2. Leistungsbeschreibung</h2>
<p>
  ${ctx.platformName} ist eine Software-Plattform zur Organisation von Veranstaltungs-Bestellungen.
  Mandanten (z.&nbsp;B. Vereine) können eigene Bereiche einrichten und Veranstaltungen, Speisekarten,
  Bestellungen und Mitarbeiter-Zugänge verwalten. Der konkrete Funktionsumfang kann je nach Konfiguration,
  Lizenz und aktivierten Modulen variieren.
</p>

<h2>3. Zugang und Mandanten-Bewerbungen</h2>
<p>
  Die Einrichtung neuer Mandanten erfolgt nach Prüfung durch den Plattformbetreiber und nur, wenn
  Mandantenbewerbungen aktiviert sind. Der Plattformbetreiber kann Bewerbungen ohne Angabe von Gründen
  ablehnen. Ein Anspruch auf Freischaltung besteht nicht.
</p>
<p>
  Bei der Bewerbung sind wahrheitsgemäße Angaben zu machen. Der gewünschte Pfad (Slug) darf keine
  Rechte Dritter verletzen und muss den Vorgaben des Plattformbetreibers entsprechen.
</p>

<h2>4. Pflichten der Nutzer</h2>
<ul>
  <li>Zugangsdaten geheim halten und unverzüglich melden, wenn Missbrauch vermutet wird</li>
  <li>Keine rechtswidrigen, beleidigenden oder irreführenden Inhalte veröffentlichen</li>
  <li>Keine Handlungen vornehmen, die die Sicherheit oder Verfügbarkeit der Plattform beeinträchtigen</li>
  <li>Geltendes Recht einhalten, insbesondere bei Bestellungen, Zahlungen und Kundenkommunikation im Mandanten-Bereich</li>
  <li>Eigene Impressums-, Datenschutz- und Vertragsinformationen im Mandanten-Bereich pflegen, soweit erforderlich</li>
</ul>

<h2>5. Verfügbarkeit und Wartung</h2>
<p>
  Wir bemühen uns um einen störungsfreien Betrieb, garantieren jedoch keine ununterbrochene Verfügbarkeit.
  Wartungsarbeiten, Updates und Sicherheitsmaßnahmen können zu vorübergehenden Einschränkungen führen.
  Geplante Wartungen werden — soweit möglich — vorab angekündigt.
</p>

<h2>6. Open Source und Weiterentwicklung</h2>
<p>
  ${ctx.platformName} basiert auf Open-Source-Software. Funktionen können sich durch Updates ändern.
  Der Plattformbetreiber kann Features anpassen, ergänzen oder einstellen, sofern berechtigte Interessen
  oder technische Gründe dies erfordern.
</p>

<h2>7. Haftung</h2>
<p>
  Der Plattformbetreiber haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden
  aus der Verletzung von Leben, Körper oder Gesundheit. Bei leicht fahrlässiger Verletzung wesentlicher
  Vertragspflichten ist die Haftung auf den vorhersehbaren, typischerweise eintretenden Schaden begrenzt.
  Im Übrigen ist die Haftung — soweit gesetzlich zulässig — ausgeschlossen.
</p>
<p>
  Für Inhalte, Bestellungen, Zahlungsabwicklungen und rechtliche Texte in Mandanten-Bereichen sind
  die jeweiligen Mandanten verantwortlich.
</p>

<h2>8. Sperrung und Kündigung</h2>
<p>
  Der Plattformbetreiber kann Zugänge vorübergehend sperren oder dauerhaft beenden, wenn Nutzer gegen
  diese Bedingungen verstoßen, Sicherheitsrisiken bestehen oder gesetzliche Gründe dies erfordern.
  Mandanten-Verträge können gesonderten Kündigungsregeln unterliegen — <strong>[falls zutreffend ergänzen]</strong>.
</p>

<h2>9. Änderungen der Nutzungsbedingungen</h2>
<p>
  Wir können diese Nutzungsbedingungen anpassen. Wesentliche Änderungen werden in geeigneter Form
  bekannt gegeben. Widersprechen registrierte Nutzer nicht innerhalb einer angemessenen Frist, gelten
  die geänderten Bedingungen als angenommen, soweit dies rechtlich zulässig ist.
</p>

<h2>10. Anwendbares Recht</h2>
<p>
  Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine
  zwingenden Verbraucherschutzvorschriften entgegenstehen. Gerichtsstand für Kaufleute ist — soweit
  zulässig — <strong>[Ort ergänzen]</strong>.
</p>
<p><em>Stand: ${new Date().toLocaleDateString('de-DE')}</em></p>`;
}

const TEMPLATES: Record<PlatformLegalPageType, (ctx: PlatformLegalTemplateContext) => string> = {
  impressum: impressumTemplate,
  datenschutz: datenschutzTemplate,
  nutzungsbedingungen: nutzungsbedingungenTemplate,
};

export function isPlatformLegalPageType(pageType: string): pageType is PlatformLegalPageType {
  return pageType in TEMPLATES;
}

export function renderPlatformLegalTemplate(
  pageType: PlatformLegalPageType,
  context: PlatformLegalTemplateContext
): string {
  return TEMPLATES[pageType](context);
}

export async function buildPlatformLegalExampleContent(pageType: string): Promise<string | null> {
  if (!isPlatformLegalPageType(pageType)) return null;
  const context = await buildPlatformLegalTemplateContext();
  return renderPlatformLegalTemplate(pageType, context);
}
