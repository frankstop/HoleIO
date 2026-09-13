export type GameMode = 'classic' | 'zen';

export interface TierDefinition {
  id: number;
  name: string;
  shortName: string;
  minScore: number;
  radius: number;
  speed: number;
  nextLabel: string;
}

export const TIERS: TierDefinition[] = [
  { id: 1, name: 'Micro Litter', shortName: 'SCAVENGER', minScore: 0, radius: 1, speed: 9.5, nextLabel: 'STREET DECOR' },
  { id: 2, name: 'Street Decor', shortName: 'STREET SWEEPER', minScore: 50, radius: 1.65, speed: 8.6, nextLabel: 'URBAN LIFE' },
  { id: 3, name: 'Urban Living', shortName: 'URBAN PREDATOR', minScore: 200, radius: 2.6, speed: 7.8, nextLabel: 'VEHICLES' },
  { id: 4, name: 'Vehicles & Flora', shortName: 'BOULEVARD EATER', minScore: 600, radius: 3.9, speed: 6.9, nextLabel: 'HEAVY TRANSPORT' },
  { id: 5, name: 'Heavy Transport', shortName: 'CITY CRUSHER', minScore: 1500, radius: 5.6, speed: 6.1, nextLabel: 'SUBURBAN HOMES' },
  { id: 6, name: 'Suburban Homes', shortName: 'BLOCK BREAKER', minScore: 3500, radius: 7.8, speed: 5.4, nextLabel: 'COMMERCIAL BLOCKS' },
  { id: 7, name: 'Commercial Blocks', shortName: 'METRO DEVOURER', minScore: 8000, radius: 10.5, speed: 4.8, nextLabel: 'COLOSSAL TITANS' },
  { id: 8, name: 'Colossal Titans', shortName: 'SINGULARITY', minScore: 16000, radius: 14, speed: 4.2, nextLabel: 'MAXIMUM MASS' },
];

export type PropKind = 'can' | 'cone' | 'hydrant' | 'bench' | 'tree' | 'car' | 'bus' | 'container' | 'house' | 'shop' | 'apartment' | 'tower';

export interface PropDefinition {
  kind: PropKind;
  tier: number;
  radius: number;
  points: number;
  color: number;
  respawn: number;
}

export const PROP_DEFINITIONS: PropDefinition[] = [
  { kind: 'can', tier: 1, radius: 0.18, points: 3, color: 0xf7d154, respawn: 10 },
  { kind: 'cone', tier: 2, radius: 0.34, points: 8, color: 0xff7b42, respawn: 14 },
  { kind: 'hydrant', tier: 2, radius: 0.42, points: 12, color: 0xe95050, respawn: 16 },
  { kind: 'bench', tier: 3, radius: 1.02, points: 24, color: 0x9a633d, respawn: 20 },
  { kind: 'tree', tier: 4, radius: 1.7, points: 90, color: 0x4f9d53, respawn: 26 },
  { kind: 'car', tier: 4, radius: 2.25, points: 100, color: 0xf25f5c, respawn: 28 },
  { kind: 'bus', tier: 5, radius: 4.8, points: 310, color: 0xf6c445, respawn: 34 },
  { kind: 'container', tier: 5, radius: 4.2, points: 260, color: 0xdb654f, respawn: 32 },
  { kind: 'house', tier: 6, radius: 6.1, points: 720, color: 0xf1e0bc, respawn: 42 },
  { kind: 'shop', tier: 6, radius: 6.7, points: 820, color: 0x63a5af, respawn: 44 },
  { kind: 'apartment', tier: 7, radius: 9.1, points: 1850, color: 0xb26e55, respawn: 54 },
  { kind: 'tower', tier: 8, radius: 12.1, points: 4200, color: 0x6db1cb, respawn: 80 },
];

export const BOT_NAMES = ['NOVA', 'VEX', 'ORBIT', 'MAW', 'ECHO', 'RIFT', 'ZERO'];
export const BOT_COLORS = [0xff4fd8, 0xffa236, 0x9b7bff, 0xff5a6f, 0x7dff9d, 0x54a8ff, 0xf5ea63];

export const SKINS = [
  { id: 'classic', name: 'Classic Void', rim: '#2de7f0', accent: '#8bffff', unlock: 0 },
  { id: 'neon', name: 'Neon Cyber', rim: '#ff4fd8', accent: '#51f7ff', unlock: 3 },
  { id: 'molten', name: 'Molten Caldera', rim: '#ff7a32', accent: '#ffd35a', unlock: 5 },
  { id: 'gold', name: 'Golden Sovereign', rim: '#ffd85a', accent: '#fff1a1', unlock: 8 },
] as const;

export const WORLD_SIZE = 240;
export const MATCH_DURATION = 120;
