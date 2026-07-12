import { Stack, Typography } from '@mui/material';
import { PlatformPublicLayout } from '@/components/PlatformPublicLayout';
import { BrandingHead } from '@/components/BrandingHead';
import { MarketingSection } from '@/components/marketing/MarketingLayout';

export function PlatformAboutProjectPage() {
  return (
    <PlatformPublicLayout>
      <BrandingHead titleSuffix="Über das Projekt" path="/ueber-das-projekt" />
      <MarketingSection title="Über das Projekt" subtitle="FestSchmiede – digitale Unterstützung für ehrenamtliche Veranstaltungen.">
        <Stack spacing={3} sx={{ maxWidth: 760, lineHeight: 1.7 }}>
          <Typography>
            FestSchmiede ist eine moderne Open-Source-Plattform zur Organisation von Veranstaltungen.
            Sie unterstützt Veranstalter bei Bestellungen, Küche, Abholung, Online-Zahlungen,
            Benachrichtigungen, Auswertungen und Veranstaltungsorganisation.
          </Typography>
          <Typography>
            Das Projekt entstand aus der Erfahrung heraus, dass Vereinsfeste und ähnliche Veranstaltungen
            oft mit viel Papier, Zettelwirtschaft und manueller Koordination verbunden sind. FestSchmiede
            soll diese Arbeit erleichtern – ohne die Eigenheiten ehrenamtlicher Organisationen zu verlieren.
          </Typography>
          <Typography>
            Die Plattform ist mandantenfähig: Jede Organisation erhält einen eigenen Pfad unter der
            Anwendungs-Domain (z.&nbsp;B. <code>/mein-verein/</code>) und kann Module nach Bedarf aktivieren.
            So bleibt FestSchmiede überschaubar für kleine Feste und gleichzeitig erweiterbar für größere
            Veranstaltungen.
          </Typography>
        </Stack>
      </MarketingSection>
    </PlatformPublicLayout>
  );
}
