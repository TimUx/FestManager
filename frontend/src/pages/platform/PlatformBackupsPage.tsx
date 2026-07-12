import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/Restore';
import VerifiedIcon from '@mui/icons-material/Verified';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import {
  platformApi,
  type PlatformBackupEntry,
  type PlatformBackupOverview,
  type PlatformTenant,
} from '@/services/platformApi';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE');
}

function strategyLabel(strategy: PlatformBackupEntry['strategy']): string {
  if (strategy === 'full') return 'Vollbackup';
  if (strategy === 'tenant') return 'Mandant';
  return 'Unbekannt';
}

export function PlatformBackupsPage() {
  const { token } = usePlatformAuth();
  const [overview, setOverview] = useState<PlatformBackupOverview | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [message, setMessage] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      platformApi.getBackups(token),
      platformApi.listTenants(token, { page: 1 }),
    ])
      .then(([backupData, tenantData]) => {
        setOverview(backupData);
        setTenants(tenantData.items);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(load, [load]);

  const runAction = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      setMessage({ severity: 'success', text: success });
      load();
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Aktion fehlgeschlagen' });
    } finally {
      setBusy(null);
    }
  };

  const createFullBackup = () =>
    runAction('full', async () => {
      if (!token) return;
      await platformApi.createFullBackup(token);
    }, 'Vollbackup erstellt');

  const createTenantBackup = () =>
    runAction('tenant', async () => {
      if (!token || !selectedTenantId) return;
      await platformApi.createTenantBackup(token, selectedTenantId);
      setTenantDialogOpen(false);
      setSelectedTenantId('');
    }, 'Mandanten-Backup erstellt');

  const validateBackup = (filename: string) =>
    runAction(`validate-${filename}`, async () => {
      if (!token) return;
      await platformApi.validateBackup(token, filename);
    }, `Backup '${filename}' ist gültig`);

  const downloadBackup = async (filename: string) => {
    if (!token) return;
    setBusy(`download-${filename}`);
    try {
      await platformApi.downloadBackup(token, filename);
      setMessage({ severity: 'success', text: `Download gestartet: ${filename}` });
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Download fehlgeschlagen' });
    } finally {
      setBusy(null);
    }
  };

  const restoreBackup = (entry: PlatformBackupEntry) => {
    const isFull = entry.strategy === 'full';
    const warning = isFull
      ? `ACHTUNG: Ein Vollbackup überschreibt die gesamte Datenbank (alle Mandanten, Plattformdaten, Bestellungen).\n\nVor dem Restore wird automatisch eine Sicherungskopie erstellt.\n\nBackup: ${entry.filename}\n\nFortfahren?`
      : `Mandanten-Backup wiederherstellen?\n\nMandant: ${entry.tenantName ?? entry.tenantSlug ?? 'unbekannt'}\nDatei: ${entry.filename}\n\nBestehende Daten dieses Mandanten werden ersetzt.`;
    if (!window.confirm(warning)) return;

    runAction(`restore-${entry.filename}`, async () => {
      if (!token) return;
      const result = await platformApi.restoreBackup(token, entry.filename);
      setMessage({ severity: 'success', text: result.message });
    }, 'Wiederherstellung abgeschlossen');
  };

  const deleteBackup = (entry: PlatformBackupEntry) => {
    if (entry.source === 'automatic') return;
    if (!window.confirm(`Backup '${entry.filename}' unwiderruflich löschen?`)) return;
    runAction(`delete-${entry.filename}`, async () => {
      if (!token) return;
      await platformApi.deleteBackup(token, entry.filename);
    }, 'Backup gelöscht');
  };

  if (loading || !overview) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Backups</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Vollbackups sichern die gesamte PostgreSQL-Datenbank. Mandanten-Backups enthalten nur die Daten eines Vereins
        (Einstellungen, Events, Bestellungen, Module).
      </Typography>

      {message && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {!overview.pgToolsAvailable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          PostgreSQL-Tools (pg_dump, psql) sind im Backend-Container nicht verfügbar. Vollbackup und Restore sind deaktiviert.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Strategien: {overview.strategies.map((s) => (s === 'full' ? 'Vollbackup' : 'Mandant')).join(', ')}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Letztes Vollbackup: {overview.lastFullBackup ? formatDate(overview.lastFullBackup) : 'Noch keines'}
        </Typography>
        <Typography variant="body2">
          Restore verfügbar: {overview.restoreAvailable ? 'Ja' : 'Nein'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Speicherort: {overview.backupDir}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            disabled={!overview.pgToolsAvailable || busy === 'full'}
            onClick={createFullBackup}
          >
            {busy === 'full' ? 'Erstelle…' : 'Vollbackup erstellen'}
          </Button>
          <Button variant="outlined" onClick={() => setTenantDialogOpen(true)}>
            Mandanten-Backup erstellen
          </Button>
        </Box>
      </Paper>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Datei / Mandant</TableCell>
              <TableCell>Größe</TableCell>
              <TableCell>Quelle</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overview.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    Noch keine Backups vorhanden.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {overview.items.map((entry) => (
              <TableRow key={entry.filename}>
                <TableCell>{formatDate(entry.createdAt)}</TableCell>
                <TableCell>
                  <Chip size="small" label={strategyLabel(entry.strategy)} color={entry.strategy === 'full' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{entry.filename}</Typography>
                  {entry.tenantName && (
                    <Typography variant="caption" color="text.secondary">{entry.tenantName} ({entry.tenantSlug})</Typography>
                  )}
                </TableCell>
                <TableCell>{formatBytes(entry.sizeBytes)}</TableCell>
                <TableCell>{entry.source === 'automatic' ? 'Automatisch' : 'Manuell'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Integrität prüfen">
                    <span>
                      <IconButton
                        size="small"
                        disabled={!!busy}
                        onClick={() => validateBackup(entry.filename)}
                      >
                        <VerifiedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Herunterladen">
                    <span>
                      <IconButton
                        size="small"
                        disabled={!!busy}
                        onClick={() => downloadBackup(entry.filename)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {entry.restorable && overview.restoreAvailable && (
                    <Tooltip title="Wiederherstellen">
                      <span>
                        <IconButton
                          size="small"
                          color="warning"
                          disabled={!!busy}
                          onClick={() => restoreBackup(entry)}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {entry.source === 'manual' && (
                    <Tooltip title="Löschen">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={!!busy}
                          onClick={() => deleteBackup(entry)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={tenantDialogOpen} onClose={() => setTenantDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Mandanten-Backup erstellen</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="tenant-backup-select">Mandant</InputLabel>
            <Select
              labelId="tenant-backup-select"
              label="Mandant"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
            >
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTenantDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            disabled={!selectedTenantId || busy === 'tenant'}
            onClick={createTenantBackup}
          >
            {busy === 'tenant' ? 'Erstelle…' : 'Backup erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
