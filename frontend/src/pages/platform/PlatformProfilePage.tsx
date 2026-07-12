import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { platformApi } from '@/services/platformApi';

export function PlatformProfilePage() {
  const { token, user, refreshUser } = usePlatformAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
  }, [user]);

  const save = async () => {
    if (!token) return;
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Neue Passwörter stimmen nicht überein' });
      return;
    }
    const emailChanged = email.trim().toLowerCase() !== user?.email.toLowerCase();
    if ((emailChanged || newPassword) && !currentPassword) {
      setMessage({ type: 'error', text: 'Bitte aktuelles Passwort eingeben' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await platformApi.updateProfile(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(currentPassword ? { currentPassword } : {}),
        ...(newPassword ? { newPassword } : {}),
      });
      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Profil gespeichert' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Speichern fehlgeschlagen' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mein Profil</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Persönliche Daten und Passwort für Ihr Plattformadministrator-Konto.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Typography variant="h6" gutterBottom>Stammdaten</Typography>
        <TextField
          fullWidth
          label="Vorname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Nachname"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Passwort ändern</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Aktuelles Passwort ist erforderlich, wenn Sie E-Mail oder Passwort ändern.
        </Typography>
        <TextField
          fullWidth
          label="Aktuelles Passwort"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Neues Passwort"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          helperText="Mindestens 8 Zeichen — leer lassen, wenn unverändert"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Neues Passwort bestätigen"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </Paper>
    </Box>
  );
}
