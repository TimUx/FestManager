import { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Drawer, List, ListItemButton, ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link, useLocation } from 'react-router-dom';
import { FestSchmiedeLogo } from '@/components/FestSchmiedeLogo';
import { useThemeMode } from '@/contexts/ThemeContext';
import { usePlatform } from '@/contexts/PlatformProvider';
import { useRouting } from '@/contexts/RoutingProvider';
import { api } from '@/services/api';
import type { PlatformLegalLink } from '@/types/tenant';

function isNavActive(path: string, pathname: string, hash: string): boolean {
  if (path.includes('#')) {
    const anchor = path.split('#')[1];
    return pathname === '/' && hash === `#${anchor}`;
  }
  return pathname === path;
}

const NAV_ITEMS = [
  { label: 'Start', path: '/' },
  { label: 'Bestellprozess', path: '/#bestellprozess' },
  { label: 'Funktionen', path: '/funktionen' },
  { label: 'Screenshots', path: '/screenshots' },
  { label: 'Open Source', path: '/open-source' },
  { label: 'Über das Projekt', path: '/ueber-das-projekt' },
  { label: 'Über den Entwickler', path: '/ueber-den-entwickler' },
  { label: 'Für Vereine', path: '/fuer-vereine' },
  { label: 'Mandant beantragen', path: '/mandant-beantragen' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Kontakt', path: '/kontakt' },
  { label: 'Dokumentation', path: '/dokumentation' },
];

interface PlatformPublicLayoutProps {
  children: React.ReactNode;
}

export function PlatformPublicLayout({ children }: PlatformPublicLayoutProps) {
  const { mode, toggleMode } = useThemeMode();
  const { platform } = usePlatform();
  const { routing } = useRouting();
  const location = useLocation();
  const loginUrl = `${routing.appUrl}/platform/login`;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [legalLinks, setLegalLinks] = useState<PlatformLegalLink[]>([]);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    api.getPlatformLegalLinks()
      .then((r) => setLegalLinks(r.items))
      .catch(() => setLegalLinks([]));
  }, []);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="fixed" elevation={1} color="primary">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
            aria-label="Navigation öffnen"
          >
            <MenuIcon />
          </IconButton>
          <Box
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
            }}
          >
            <FestSchmiedeLogo height={36} variant="onPrimary" />
            <Typography variant="h6" fontWeight={700} noWrap>
              {platform.name}
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.5, mr: 2, flexWrap: 'wrap' }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                size="small"
                sx={{ fontWeight: isNavActive(item.path, location.pathname, location.hash) ? 700 : 400 }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Button component="a" href={loginUrl} color="inherit" size="small" sx={{ mr: 1 }}>
            Anmelden
          </Button>
          <IconButton onClick={toggleMode} color="inherit" aria-label="Design wechseln">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 1 }} role="navigation" aria-label="Hauptnavigation">
          <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <FestSchmiedeLogo height={32} variant="onSurface" />
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {platform.name}
            </Typography>
          </Box>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={isNavActive(item.path, location.pathname, location.hash)}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Toolbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Box component="footer" sx={{ py: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          {platform.footerText && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              {platform.footerText}
            </Typography>
          )}
          {legalLinks.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {legalLinks.map((link) => (
                <Typography
                  key={link.slug}
                  component={Link}
                  to={`/rechtliches/${link.slug}`}
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {link.title}
                </Typography>
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
            <FestSchmiedeLogo height={28} variant="onSurface" />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            © {new Date().getFullYear()} {platform.name}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
