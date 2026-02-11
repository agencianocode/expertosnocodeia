// Points and levels system
export const LEVELS = [
  { level: 1, points: 0 },
  { level: 2, points: 100 },
  { level: 3, points: 200 },
  { level: 4, points: 400 },
  { level: 5, points: 1200 },
  { level: 6, points: 2400 },
  { level: 7, points: 4800 },
  { level: 8, points: 7200 },
  { level: 9, points: 10400 },
];

export function calculateLevel(points: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].points) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

export function getPointsForNextLevel(currentLevel: number, currentPoints: number): number {
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return 0;
  return Math.max(0, nextLevel.points - currentPoints);
}

export function getLevelInfo(level: number) {
  return LEVELS.find(l => l.level === level) || LEVELS[0];
}

// Points awarded per activity type
export const POINTS_PER_ACTIVITY = {
  message: 5,
  post: 10,
  comment: 3,
  reaction: 1,
} as const;

export type ActivityType = keyof typeof POINTS_PER_ACTIVITY;

