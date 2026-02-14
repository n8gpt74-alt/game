/**
 * Manager interfaces for the visual effects system
 */

import type * as THREE from 'three';
import type {
  TimePeriod,
  SkyColors,
  WeatherType,
  ParticleEffect,
  QualityLevel,
  QualitySettings,
  EffectSettings,
  ActionType
} from './types';

// ============================================================================
// TimeManager Interface
// ============================================================================

export interface TimeManager {
  // Current time in minutes (0-24)
  currentTime: number;
  
  // Time period (morning, day, evening, night)
  period: TimePeriod;
  
  // Start the time cycle
  start(): void;
  
  // Pause the time cycle
  pause(): void;
  
  // Get sky colors for current time
  getSkyColors(): SkyColors;
  
  // Get light intensity for current time
  getLightIntensity(): number;
  
  // Subscribe to time changes
  onTimeChange(callback: (time: number, period: TimePeriod) => void): void;
}

// ============================================================================
// SkyManager Interface
// ============================================================================

export interface SkyManager {
  // Update sky based on current time
  update(time: number, period: TimePeriod): void;
  
  // Add sky elements to scene
  addToScene(scene: THREE.Scene): void;
  
  // Remove sky elements from scene
  removeFromScene(scene: THREE.Scene): void;
  
  // Set cloud animation speed
  setCloudSpeed(speed: number): void;
}

// ============================================================================
// WeatherSystem Interface
// ============================================================================

export interface WeatherSystem {
  // Current weather state
  currentWeather: WeatherType | null;
  
  // Start weather system (random events)
  start(): void;
  
  // Stop weather system
  stop(): void;
  
  // Force specific weather
  setWeather(type: WeatherType, duration: number): void;
  
  // Clear current weather
  clearWeather(): void;
  
  // Update weather particles
  update(deltaTime: number): void;
}

// ============================================================================
// EnvironmentAnimator Interface
// ============================================================================

export interface EnvironmentAnimator {
  // Start all animations
  start(): void;
  
  // Stop all animations
  stop(): void;
  
  // Update animations
  update(deltaTime: number): void;
  
  // Add butterfly to scene
  addButterfly(scene: THREE.Scene): void;
  
  // Enable/disable falling leaves
  setFallingLeaves(enabled: boolean): void;
}

// ============================================================================
// ParticleEmitter Interface
// ============================================================================

export interface ParticleEmitter {
  // Emit particles for specific effect
  emit(effect: ParticleEffect, position: THREE.Vector3, count: number): void;
  
  // Update all active particles
  update(deltaTime: number): void;
  
  // Clear all particles
  clear(): void;
  
  // Set maximum particle count
  setMaxParticles(max: number): void;
}

// ============================================================================
// LightingRig Interface
// ============================================================================

export interface LightingRig {
  // Update lighting for current time
  updateTimeOfDay(time: number, period: TimePeriod): void;
  
  // Add temporary action light
  addActionLight(position: THREE.Vector3, color: THREE.Color, duration: number): void;
  
  // Enable/disable shadows
  setShadowsEnabled(enabled: boolean): void;
  
  // Get main directional light
  getDirectionalLight(): THREE.DirectionalLight;
  
  // Get ambient light
  getAmbientLight(): THREE.AmbientLight;
}

// ============================================================================
// PerformanceManager Interface
// ============================================================================

export interface PerformanceManager {
  // Current quality level
  qualityLevel: QualityLevel;
  
  // Start monitoring
  start(): void;
  
  // Stop monitoring
  stop(): void;
  
  // Get current FPS
  getCurrentFPS(): number;
  
  // Set quality level manually
  setQualityLevel(level: QualityLevel): void;
  
  // Get quality settings
  getQualitySettings(): QualitySettings;
  
  // Subscribe to quality changes
  onQualityChange(callback: (level: QualityLevel) => void): void;
}

// ============================================================================
// VisualEffectsCoordinator Interface
// ============================================================================

export interface VisualEffectsCoordinator {
  // Initialize all systems
  initialize(scene: THREE.Scene, camera: THREE.Camera): void;
  
  // Start all systems
  start(): void;
  
  // Stop all systems
  stop(): void;
  
  // Update all systems (call in animation loop)
  update(deltaTime: number): void;
  
  // Trigger action effect
  triggerActionEffect(action: ActionType, position: THREE.Vector3): void;
  
  // Get settings interface
  getSettings(): EffectSettings;
  
  // Apply settings
  applySettings(settings: Partial<EffectSettings>): void;
}
