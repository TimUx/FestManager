import { Link } from 'react-router-dom';
import {
  Typography, Grid, Card, CardActionArea, CardContent, Box, Alert, CircularProgress,
  Chip, Paper, Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AdminLayout } from '@/components/AdminLayout';
import { useAdminUi } from '@/contexts/AdminUiContext';
import { resolveAdminIcon } from '@/admin/iconMap';
import { renderWidget } from '@/admin/widgetRegistry';
import { canAccessPermission } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';

const healthIcons = {
  healthy: <CheckCircleIcon fontSize="small" color="success" />,
  degraded: <WarningIcon fontSize="small" color="warning" />,
  unhealthy: <ErrorIcon fontSize="small" color="error" />,
  unknown: <HelpOutlineIcon fontSize="small" color="disabled" />,
};

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { catalog, loading, error } = useAdminUi();

  const tiles = (catalog?.dashboardTiles ?? []).filter((tile) => {
    const page = catalog?.pages.find((p) => p.path === tile.path);
    return canAccessPermission(user, page?.requiredPermission);
  });

  const widgets = catalog?.widgets ?? [];
  const health = catalog?.health ?? [];

  return (
    <AdminLayout title="Administration">
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Administration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Verein, Benutzer und Module verwalten – Navigation und Seiten werden aus Metadaten erzeugt.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {widgets.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {widgets.map((widget) => (
                <Grid key={widget.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  {renderWidget(widget.componentId, widget.title)}
                </Grid>
              ))}
            </Grid>
          )}

          {health.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Modul-Gesundheit</Typography>
              <Stack spacing={1}>
                {health.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {healthIcons[item.status]}
                    <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                    <Chip size="small" label={item.status} variant="outlined" />
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          <Grid container spacing={2}>
            {tiles.map((tile) => (
              <Grid key={tile.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardActionArea component={Link} to={tile.path} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ mb: 1 }}>{resolveAdminIcon(tile.icon)}</Box>
                      <Typography variant="h6" fontWeight={700}>{tile.label}</Typography>
                      {tile.description && (
                        <Typography variant="body2" color="text.secondary">{tile.description}</Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </AdminLayout>
  );
}
