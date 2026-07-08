export interface ClubSettings {
  clubName: string;
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string | null;
}

export const DEFAULT_CLUB: ClubSettings = {
  clubName: 'Vereinsbestellung',
  description: 'Essensbestellungen für unsere Veranstaltungen',
  contactName: 'Vereinsverwaltung',
  email: 'kontakt@verein.local',
  phone: '+49 123 456789',
  address: 'Musterstraße 1, 12345 Musterstadt',
  website: 'https://www.verein.local',
};
