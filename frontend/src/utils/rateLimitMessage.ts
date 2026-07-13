export interface RateLimitInfo {
  retryAfterSeconds: number;
  retryAt: Date;
}

export function parseRateLimitInfo(headers: Headers): RateLimitInfo | undefined {
  const retryAfter = headers.get('retry-after');
  const reset = headers.get('ratelimit-reset');

  let seconds: number | undefined;
  if (retryAfter && /^\d+$/.test(retryAfter)) {
    seconds = Number(retryAfter);
  } else if (reset && /^\d+$/.test(reset)) {
    seconds = Number(reset);
  }

  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined;
  }

  return {
    retryAfterSeconds: Math.ceil(seconds),
    retryAt: new Date(Date.now() + seconds * 1000),
  };
}

function formatRetryClock(date: Date, now = new Date()): string {
  const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const sameDay =
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();

  if (sameDay) return `${time} Uhr`;
  const day = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${day} um ${time} Uhr`;
}

export function formatRateLimitRetryMessage(
  baseMessage: string,
  rateLimit?: RateLimitInfo,
  now = new Date()
): string {
  if (!rateLimit) return baseMessage;

  const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
  const clock = formatRetryClock(rateLimit.retryAt, now);

  if (rateLimit.retryAfterSeconds < 120) {
    return `${baseMessage} Nächster Versuch in etwa ${rateLimit.retryAfterSeconds} Sekunden (ab ${clock}).`;
  }

  return `${baseMessage} Nächster Versuch in etwa ${minutes} Minuten (ab ${clock}).`;
}

export function formatTenantApplicationRateLimitMessage(rateLimit?: RateLimitInfo, now = new Date()): string {
  return formatRateLimitRetryMessage(
    'Zu viele Bewerbungen von dieser Verbindung.',
    rateLimit,
    now
  );
}
