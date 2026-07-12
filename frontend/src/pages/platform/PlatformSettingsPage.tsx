import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { platformApi } from '@/services/platformApi';

type SettingField =
  | { key: string; label: string; type: 'text' | 'email' | 'url' }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'text'; multiline: true };

const SETTING_FIELDS: SettingField[] = [
  { key: 'platform.name', label: 'Plattformname', type: 'text' },
  { key: 'platform.baseDomain', label: 'Basis-Domain', type: 'text' },
  { key: 'platform.defaults.locale', label: 'Standard-Sprache', type: 'text' },
  { key: 'platform.defaults.timezone', label: 'Standard-Zeitzone', type: 'text' },
  { key: 'platform.defaults.currency', label: 'Standard-Währung', type: 'text' },
  { key: 'platform.registration.enabled', label: 'Mandantenbewerbungen aktiv', type: 'boolean' },
  { key: 'platform.contact.name', label: 'Kontakt – Name', type: 'text' },
  { key: 'platform.contact.email', label: 'Kontakt – E-Mail', type: 'email' },
  { key: 'platform.contact.phone', label: 'Kontakt – Telefon', type: 'text' },
  { key: 'platform.contact.address', label: 'Kontakt – Adresse', type: 'text' },
  { key: 'platform.contact.website', label: 'Kontakt – Website', type: 'url' },
  { key: 'platform.links.github', label: 'GitHub URL', type: 'url' },
  { key: 'platform.maintenance.enabled', label: 'Wartungsmodus aktiv', type: 'boolean' },
  { key: 'platform.maintenance.message', label: 'Wartungsnachricht', type: 'text', multiline: true },
  { key: 'platform.branding.primaryColor', label: 'Primärfarbe', type: 'text' },
  { key: 'platform.branding.footerText', label: 'Footer-Text', type: 'text' },
];

function SettingInput({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === 'boolean') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        }
        label={field.label}
      />
    );
  }

  return (
    <TextField
      fullWidth
      label={field.label}
      type={field.type === 'text' ? 'text' : field.type}
      multiline={'multiline' in field && field.multiline}
      minRows={'multiline' in field && field.multiline ? 3 : undefined}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function PlatformSettingsPage() {
  const { token } = usePlatformAuth();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    platformApi.getSettings(token).then(setSettings).finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await platformApi.updateSettings(token, settings);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Plattform-Einstellungen</Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {SETTING_FIELDS.map((field) => (
            <Grid
              size={{ xs: 12, md: field.type === 'boolean' || ('multiline' in field && field.multiline) ? 12 : 6 }}
              key={field.key}
            >
              <SettingInput
                field={field}
                value={settings[field.key]}
                onChange={(val) => setSettings({ ...settings, [field.key]: val })}
              />
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave} disabled={saving}>
          Speichern
        </Button>
      </Paper>
    </Box>
  );
}
