import { useState } from 'react';
import {
  Typography, Box, Button, Stepper, Step, StepLabel, Paper, Alert, TextField, Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

const STEPS = ['Verein', 'Veranstaltung', 'Fertig'];

export function SetupWizardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [clubName, setClubName] = useState('');
  const [eventName, setEventName] = useState('Sommerfest');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

  const next = async () => {
    if (!token) return;
    setError('');
    try {
      if (step === 0) {
        if (!clubName.trim()) {
          setError('Bitte Vereinsnamen eingeben');
          return;
        }
        await api.updateClubSettings(token, { clubName: clubName.trim() });
      }
      if (step === 1) {
        await api.createEvent(token, {
          name: eventName,
          date: eventDate,
          startTime: '11:00',
          endTime: '22:00',
          onlineOrdersActive: true,
          cashierActive: true,
          activateOnCreate: true,
        });
      }
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        navigate('/admin/veranstaltungen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    }
  };

  return (
    <AdminLayout title="Einrichtungsassistent">
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        In wenigen Schritten richten Sie Ihren Verein für die erste Veranstaltung ein.
      </Typography>
      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 3, maxWidth: 560 }}>
        {step === 0 && (
          <TextField
            label="Vereinsname"
            fullWidth
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="z.B. SV Musterstadt e.V."
          />
        )}
        {step === 1 && (
          <Stack spacing={2}>
            <TextField label="Veranstaltungsname" fullWidth value={eventName} onChange={(e) => setEventName(e.target.value)} />
            <TextField label="Datum" type="date" fullWidth value={eventDate} onChange={(e) => setEventDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        )}
        {step === 2 && (
          <Alert severity="success">
            Grundsetup abgeschlossen. Als Nächstes legen Sie unter „Speisen“ Gerichte an.
          </Alert>
        )}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => void next()}>
            {step === STEPS.length - 1 ? 'Zur Verwaltung' : 'Weiter'}
          </Button>
        </Box>
      </Paper>
    </AdminLayout>
  );
}
