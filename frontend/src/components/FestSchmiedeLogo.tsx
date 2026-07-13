import { Box, type SxProps, type Theme } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/** `onPrimary`: helles Logo auf farbigem/dunklem Hintergrund (AppBar primary). */
export type FestSchmiedeLogoVariant = 'onPrimary' | 'onSurface' | 'auto';

interface FestSchmiedeLogoProps {
  height?: number;
  variant?: FestSchmiedeLogoVariant;
  sx?: SxProps<Theme>;
  alt?: string;
}

export function FestSchmiedeLogo({
  height = 40,
  variant = 'onSurface',
  sx,
  alt = 'FestSchmiede',
}: FestSchmiedeLogoProps) {
  const theme = useTheme();
  const resolved = variant === 'auto' ? 'onSurface' : variant;
  const useLightLogo =
    resolved === 'onPrimary' ||
    (resolved === 'onSurface' && theme.palette.mode === 'dark');

  return (
    <Box
      component="img"
      src={useLightLogo ? '/logo-white.png' : '/logo-dark.png'}
      alt={alt}
      sx={{ height, width: 'auto', display: 'block', flexShrink: 0, ...sx }}
    />
  );
}

export const FESTSCHMIEDE_LOGO_URL = '/logo-512.png';
