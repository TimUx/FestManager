import { Button, Box } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TvIcon from '@mui/icons-material/Tv';
import { Link } from 'react-router-dom';
import { staffQuickLinkButtonSx } from '@/theme/touch';

interface StaffKioskActionsProps {
  /** dashboard = Schnellzugriff auf der Übersicht; navigation = Wechsel zwischen Service-Seiten */
  variant?: 'dashboard' | 'navigation';
  /** Max width of the button grid */
  maxWidth?: number;
}

/**
 * Kompakte Schnellzugriff-Buttons für Service-Bereich.
 */
export function StaffKioskActions({ variant = 'navigation', maxWidth = 420 }: StaffKioskActionsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: { xs: 1, sm: 1.25 },
        maxWidth,
        width: '100%',
      }}
    >
      <Button
        component={Link}
        to="/service/abholung"
        variant="contained"
        color="success"
        sx={staffQuickLinkButtonSx}
      >
        <DoneAllIcon />
        Abholung
      </Button>
      <Button
        component={Link}
        to="/service/bestellung"
        variant="contained"
        color="primary"
        sx={staffQuickLinkButtonSx}
      >
        <AddShoppingCartIcon />
        Bestellung
      </Button>
      {variant === 'dashboard' ? (
        <Button
          component={Link}
          to="/abholboard"
          variant="outlined"
          color="inherit"
          sx={staffQuickLinkButtonSx}
        >
          <TvIcon />
          Abholboard
        </Button>
      ) : (
        <Button
          component={Link}
          to="/service"
          variant="outlined"
          color="inherit"
          sx={staffQuickLinkButtonSx}
        >
          <DashboardIcon />
          Service
        </Button>
      )}
    </Box>
  );
}
