import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EventIcon from '@mui/icons-material/Event';
import EmailIcon from '@mui/icons-material/Email';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ExtensionIcon from '@mui/icons-material/Extension';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CodeIcon from '@mui/icons-material/Code';
import type { ReactElement } from 'react';

const ICON_MAP: Record<string, ReactElement> = {
  Dashboard: <DashboardIcon />,
  Settings: <SettingsIcon />,
  People: <PeopleIcon />,
  RestaurantMenu: <RestaurantMenuIcon />,
  Event: <EventIcon />,
  Email: <EmailIcon />,
  ShoppingCart: <ShoppingCartIcon />,
  Storefront: <StorefrontIcon />,
  Extension: <ExtensionIcon />,
  Payment: <PaymentIcon />,
  Assessment: <AssessmentIcon />,
  Code: <CodeIcon />,
};

export function resolveAdminIcon(name?: string, fallback = <ExtensionIcon />): ReactElement {
  if (!name) return fallback;
  return ICON_MAP[name] ?? fallback;
}
