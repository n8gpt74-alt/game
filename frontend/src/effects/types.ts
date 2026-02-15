import * as THREE from 'three';

// Time system types
export type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

export interface SkyColors {
  top: string;
  middle: string;
  bottom: string;
}

export interface TimeState {
  currentMinute: number;
  period: TimePeriod;
  skyColors: SkyColors;
  lightIntensity: number;
  sunPosition: THREE.Vector3;
  moonPosition: THREE.Vector3;
}

// Weather system types
export type WeatherType = 'rain' | 'snow';

export interface WeatherParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
}

export interface WeatherState {
  active: boolean;
  type: WeatherType | null;
  startTime: number;
  duration: number;
  particles: WeatherParticle[];
  particleCount: number;
}

// Particle system types
export type ParticleEffect = 'sparks' | 'hearts' | 'bubbles' | 'sparkles' | 'trail';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: THREE.Color;
  effect: ParticleEffect;
}

export interface ParticleState {
  activeParticles: Particle[];
  particlePool: Particle[];
  maxParticles: number;
  emissionQueue: EmissionRequest[];
}

export interface EmissionRequest {
  effect: ParticleEffect;
  position: THREE.Vector3;
  count: number;
  timestamp: number;
}

// Performance types
export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualitySettings {
  particleCount: number;
  shadowsEnabled: boolean;
  weatherParticleCount: number;
  antialiasing: boolean;
  maxButterflies: number;
}

export interface PerformanceState {
  currentFPS: number;
  frameHistory: number[];
  qualityLevel: QualityLevel;
  autoAdjustEnabled: boolean;
  lowFPSCount: number;
}

// Settings types
export interface SettingsState {
  qualityLevel: QualityLevel;
  weatherEnabled: boolean;
  particlesEnabled: boolean;
  shadowsEnabled: boolean;
  timeSpeed: number;
  isMobile: boolean;
}

export interface EffectSettings {
  qualityLevel: QualityLevel;
  weatherEnabled: boolean;
  particlesEnabled: boolean;
  shadowsEnabled: boolean;
  timeSpeed: number;
}

// Environment types
export interface ButterflyObject {
  mesh: THREE.Group;
  currentTarget: THREE.Vector3;
  speed: number;
  flutterPhase: number;
}

export interface LeafParticle {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Euler;
}

export interface CloudObject {
  mesh: THREE.Mesh;
  speed: number;
  position: THREE.Vector3;
}

export interface CelestialBody {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  visible: boolean;
}

export interface ActionLight {
  light: THREE.PointLight;
  startTime: number;
  duration: number;
}

// Action types
export type ActionType = 'feed' | 'wash' | 'play' | 'heal' | 'chat' | 'sleep' | 'clean' | 'levelup';
