import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Box, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import { api } from '@/services/api';

function PaymentStatusWidget() {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPaymentStatus()
      .then((data) => setAvailable(Boolean(data.available)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Fehler'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Chip
        label={available ? 'Aktiv' : 'Inaktiv'}
        color={available ? 'success' : 'default'}
        size="small"
        sx={{ mb: 1 }}
      />
      <Typography variant="body2" color="text.secondary">
        {available ? 'Mindestens ein Zahlungsanbieter ist konfiguriert.' : 'Kein aktiver Zahlungsanbieter.'}
      </Typography>
    </Box>
  );
}

export const WIDGET_COMPONENTS: Record<string, () => ReactNode> = {
  'payment.status': () => <PaymentStatusWidget />,
};

export function renderWidget(componentId: string, title: string): ReactNode {
  const Widget = WIDGET_COMPONENTS[componentId];
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>{title}</Typography>
      {Widget ? <Widget /> : (
        <Typography variant="body2" color="text.secondary">
          Widget „{componentId}" ist nicht registriert.
        </Typography>
      )}
    </Paper>
  );
}
