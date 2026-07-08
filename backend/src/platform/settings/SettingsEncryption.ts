import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENC_PREFIX = 'enc:';

function getKey(): Buffer {
  const raw =
    process.env.APP_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'dev-app-encryption-key-change!!';
  return crypto.createHash('sha256').update(raw).digest();
}

export function isEncryptedValue(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

export function encryptValue(plaintext: string): string {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptValue(value: string): string {
  if (!value) return '';
  if (!isEncryptedValue(value)) return value;
  const payload = value.slice(ENC_PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function maskValue(value: string): string {
  if (!value || value.length < 8) return value ? '••••••••' : '';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function isMaskedInput(value: unknown): boolean {
  return typeof value === 'string' && value.includes('••');
}
