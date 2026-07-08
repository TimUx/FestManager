import { Typography, Paper } from '@mui/material';
import { AdminLayout } from '@/components/AdminLayout';

interface GenericReportPageProps {
  label?: string;
  description?: string;
}

export function GenericReportPage({ label = 'Bericht', description }: GenericReportPageProps) {
  return (
    <AdminLayout title={label}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>{label}</Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Dieser Bericht wird vom Modul über Metadaten registriert. Eine spezifische Report-Komponente
          kann im Frontend-Registry unter <code>REPORT_PAGE_COMPONENTS</code> hinterlegt werden.
        </Typography>
      </Paper>
    </AdminLayout>
  );
}
