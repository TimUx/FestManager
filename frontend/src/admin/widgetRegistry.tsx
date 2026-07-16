import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  email: 'E-Mail',
  ntfy: 'ntfy',
  discord: 'Discord',
  slack: 'Slack',
  teams: 'Teams',
};

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

function NotificationsStatusWidget() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [channels, setChannels] = useState<Record<string, { ok: boolean; message?: string }>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.getNotificationStatus(token)
      .then((data) => {
        setActive(Boolean(data.active));
        setChannels(data.channels ?? {});
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Fehler'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const readyChannels = Object.entries(channels).filter(([, check]) => check.ok);

  return (
    <Box>
      <Chip
        label={active ? 'Aktiv' : 'Inaktiv'}
        color={active ? 'success' : 'default'}
        size="small"
        sx={{ mb: 1 }}
      />
      {readyChannels.length > 0 ? (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
          {readyChannels.map(([id]) => (
            <Chip
              key={id}
              size="small"
              variant="outlined"
              label={NOTIFICATION_CHANNEL_LABELS[id] ?? id}
            />
          ))}
        </Stack>
      ) : null}
      <Typography variant="body2" color="text.secondary">
        {active
          ? `${readyChannels.length} Kanal/Kanäle bereit.`
          : 'Kein Benachrichtigungskanal konfiguriert.'}
      </Typography>
    </Box>
  );
}

export const WIDGET_COMPONENTS: Record<string, () => ReactNode> = {
  'payment.status': () => <PaymentStatusWidget />,
  'notifications.status': () => <NotificationsStatusWidget />,
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
