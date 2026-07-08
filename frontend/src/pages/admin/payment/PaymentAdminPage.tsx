import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { AdminLayout } from '@/components/AdminLayout';
import { DynamicSettingsForm } from '@/components/DynamicSettingsForm';
import { useAuth } from '@/contexts/AuthContext';
import { api, formatPrice } from '@/services/api';
import { canAccessPermission } from '@/utils/permissions';
import { buildValuesPayload } from '@/types/settings';
import type { SettingsFormDefinition, SettingsFormGroup } from '@/types/settings';
import {
  LOG_ACTION_LABELS,
  PAYMENT_ADMIN_TABS,
  PAYMENT_STATUS_LABELS,
  PROVIDER_STATUS_LABELS,
  type PaymentAdminTab,
  type PaymentDashboard,
  type PaymentListItem,
  type PaymentMethodTypeAdmin,
  type PaymentProviderAdmin,
  type PaymentStatistics,
} from '@/types/paymentAdmin';

function StatusChip({ status }: { status: string }) {
  const color =
    status.includes('PAID') || status.includes('CONFIRMED') || status === 'completed' || status === 'aktiv'
      ? 'success'
      : status.includes('FAIL') || status.includes('TIMEOUT') || status === 'failed' || status === 'health_fehler'
        ? 'error'
        : status === 'sandbox' || status.includes('PENDING') || status === 'pending'
          ? 'warning'
          : 'default';
  const label = PAYMENT_STATUS_LABELS[status] ?? PROVIDER_STATUS_LABELS[status] ?? status;
  return <Chip size="small" color={color} label={label} />;
}

