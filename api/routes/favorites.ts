import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { ExperimentResult, ExperimentRatings } from '../../shared/types.js';

const router = Router();
const FAVORITES_DIR = fileService.getPath('favorites');

function calculateRecommendationIndex(ratings: ExperimentRatings): number {
  const weights = { stability: 0.4, heatingSpeed: 0.35, heatZoneConcentration: 0.25 };
  return Math.round(
    (ratings.stability * weights.stability +
      ratings.heatingSpeed * weights.heatingSpeed +
      ratings.heatZoneConcentration * weights.heatZoneConcentration) * 10
  ) / 10;
}

function generateImprovementSuggestions(ratings: ExperimentRatings): string[] {
  const suggestions: string[] = [];
  const THRESHOLD = 3;
  if (ratings.stability <= THRESHOLD) {
    suggestions.push('稳定性较低：建议降低扩散系数或增加边界约束强度以减少温度振荡');
  }
  if (ratings.heatingSpeed <= THRESHOLD) {
    suggestions.push('升温速度不足：建议选用高导热材料或增大热源温度与半径');
  }
  if (ratings.heatZoneConcentration <= THRESHOLD) {
    suggestions.push('热区集中度偏低：建议缩小热源范围、降低边界温度以集中热能分布');
  }
  return suggestions;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    let favorites = await fileService.listJsonFiles<ExperimentResult>(FAVORITES_DIR, {
      sortBy: 'completedAt',
      order: 'desc'
    });

    const { tag, minRating, maxRating, sortBy } = req.query;

    if (tag && typeof tag === 'string') {
      const tags = tag.split(',');
      favorites = favorites.filter(fav =>
        fav.tags && fav.tags.some(t => tags.includes(t))
      );
    }

    if (minRating && typeof minRating === 'string') {
      const min = parseFloat(minRating);
      if (!isNaN(min)) {
        favorites = favorites.filter(fav => fav.recommendationIndex >= min);
      }
    }

    if (maxRating && typeof maxRating === 'string') {
      const max = parseFloat(maxRating);
      if (!isNaN(max)) {
        favorites = favorites.filter(fav => fav.recommendationIndex <= max);
      }
    }

    if (sortBy === 'recommendationIndex') {
      favorites.sort((a, b) => (b.recommendationIndex ?? 0) - (a.recommendationIndex ?? 0));
    } else if (sortBy === 'stability') {
      favorites.sort((a, b) => (b.ratings?.stability ?? 0) - (a.ratings?.stability ?? 0));
    } else if (sortBy === 'heatingSpeed') {
      favorites.sort((a, b) => (b.ratings?.heatingSpeed ?? 0) - (a.ratings?.heatingSpeed ?? 0));
    } else if (sortBy === 'heatZoneConcentration') {
      favorites.sort((a, b) => (b.ratings?.heatZoneConcentration ?? 0) - (a.ratings?.heatZoneConcentration ?? 0));
    }

    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load favorites' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result: ExperimentResult = req.body;

    if (!result.ratings || !result.tags) {
      return res.status(400).json({
        success: false,
        error: 'Ratings and tags are required'
      });
    }

    result.recommendationIndex = calculateRecommendationIndex(result.ratings);
    result.improvementSuggestions = generateImprovementSuggestions(result.ratings);

    const filePath = fileService.getPath('favorites', `${result.id}.json`);

    if (await fileService.fileExists(filePath)) {
      return res.status(400).json({ success: false, error: 'Favorite already exists' });
    }

    await fileService.writeJsonFile(filePath, result);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('favorites', `${req.params.id}.json`);
    const deleted = await fileService.deleteFile(filePath);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Favorite not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete favorite' });
  }
});

export default router;
