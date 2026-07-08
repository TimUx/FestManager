import { Typography, Paper } from '@mui/material';
import { AdminLayout } from '@/components/AdminLayout';

interface GenericDeveloperPageProps {
  label?: string;
  description?: string;
  componentId?: string;
}

export function GenericDeveloperPage({ label = 'Developer', description, componentId }: GenericDeveloperPageProps) {
  return (
    <AdminLayout title={label}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>{label}</Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Developer-Seite <strong>{componentId}</strong> – registriert über Modul-Metadaten.
          Spezifische Komponenten können unter <code>DEVELOPER_PAGE_COMPONENTS</code> eingebunden werden.
        </Typography>
      </Paper>
    </AdminLayout>
  );
}
