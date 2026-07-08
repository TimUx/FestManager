import { AdminRoute } from '@/components/AdminLayout';
import { AdminUiProvider } from '@/contexts/AdminUiContext';
import { DynamicAdminPage } from '@/pages/admin/DynamicAdminPage';

export function AdminShell() {
  return (
    <AdminRoute>
      <AdminUiProvider>
        <DynamicAdminPage />
      </AdminUiProvider>
    </AdminRoute>
  );
}
