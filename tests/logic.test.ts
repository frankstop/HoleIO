import { describe, expect, it } from 'vitest';
import { canEat, clampWorld, formatTime, radiusForScore, scoreAfterDeath, tierForScore, tierProgress } from '../src/game/logic';

describe('game progression', () => {
  it('selects tiers at exact score thresholds', () => {
    expect(tierForScore(0).id).toBe(1);
    expect(tierForScore(600).id).toBe(4);
    expect(tierForScore(16000).id).toBe(8);
  });

  it('interpolates radius without crossing tier bounds', () => {
    expect(radiusForScore(0)).toBe(1);
    expect(radiusForScore(50)).toBe(1.65);
    expect(radiusForScore(16000)).toBe(14);
  });

  it('enforces the 88 percent aperture rule', () => {
    expect(canEat(1, 0.88)).toBe(true);
    expect(canEat(1, 0.881)).toBe(false);
  });

  it('reports tier progress and formats the clock', () => {
    expect(tierProgress(125)).toBeCloseTo(0.5);
    expect(formatTime(62)).toBe('01:02');
    expect(formatTime(-2)).toBe('00:00');
  });

  it('clamps boundaries and applies the death penalty', () => {
    expect(clampWorld(200, 4)).toBe(116);
    expect(scoreAfterDeath(999)).toBe(699);
  });
});
