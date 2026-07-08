import { clubRepository, DEFAULT_CLUB } from '../repositories/clubRepository';
import { emitClubUpdate } from '../socket';

function mapClub(settings: Awaited<ReturnType<typeof clubRepository.get>>) {
  return {
    clubName: settings.clubName || DEFAULT_CLUB.clubName,
    description: settings.description || DEFAULT_CLUB.description,
    contactName: settings.contactName || DEFAULT_CLUB.contactName,
    email: settings.email || DEFAULT_CLUB.email,
    phone: settings.phone || DEFAULT_CLUB.phone,
    address: settings.address || DEFAULT_CLUB.address,
    website: settings.website || DEFAULT_CLUB.website,
    logoUrl: settings.logoUrl,
  };
}

export const clubService = {
  async getPublic() {
    const settings = await clubRepository.get();
    return mapClub(settings);
  },

  async update(data: {
    clubName?: string;
    description?: string | null;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string | null;
    logoUrl?: string | null;
  }) {
    const settings = await clubRepository.update(data);
    const mapped = mapClub(settings);
    emitClubUpdate(mapped);
    return mapped;
  },
};
