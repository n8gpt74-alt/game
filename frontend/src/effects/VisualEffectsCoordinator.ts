import * as THREE from 'three';
import { TimeManager } from './TimeManager';
import { SkyManager } from './SkyManager';
import { WeatherSystem } from './WeatherSystem';
import { EnvironmentAnimator } from './EnvironmentAnimator';
import { ParticleEmitter } from './ParticleEmitter';
import { LightingRig } from './LightingRig';
import { PerformanceManager } from './PerformanceManager';
import type { EffectSettings, ActionType } from './types';

export class VisualEffectsCoordinator {
  private static instance: VisualEffectsCoordinator | null = null;
  
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  
  private timeManager: TimeManager;
  private skyManager: SkyManager;
  private weatherSystem: WeatherSystem;
  private environmentAnimator: EnvironmentAnimator;
  private particleEmitter: ParticleEmitter;
  private lightingRig: LightingRig;
  private performanceManager: PerformanceManager;
  
  private initialized: boolean = false;
  private running: boolean = false;
  
  private constructor() {
    this.timeManager = new TimeManager();
    this.skyManager = new SkyManager();
    this.weatherSystem = new WeatherSystem();
    this.environmentAnimator = new EnvironmentAnimator();
    this.particleEmitter = new ParticleEmitter();
    this.lightingRig = new LightingRig();
    this.performanceManager = new PerformanceManager();
    
    // Wire up quality changes
    this.performanceManager.onQualityChange((level) => {
      this.applyQualitySettings();
    });
  }
  
  static getInstance(): VisualEffectsCoordinator {
    if (!VisualEffectsCoordinator.instance) {
      VisualEffectsCoordinator.instance = new VisualEffectsCoordinator();
    }
    return VisualEffectsCoordinator.instance;
  }
  
  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.initialized) return;
    
    this.scene = scene;
    this.camera = camera;
    
    // Add all systems to scene
    this.skyManager.addToScene(scene);
    this.weatherSystem.addToScene(scene);
    this.environmentAnimator.addToScene(scene);
    this.particleEmitter.addToScene(scene);
    this.lightingRig.addToScene(scene);
    
    // Add butterflies
    for (let i = 0; i < 4; i++) {
      this.environmentAnimator.addButterfly(scene);
    }
    
    this.initialized = true;
    
    // Apply initial quality settings
    this.applyQualitySettings();
  }
  
  start(): void {
    if (!this.initialized || this.running) return;
    
    this.running = true;
    this.timeManager.start();
    this.weatherSystem.start();
    this.environmentAnimator.start();
    this.performanceManager.start();
  }
  
  stop(): void {
    this.running = false;
    this.timeManager.pause();
    this.weatherSystem.stop();
    this.environmentAnimator.stop();
    this.performanceManager.stop();
  }
  
  update(deltaTime: number): void {
    if (!this.running || !this.scene) return;
    
    // Update performance monitoring
    this.performanceManager.update(deltaTime);
    
    // Get current time state
    const timeState = this.timeManager.getState();
    
    // Update sky
    this.skyManager.update(timeState.currentMinute, timeState.period, deltaTime);
    this.skyManager.updateSkyColor(timeState.skyColors.top);
    
    // Update lighting
    this.lightingRig.updateTimeOfDay(timeState.currentMinute, timeState.period);
    
    // Apply weather lighting
    const weatherFactor = this.weatherSystem.getLightingFactor();
    this.lightingRig.applyWeatherLighting(weatherFactor);
    
    // Update weather
    this.weatherSystem.update(deltaTime);
    
    // Update environment animations
    this.environmentAnimator.update(deltaTime);
    
    // Update particles
    this.particleEmitter.update(deltaTime);
    
    // Update action lights
    this.lightingRig.update(deltaTime);
  }
  
  triggerActionEffect(action: ActionType, position: THREE.Vector3): void {
    if (!this.running) return;
    
    // Emit particles based on action
    switch (action) {
      case 'feed':
        this.particleEmitter.emit('sparkles', position, 15);
        break;
      case 'wash':
        this.particleEmitter.emit('bubbles', position, 25);
        break;
      case 'play':
        this.particleEmitter.emit('hearts', position, 8);
        break;
      case 'heal':
        this.particleEmitter.emit('sparkles', position, 20);
        break;
      case 'levelup':
        this.particleEmitter.emit('sparks', position, 40);
        break;
    }
    
    // Add action light
    this.lightingRig.addActionLight(position, action);
  }
  
  triggerHappinessHearts(position: THREE.Vector3): void {
    if (!this.running) return;
    this.particleEmitter.emit('hearts', position, 6);
  }
  
  triggerMovementTrail(position: THREE.Vector3): void {
    if (!this.running) return;
    this.particleEmitter.emit('trail', position, 3);
  }
  
  getSettings(): EffectSettings {
    const qualitySettings = this.performanceManager.getQualitySettings();
    
    return {
      qualityLevel: this.performanceManager.qualityLevel,
      weatherEnabled: this.weatherSystem.isActive || true,
      particlesEnabled: true,
      shadowsEnabled: qualitySettings.shadowsEnabled,
      timeSpeed: 1
    };
  }
  
  applySettings(settings: Partial<EffectSettings>): void {
    if (settings.qualityLevel !== undefined) {
      this.performanceManager.setQualityLevel(settings.qualityLevel);
    }
    
    if (settings.weatherEnabled !== undefined) {
      if (!settings.weatherEnabled) {
        this.weatherSystem.clearWeather();
        this.weatherSystem.stop();
      } else {
        this.weatherSystem.start();
      }
    }
    
    if (settings.particlesEnabled !== undefined) {
      if (!settings.particlesEnabled) {
        this.particleEmitter.clear();
      }
    }
    
    if (settings.shadowsEnabled !== undefined) {
      this.lightingRig.setShadowsEnabled(settings.shadowsEnabled);
    }
    
    this.saveSettings(settings);
  }
  
  private applyQualitySettings(): void {
    const settings = this.performanceManager.getQualitySettings();
    
    // Apply to particle emitter
    this.particleEmitter.setMaxParticles(settings.particleCount);
    
    // Apply to weather system
    this.weatherSystem.setMaxParticles(settings.weatherParticleCount);
    
    // Apply to lighting
    this.lightingRig.setShadowsEnabled(settings.shadowsEnabled);
  }
  
  private saveSettings(settings: Partial<EffectSettings>): void {
    try {
      const current = this.getSettings();
      const merged = { ...current, ...settings };
      localStorage.setItem('visual_effects_user_settings', JSON.stringify(merged));
    } catch (error) {
      console.warn('Failed to save visual effects settings:', error);
    }
  }
  
  private loadSettings(): EffectSettings | null {
    try {
      const saved = localStorage.getItem('visual_effects_user_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load visual effects settings:', error);
    }
    return null;
  }
  
  dispose(): void {
    this.stop();
    
    if (this.scene) {
      this.skyManager.removeFromScene(this.scene);
      this.weatherSystem.removeFromScene();
      this.environmentAnimator.removeFromScene();
      this.particleEmitter.removeFromScene();
      this.lightingRig.removeFromScene();
    }
    
    this.initialized = false;
    this.scene = null;
    this.camera = null;
  }
  
  // Getters for debugging
  get currentFPS(): number {
    return this.performanceManager.getCurrentFPS();
  }
  
  get currentTime(): number {
    return this.timeManager.currentTime;
  }
  
  get currentWeather(): string | null {
    return this.weatherSystem.currentWeather;
  }
}

// Export singleton instance
export const visualEffects = VisualEffectsCoordinator.getInstance();
