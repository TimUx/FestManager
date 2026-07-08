import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { api, getImageUrl } from '@/services/api';
import { ClubSettings } from '@/types/club';

export function ClubSettingsPage() {
  const { token } = useAuth();
  const { club, refresh } = useClub();
  const [form, setForm] = useState<ClubSettings>(club);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      api.getClubSettings(token).then(setForm).catch(() => setForm(club));
    }
  }, [token, club]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateClubSettings(token, {
        ...form,
        email: form.email || undefined,
        website: form.website || undefined,
      });
      await refresh();
      setSuccess('Vereinsdaten gespeichert');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!token) return;
    try {
      const updated = await api.uploadClubLogo(token, file);
      setForm(updated);
      await refresh();
      setSuccess('Logo hochgeladen');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    }
  };

  const logoUrl = getImageUrl(form.logoUrl || undefined);

  return (
    <AdminLayout title="Vereinseinstellungen">
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Vereinsname, Logo & Kontaktdaten
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Diese Angaben werden im Header und auf der Kontaktseite angezeigt.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          {logoUrl ? (
            <Avatar src={logoUrl} sx={{ width: 80, height: 80 }} />
          ) : (
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              <RestaurantMenuIcon fontSize="large" />
            </Avatar>
          )}
          <Button component="label" variant="outlined" startIcon={<PhotoCameraIcon />}>
            Logo hochladen
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
            />
          </Button>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Vereinsname"
            fullWidth
            required
            value={form.clubName}
            onChange={(e) => setForm({ ...form, clubName: e.target.value })}
          />
          <TextField
            label="Beschreibung / Info"
            fullWidth
            multiline
            rows={2}
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            label="Ansprechpartner"
            fullWidth
            value={form.contactName || ''}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
          <TextField
            label="E-Mail"
            type="email"
            fullWidth
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Telefon"
            fullWidth
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <TextField
            label="Adresse"
            fullWidth
            multiline
            rows={2}
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <TextField
            label="Website"
            fullWidth
            value={form.website || ''}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          <Button
            variant="contained"
            size="large"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Speichern
          </Button>
        </Stack>
      </Paper>
    </AdminLayout>
  );
}
