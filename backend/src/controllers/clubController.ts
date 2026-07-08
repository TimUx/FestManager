import { Response, NextFunction } from 'express';
import { clubService } from '../services/clubService';

export const clubController = {
  async getPublic(_req: unknown, res: Response, next: NextFunction) {
    try {
      const club = await clubService.getPublic();
      res.json(club);
    } catch (err) {
      next(err);
    }
  },

  async get(_req: unknown, res: Response, next: NextFunction) {
    try {
      const club = await clubService.getPublic();
      res.json(club);
    } catch (err) {
      next(err);
    }
  },

  async update(req: { body: Parameters<typeof clubService.update>[0] }, res: Response, next: NextFunction) {
    try {
      const club = await clubService.update(req.body);
      res.json(club);
    } catch (err) {
      next(err);
    }
  },
};
