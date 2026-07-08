import { settingsService } from '../../platform/bootstrap';
import { CORE_EMAIL_NAMESPACE } from '../../platform/settings/SettingsNamespaces';
import { isEncryptedValue } from '../../platform/settings/SettingsEncryption';

/** Encrypt legacy plaintext secrets on first boot after settings platform migration. */
export async function migrateLegacySettingsSecrets(): Promise<void> {
  const email = await settingsService.getDecryptedValues(CORE_EMAIL_NAMESPACE);
  const pass = email.smtpPass;
  if (typeof pass === 'string' && pass && !isEncryptedValue(pass)) {
    await settingsService.setValues(CORE_EMAIL_NAMESPACE, { smtpPass: pass }, { partial: true });
  }
}
