import { TIERS, type TierDefinition } from './config';

export function tierForScore(score: number): TierDefinition {
  for (let i = TIERS.length - 1; i >= 0; i -= 1) {
    if (score >= TIERS[i].minScore) return TIERS[i];
  }
  return TIERS[0];
}

export function radiusForScore(score: number): number {
  const tier = tierForScore(score);
  const next = TIERS[tier.id] as TierDefinition | undefined;
  if (!next) return tier.radius;
  const progress = (score - tier.minScore) / (next.minScore - tier.minScore);
  return tier.radius + (next.radius - tier.radius) * Math.min(1, Math.max(0, progress));
}

export function speedForRadius(radius: number): number {
  return 4.2 + (9.5 - 4.2) * Math.pow(1 / Math.max(1, radius), 0.35);
}

export function canEat(holeRadius: number, objectRadius: number): boolean {
  return objectRadius <= holeRadius * 0.88;
}

export function tierProgress(score: number): number {
  const tier = tierForScore(score);
  const next = TIERS[tier.id] as TierDefinition | undefined;
  if (!next) return 1;
  return Math.min(1, Math.max(0, (score - tier.minScore) / (next.minScore - tier.minScore)));
}

export function formatTime(seconds: number): string {
  const clamped = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

export function clampWorld(value: number, radius: number, halfSize = 120): number {
  return Math.min(halfSize - radius, Math.max(-halfSize + radius, value));
}

export function scoreAfterDeath(score: number): number {
  return Math.floor(score * 0.7);
}