function HealthDot({ ok }: { ok?: boolean }) {
  if (ok === true) return <CheckCircleIcon fontSize="small" color="success" />;
  if (ok === false) return <ErrorIcon fontSize="small" color="error" />;
  return <WarningIcon fontSize="small" color="warning" />;
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight={800}>{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

function OverviewSection({ data, loading }: { data: PaymentDashboard | null; loading: boolean }) {
  if (loading || !data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  const { stats } = data;
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Aktive Anbieter" value={data.activeProviders} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Zahlungsarten" value={data.availableMethods} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Zahlungen heute" value={stats.paymentsToday} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Umsatz heute" value={formatPrice(stats.revenueTodayCents / 100)} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Offen" value={stats.openPayments} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Fehlgeschlagen" value={stats.failedPayments} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Timeouts" value={stats.timeouts} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><StatCard title="Refunds" value={stats.refunds} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard title="Webhook" value={data.webhookStatus === 'ok' ? 'OK' : 'Prüfen'} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard title="Health" value={data.healthStatus === 'ok' ? 'OK' : 'Warnung'} />
        </Grid>
      </Grid>

      {data.recentErrors.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Letzte Fehler</Typography>
          <Stack spacing={1}>
            {data.recentErrors.map((e, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <ErrorIcon fontSize="small" color="error" />
                <Typography variant="body2">{LOG_ACTION_LABELS[e.action] ?? e.action}</Typography>
                {e.providerId && <Chip size="small" label={e.providerId} />}
                <Typography variant="caption" color="text.secondary">
                  {new Date(e.at).toLocaleString('de-DE')}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function ProvidersSection({ token }: { token: string }) {
  const [providers, setProviders] = useState<PaymentProviderAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; message?: string } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setProviders(await api.getPaymentProviders(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (id: string, enabled: boolean) => {
    await api.setPaymentProviderEnabled(token, id, enabled);
    await load();
  };

  const test = async (id: string) => {
    setTesting(id);
    try {
      const result = await api.testPaymentProvider(token, id);
      setTestResult({ id, ok: result.ok, message: result.message });
    } catch (err) {
      setTestResult({ id, ok: false, message: err instanceof Error ? err.message : 'Test fehlgeschlagen' });
    } finally {
      setTesting(null);
    }
  };

  if (loading) return <CircularProgress />;
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {testResult && (
        <Alert severity={testResult.ok ? 'success' : 'error'} onClose={() => setTestResult(null)}>
          {testResult.message ?? (testResult.ok ? 'Verbindung OK' : 'Verbindung fehlgeschlagen')}
        </Alert>
      )}
      <Grid container spacing={2}>
        {providers.map((p) => (
          <Grid key={p.id} size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                    </Box>
                    <HealthDot ok={p.health.ok} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <StatusChip status={p.status} />
                    <Chip size="small" variant="outlined" label={`v${p.version ?? '1.0.0'}`} />
                    {p.sandbox && <Chip size="small" label="Testmodus" color="warning" />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{p.health.message}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant={p.enabled ? 'outlined' : 'contained'}
                      disabled={!p.configured || !p.implemented}
                      onClick={() => void toggle(p.id, !p.enabled)}
                    >
                      {p.enabled ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!p.configured || testing === p.id}
                      onClick={() => void test(p.id)}
                    >
                      {testing === p.id ? 'Teste…' : 'Verbindung testen'}
                    </Button>
                  </Stack>
                  {!p.implemented && (
                    <Alert severity="info" sx={{ mt: 1 }}>Dieser Anbieter ist noch in Entwicklung.</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function MethodTypesSection({ token }: { token: string }) {
  const [methods, setMethods] = useState<PaymentMethodTypeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setMethods(await api.getPaymentMethodTypes(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const update = (id: string, patch: Partial<PaymentMethodTypeAdmin>) => {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const methodTypes = Object.fromEntries(
        methods.map((m) => [m.id, {
          enabled: m.enabled,
          recommended: m.recommended,
          sortOrder: m.sortOrder,
          description: m.description,
          icon: m.icon,
        }])
      );
      setMethods(await api.savePaymentMethodTypes(token, methodTypes));
      setSuccess('Zahlungsarten gespeichert');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Alert severity="info">
        Aktivieren Sie hier die Zahlungsarten, die Besuchern angezeigt werden – unabhängig von der technischen Anbieter-Konfiguration.
      </Alert>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Aktiv</TableCell>
              <TableCell>Empfohlen</TableCell>
              <TableCell>Bezeichnung</TableCell>
              <TableCell>Anbieter</TableCell>
              <TableCell>Reihenfolge</TableCell>
              <TableCell>Beschreibung</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {methods.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Checkbox
                    checked={m.enabled}
                    disabled={!m.providerConfigured}
                    onChange={(e) => update(m.id, { enabled: e.target.checked })}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={m.recommended}
                    disabled={!m.enabled}
                    onChange={(e) => update(m.id, { recommended: e.target.checked })}
                  />
                </TableCell>
                <TableCell>{m.label}</TableCell>
                <TableCell><Chip size="small" label={m.providerId} /></TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={m.sortOrder}
                    sx={{ width: 72 }}
                    onChange={(e) => update(m.id, { sortOrder: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Optional für Besucher"
                    value={m.description ?? ''}
                    onChange={(e) => update(m.id, { description: e.target.value || undefined })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" onClick={() => void save()} disabled={saving}>
        {saving ? 'Speichern…' : 'Speichern'}
      </Button>
    </Stack>
  );
}

function SettingsSection({ token }: { token: string }) {
  const [form, setForm] = useState<SettingsFormDefinition | null>(null);
  const [groups, setGroups] = useState<SettingsFormGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const data = await api.getSettingsForm(token, 'module.payment');
        setForm(data);
        setGroups(data.groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateSettings(token, 'module.payment', buildValuesPayload(groups));
      setSuccess('Einstellungen gespeichert – sensible Daten werden verschlüsselt abgelegt');
      const data = await api.getSettingsForm(token, 'module.payment');
      setForm(data);
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (!form) return <Alert severity="error">{error || 'Formular nicht verfügbar'}</Alert>;

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Alert severity="info">
        API-Schlüssel werden maskiert angezeigt. Leer lassen, um den gespeicherten Wert beizubehalten.
      </Alert>
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <DynamicSettingsForm form={form} onChange={setGroups} />
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => void save()} disabled={saving}>
          {saving ? 'Speichern…' : 'Einstellungen speichern'}
        </Button>
      </Paper>
    </Stack>
  );
}

function PaymentsSection({ token }: { token: string }) {
  const [items, setItems] = useState<PaymentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentList(token, { page, status: statusFilter || undefined });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (id: string) => {
    setSelected(await api.getPaymentDetail(token, id));
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          sx={{ minWidth: 180 }}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <MenuItem value="">Alle</MenuItem>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
            <MenuItem key={k} value={k}>{v}</MenuItem>
          ))}
        </TextField>
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={() => void api.downloadPaymentExport(token, 'payments-export.csv', 'zahlungen.csv')}
        >
          CSV exportieren
        </Button>
      </Stack>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Abholnr.</TableCell>
                <TableCell>Betrag</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Anbieter</TableCell>
                <TableCell>Zeitpunkt</TableCell>
                <TableCell>Kunde</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => void openDetail(p.id)}>
                  <TableCell>{p.displayNumber ?? '–'}</TableCell>
                  <TableCell>{formatPrice(p.amountCents / 100)}</TableCell>
                  <TableCell><StatusChip status={p.status} /></TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleString('de-DE')}</TableCell>
                  <TableCell>{p.customerName ?? '–'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Zurück</Button>
        <Typography variant="body2">Seite {page} · {total} gesamt</Typography>
        <Button disabled={items.length < 25} onClick={() => setPage((p) => p + 1)}>Weiter</Button>
      </Stack>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>Zahlungsdetails</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={1}>
              {Object.entries(selected).filter(([k]) => !['transactions', 'audits', 'statusHistory'].includes(k)).map(([k, v]) => (
                <Typography key={k} variant="body2"><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '–')}</Typography>
              ))}
              {Array.isArray(selected.statusHistory) && selected.statusHistory.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Status-Historie</Typography>
                  {(selected.statusHistory as { action: string; at: string }[]).map((h, i) => (
                    <Typography key={i} variant="caption" display="block">
                      {LOG_ACTION_LABELS[h.action] ?? h.action} – {new Date(h.at).toLocaleString('de-DE')}
                    </Typography>
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Schließen</Button></DialogActions>
      </Dialog>
    </Stack>
  );
}

function RefundsSection({ token }: { token: string }) {
  const [items, setItems] = useState<{ id: string; paymentId?: string | null; providerId?: string | null; details?: Record<string, unknown> | null; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ providerId: 'stripe', transactionId: '', amountCents: '', reason: '', comment: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPaymentRefunds(token);
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setError('');
    setSuccess('');
    try {
      const result = await api.createPaymentRefund(token, {
        providerId: form.providerId,
        transactionId: form.transactionId,
        amountCents: form.amountCents ? Math.round(Number(form.amountCents) * 100) : undefined,
        reason: form.reason || undefined,
        comment: form.comment || undefined,
      });
      if (result.success) {
        setSuccess('Rückerstattung durchgeführt');
        setDialogOpen(false);
        await load();
      } else {
        setError(result.error ?? 'Rückerstattung fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rückerstattung fehlgeschlagen');
    }
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>Neue Rückerstattung</Button>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => void api.downloadPaymentExport(token, 'refunds-export.csv', 'rueckerstattungen.csv')}>
          Export
        </Button>
      </Stack>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Zeitpunkt</TableCell><TableCell>Anbieter</TableCell><TableCell>Zahlung</TableCell><TableCell>Details</TableCell></TableRow></TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.createdAt).toLocaleString('de-DE')}</TableCell>
                  <TableCell>{r.providerId ?? '–'}</TableCell>
                  <TableCell>{r.paymentId ?? '–'}</TableCell>
                  <TableCell><Typography variant="caption">{JSON.stringify(r.details ?? {})}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rückerstattung</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Anbieter-ID" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} helperText="z. B. stripe" />
            <TextField label="Transaktions-ID" value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} required />
            <TextField label="Betrag (EUR, leer = vollständig)" value={form.amountCents} onChange={(e) => setForm({ ...form, amountCents: e.target.value })} />
            <TextField label="Begründung" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <TextField label="Kommentar" multiline rows={2} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={() => void submit()}>Rückerstatten</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function LogsSection({ token }: { token: string }) {
  const [items, setItems] = useState<{ id: string; action: string; providerId?: string | null; paymentId?: string | null; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await api.getPaymentLogs(token);
        setItems(data.items);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <CircularProgress />;
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow><TableCell>Zeitpunkt</TableCell><TableCell>Ereignis</TableCell><TableCell>Anbieter</TableCell><TableCell>Zahlung</TableCell></TableRow></TableHead>
        <TableBody>
          {items.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{new Date(l.createdAt).toLocaleString('de-DE')}</TableCell>
              <TableCell>{LOG_ACTION_LABELS[l.action] ?? l.action}</TableCell>
              <TableCell>{l.providerId ?? '–'}</TableCell>
              <TableCell>{l.paymentId ?? '–'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function WebhooksSection({ token }: { token: string }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await api.getPaymentWebhooks(token);
        setItems(data.items);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <CircularProgress />;
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow><TableCell>Zeitpunkt</TableCell><TableCell>Typ</TableCell><TableCell>Status</TableCell><TableCell>Zahlung</TableCell></TableRow></TableHead>
        <TableBody>
          {items.map((e) => (
            <TableRow key={String(e.id)}>
              <TableCell>{e.createdAt ? new Date(String(e.createdAt)).toLocaleString('de-DE') : '–'}</TableCell>
              <TableCell>{String(e.eventType ?? '–')}</TableCell>
              <TableCell><Chip size="small" label={String(e.status ?? 'processed')} color="success" /></TableCell>
              <TableCell>{String(e.paymentId ?? '–')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function HealthSection({ token }: { token: string }) {
  const [providers, setProviders] = useState<PaymentProviderAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setProviders(await api.getPaymentHealth(token));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <CircularProgress />;
  return (
    <Grid container spacing={2}>
      {providers.map((p) => (
        <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <HealthDot ok={p.health.ok} />
                <Typography fontWeight={700}>{p.name}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{p.health.message}</Typography>
              <Box sx={{ mt: 1 }}><StatusChip status={p.status} /></Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function StatisticsSection({ token }: { token: string }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [stats, setStats] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setStats(await api.getPaymentStatistics(token, period));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, period]);

  if (loading || !stats) return <CircularProgress />;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField select size="small" label="Zeitraum" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
          <MenuItem value="today">Heute</MenuItem>
          <MenuItem value="week">Woche</MenuItem>
          <MenuItem value="month">Monat</MenuItem>
        </TextField>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => void api.downloadPaymentExport(token, `statistics-export.csv?period=${period}`, `statistik-${period}.csv`)}>
          CSV/Excel exportieren
        </Button>
        <Button variant="outlined" onClick={() => window.print()}>PDF (Drucken)</Button>
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Zahlungen" value={stats.totalCount} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Umsatz" value={formatPrice(stats.revenueCents / 100)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Erfolgsquote" value={`${stats.successRate}%`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Fehlerrate" value={`${stats.errorRate}%`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Refundquote" value={`${stats.refundRate}%`} /></Grid>
      </Grid>
      {stats.byProvider.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Anbieter</TableCell><TableCell>Anzahl</TableCell><TableCell>Umsatz</TableCell></TableRow></TableHead>
            <TableBody>
              {stats.byProvider.map((p) => (
                <TableRow key={p.providerId}>
                  <TableCell>{p.providerId}</TableCell>
                  <TableCell>{p.count}</TableCell>
                  <TableCell>{formatPrice(p.revenueCents / 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

export function PaymentAdminPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as PaymentAdminTab) || 'overview';
  const [dashboard, setDashboard] = useState<PaymentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const visibleTabs = useMemo(
    () => PAYMENT_ADMIN_TABS.filter((t) => canAccessPermission(user, t.permission ?? 'payment.view')),
    [user]
  );

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setDashboard(await api.getPaymentDashboard(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === 'overview') void loadDashboard();
  }, [tab, loadDashboard]);

  const setTab = (next: PaymentAdminTab) => {
    setSearchParams({ tab: next });
  };

  if (!token) return null;

  const renderSection = () => {
    switch (tab) {
      case 'overview': return <OverviewSection data={dashboard} loading={loading} />;
      case 'providers': return <ProvidersSection token={token} />;
      case 'methods': return <MethodTypesSection token={token} />;
      case 'settings': return <SettingsSection token={token} />;
      case 'payments': return <PaymentsSection token={token} />;
      case 'refunds': return <RefundsSection token={token} />;
      case 'logs': return <LogsSection token={token} />;
      case 'webhooks': return <WebhooksSection token={token} />;
      case 'health': return <HealthSection token={token} />;
      case 'statistics': return <StatisticsSection token={token} />;
      default: return <OverviewSection data={dashboard} loading={loading} />;
    }
  };

  return (
    <AdminLayout title="Online-Zahlung" fullWidth>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>Online-Zahlung</Typography>
        {tab === 'overview' && (
          <Tooltip title="Aktualisieren">
            <IconButton onClick={() => void loadDashboard()}><RefreshIcon /></IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
        <Tabs
          value={visibleTabs.some((t) => t.id === tab) ? tab : visibleTabs[0]?.id ?? 'overview'}
          onChange={(_, v) => setTab(v as PaymentAdminTab)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {visibleTabs.map((t) => (
            <Tab key={t.id} value={t.id} label={t.label} />
          ))}
        </Tabs>
      </Box>

      {renderSection()}
    </AdminLayout>
  );
}
