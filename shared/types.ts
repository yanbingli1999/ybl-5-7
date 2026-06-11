export interface Material {
  id: string;
  name: string;
  diffusionCoefficient: number;
  description: string;
}

export interface GridConfig {
  width: number;
  height: number;
  cellSize: number;
}

export interface BoundaryConditions {
  top: number;
  bottom: number;
  left: number;
  right: number;
  type: 'dirichlet' | 'neumann';
}

export interface HeatSource {
  x: number;
  y: number;
  temperature: number;
  radius: number;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  createdAt: number;
  grid: GridConfig;
  materialId: string;
  boundaryConditions: BoundaryConditions;
  initialHeatSources: HeatSource[];
  totalSteps: number;
  timeStep: number;
}

export interface TemperatureSnapshot {
  id: string;
  experimentId: string;
  step: number;
  timestamp: number;
  temperatureData: number[][];
  name?: string;
}

export interface ExperimentRatings {
  stability: number;
  heatingSpeed: number;
  heatZoneConcentration: number;
}

export const BUSINESS_TAGS = [
  '高效加热',
  '精密温控',
  '大面积散热',
  '局部强化',
  '节能优化',
  '快速原型',
  '教学演示',
  '工业应用',
] as const;

export type BusinessTag = typeof BUSINESS_TAGS[number];

export interface ExperimentResult {
  id: string;
  config: ExperimentConfig;
  snapshots: TemperatureSnapshot[];
  isFavorite: boolean;
  completedAt: number;
  ratings: ExperimentRatings;
  tags: BusinessTag[];
  recommendationIndex: number;
  improvementSuggestions: string[];
}

export type SimulationMode = 'idle' | 'running' | 'paused' | 'finished';
