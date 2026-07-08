import { useEffect, useRef, useState } from 'react';
import { Box, Link, Typography } from '@mui/material';
import QRCode from 'qrcode';

interface PaymentQrCodeProps {
  value: string;
  size?: number;
  label?: string;
}

/** QR-Code lokal generiert – keine externen Dienste. */
export function PaymentQrCode({ value, size = 240, label = 'QR-Code zum Bezahlen' }: PaymentQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    setFailed(false);
    void QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
    }).catch(() => setFailed(true));
  }, [value, size]);

  const ariaLabel = failed ? 'QR-Code nicht verfügbar – Link unten nutzen' : label;

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        role="img"
        aria-label={ariaLabel}
        sx={{
          display: 'inline-flex',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 2,
          borderColor: 'divider',
        }}
      >
        <canvas ref={canvasRef} width={size} height={size} style={{ maxWidth: '100%', height: 'auto' }} />
      </Box>
      {failed && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          QR-Code konnte nicht angezeigt werden.
        </Typography>
      )}
      <Link href={value} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', mt: 1, wordBreak: 'break-all' }}>
        Zahlungslink öffnen
      </Link>
    </Box>
  );
}
