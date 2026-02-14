// Export all visual effects modules
export { TimeManager } from './TimeManager';
export { SkyManager } from './SkyManager';
export { WeatherSystem } from './WeatherSystem';
export { EnvironmentAnimator } from './EnvironmentAnimator';
export { ParticleEmitter } from './ParticleEmitter';
export { LightingRig } from './LightingRig';
export { PerformanceManager } from './PerformanceManager';
export { VisualEffectsCoordinator, visualEffects } from './VisualEffectsCoordinator';

// Export types
export type {
  TimePeriod,
  SkyColors,
  TimeState,
  WeatherType,
  WeatherParticle,
  WeatherState,
  ParticleEffect,
  Particle,
  ParticleState,
  EmissionRequest,
  QualityLevel,
  QualitySettings,
  PerformanceState,
  SettingsState,
  EffectSettings,
  ButterflyObject,
  LeafParticle,
  CloudObject,
  CelestialBody,
  ActionLight,
  ActionType
} from './types';
