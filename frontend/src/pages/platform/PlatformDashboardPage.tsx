import { useEffect, useState } from 'react';
import {
  Grid, Paper, Typography, Box, Chip, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { platformApi } from '@/services/platformApi';

export function PlatformDashboardPage() {
  const { token } = usePlatformAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    platformApi.getDashboard(token)
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <CircularProgress />;
  if (!data) return <Typography>Keine Daten</Typography>;

  const tenants = data.tenants as Record<string, number> | undefined;
  const system = data.system as Record<string, unknown> | undefined;
  const platform = data.platform as Record<string, unknown> | undefined;
  const monitoring = data.monitoring as Record<string, unknown> | undefined;
  const cpu = monitoring?.cpu as Record<string, unknown> | undefined;
  const memory = monitoring?.memory as Record<string, unknown> | undefined;
  const database = monitoring?.database as Record<string, unknown> | undefined;
  const storage = monitoring?.storage as Record<string, unknown> | undefined;
  const docker = monitoring?.docker as Record<string, unknown> | undefined;
  const websockets = monitoring?.websockets as Record<string, unknown> | undefined;
  const modules = monitoring?.modules as Record<string, unknown> | undefined;
  const backups = data.backups as Record<string, unknown> | undefined;
  const slowEndpoints = (monitoring?.api as Record<string, unknown> | undefined)?.topSlowEndpoints as
    | Array<{ path?: string; avgMs?: number; count?: number }>
    | undefined;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Mandanten gesamt" value={tenants?.total ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Aktive Mandanten" value={tenants?.active ?? 0} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Deaktiviert" value={tenants?.suspended ?? 0} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Bestellungen heute" value={(data.orders as Record<string, number>)?.today ?? 0} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Plattformstatus</Typography>
            <Chip
              label={platform?.status === 'maintenance' ? 'Wartung' : 'Betrieb'}
              color={platform?.status === 'maintenance' ? 'warning' : 'success'}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>Version: {String(platform?.version ?? '–')}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Letztes Vollbackup:{' '}
              {backups?.lastBackup ? new Date(String(backups.lastBackup)).toLocaleString('de-DE') : 'Noch keines'}
            </Typography>
            <Typography variant="body2">
              Restore: {backups?.restoreAvailable ? 'Verfügbar' : 'Nicht verfügbar'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Prozess</Typography>
            <Typography variant="body2">RAM (Prozess): {String(memory?.processRssMb ?? (system?.memoryMb as Record<string, number>)?.rss ?? '–')} MB</Typography>
            <Typography variant="body2">Heap: {(system?.memoryMb as Record<string, number>)?.heapUsed ?? '–'} MB</Typography>
            <Typography variant="body2">Uptime: {Math.floor(Number(system?.uptimeSeconds ?? 0) / 60)} Min.</Typography>
            <Typography variant="body2">Node: {String(system?.nodeVersion ?? '–')}</Typography>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>System & Infrastruktur</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="CPU Kerne" value={String(cpu?.cores ?? system?.cpus ?? '–')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="RAM gesamt (MB)" value={String(memory?.totalMb ?? '–')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="RAM frei (MB)" value={String(memory?.freeMb ?? '–')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="Uploads (MB)" value={String(storage?.uploadsMb ?? '–')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper
            title="Datenbank"
            value={database?.connected ? `Verbunden (${database.latencyMs} ms)` : 'Nicht verbunden'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="Docker" value={docker?.detected ? 'Ja' : 'Nein'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="WebSocket-Verbindungen" value={String(websockets?.active ?? 0)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper title="Aktive Module" value={String(modules?.enabledInstallations ?? 0)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricPaper
            title="Load Average"
            value={Array.isArray(cpu?.loadAverage) ? (cpu.loadAverage as number[]).map((v) => v.toFixed(2)).join(' / ') : '–'}
          />
        </Grid>

        {slowEndpoints && slowEndpoints.length > 0 && (
          <Grid size={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Langsame API-Endpunkte</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pfad</TableCell>
                    <TableCell align="right">Ø ms</TableCell>
                    <TableCell align="right">Anfragen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slowEndpoints.map((row) => (
                    <TableRow key={row.path}>
                      <TableCell>{row.path ?? '–'}</TableCell>
                      <TableCell align="right">{row.avgMs ?? '–'}</TableCell>
                      <TableCell align="right">{row.count ?? '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color?: 'success' | 'warning' }) {
  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h4" color={color ? `${color}.main` : 'text.primary'}>{value}</Typography>
    </Paper>
  );
}

function MetricPaper({ title, value }: { title: string; value: string }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5">{value}</Typography>
    </Paper>
  );
}
