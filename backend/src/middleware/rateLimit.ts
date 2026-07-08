import rateLimit from 'express-rate-limit';

/** Login: max. 10 Versuche pro 15 Minuten (K3). */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.' },
});

/** Öffentliche Bestellungen: max. 30 pro Stunde pro IP (K3). */
export const publicOrderRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Bestellungen. Bitte später erneut versuchen.' },
});

/** Lookup-Endpunkte: max. 60 pro 15 Minuten (K3). */
export const lookupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Suchanfragen. Bitte später erneut versuchen.' },
});
