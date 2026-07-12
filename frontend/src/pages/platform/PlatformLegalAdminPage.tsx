import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, FormControlLabel, Checkbox, CircularProgress, Alert,
} from '@mui/material';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { platformApi, type PlatformLegalPageAdmin } from '@/services/platformApi';

export function PlatformLegalAdminPage() {
  const { token } = usePlatformAuth();
  const [pages, setPages] = useState<PlatformLegalPageAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    platformApi.listLegalPages(token).then((r) => setPages(r.items)).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const save = async (page: PlatformLegalPageAdmin) => {
    if (!token) return;
    setSaving(page.pageType);
    try {
      await platformApi.updateLegalPage(token, page.pageType, {
        title: page.title,
        slug: page.slug,
        enabled: page.enabled,
        published: page.published,
        contentHtml: page.contentHtml,
      });
      load();
    } finally {
      setSaving(null);
    }
  };

  const loadExample = async (pageType: string) => {
    if (!token) return;
    const page = pages.find((p) => p.pageType === pageType);
    if (!page) return;
    const hasContent = page.contentHtml.replace(/<[^>]+>/g, '').trim().length > 0;
    if (hasContent && !window.confirm('Der aktuelle Inhalt wird durch den Beispieltext ersetzt. Fortfahren?')) {
      return;
    }
    setLoadingExample(pageType);
    try {
      const { contentHtml } = await platformApi.getLegalPageExample(token, pageType);
      update(pageType, { contentHtml });
    } finally {
      setLoadingExample(null);
    }
  };

  const update = (pageType: string, patch: Partial<PlatformLegalPageAdmin>) => {
    setPages((prev) => prev.map((p) => (p.pageType === pageType ? { ...p, ...patch } : p)));
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Rechtliche Seiten</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Beim ersten Aufruf werden sinnvolle Beispieltexte (Impressum, Datenschutz, Nutzungsbedingungen)
        vorausgefüllt — angepasst an Plattformname und Kontaktdaten aus den Einstellungen, wo vorhanden.
        Bitte prüfen Sie alle Texte vor Veröffentlichung; es handelt sich um Mustervorschläge ohne Gewähr.
        Links erscheinen öffentlich nur bei vorhandenem Inhalt und aktiviertem „Veröffentlicht“.
      </Alert>
      {pages.map((page) => (
        <Paper key={page.pageType} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>{page.pageType}</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Titel" value={page.title} onChange={(e) => update(page.pageType, { title: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Slug" value={page.slug} onChange={(e) => update(page.pageType, { slug: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                minRows={8}
                label="Inhalt (HTML)"
                value={page.contentHtml}
                onChange={(e) => update(page.pageType, { contentHtml: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={<Checkbox checked={page.enabled} onChange={(e) => update(page.pageType, { enabled: e.target.checked })} />}
                label="Aktiv"
              />
              <FormControlLabel
                control={<Checkbox checked={page.published} onChange={(e) => update(page.pageType, { published: e.target.checked })} />}
                label="Veröffentlicht"
              />
            </Grid>
            <Grid size={12}>
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => loadExample(page.pageType)}
                disabled={loadingExample === page.pageType}
              >
                {loadingExample === page.pageType ? 'Lade Beispiel…' : 'Beispieltext laden'}
              </Button>
              <Button variant="contained" onClick={() => save(page)} disabled={saving === page.pageType}>
                {saving === page.pageType ? 'Speichern…' : 'Speichern'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
}
