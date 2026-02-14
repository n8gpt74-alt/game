import type { QualityLevel, QualitySettings, PerformanceState } from './types';

type QualityChangeCallback = (level: QualityLevel) => void;

export class PerformanceManager {
  private state: PerformanceState = {
    currentFPS: 60,
    frameHistory: [],
    qualityLevel: 'high',
    autoAdjustEnabled: true,
    lowFPSCount: 0
  };
  
  private callbacks: QualityChangeCallback[] = [];
  private running: boolean = false;
  private lastFrameTime: number = 0;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL_MS = 1000; // 1 second
  private readonly FPS_THRESHOLD = 45;
  private readonly LOW_FPS_DURATION = 3; // 3 seconds
  
  private readonly QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
    low: {
      particleCount: 100,
      shadowsEnabled: false,
      weatherParticleCount: 100,
      antialiasing: false,
      maxButterflies: 2
    },
    medium: {
      particleCount: 150,
      shadowsEnabled: true,
      weatherParticleCount: 200,
      antialiasing: false,
      maxButterflies: 3
    },
    high: {
      particleCount: 200,
      shadowsEnabled: true,
      weatherParticleCount: 300,
      antialiasing: true,
      maxButterflies: 5
    }
  };
  
  constructor() {
    // Detect mobile device
    const isMobile = this.detectMobile();
    
    if (isMobile) {
      this.state.qualityLevel = 'medium';
    }
    
    // Load saved settings
    this.loadSettings();
  }
  
  start(): void {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.lastCheckTime = Date.now();
  }
  
  stop(): void {
    this.running = false;
  }
  
  update(deltaTime: number): void {
    if (!this.running) return;
    
    const now = performance.now();
    const frameDuration = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Calculate FPS
    const fps = frameDuration > 0 ? 1000 / frameDuration : 60;
    
    // Add to history (keep last 60 frames)
    this.state.frameHistory.push(fps);
    if (this.state.frameHistory.length > 60) {
      this.state.frameHistory.shift();
    }
    
    // Calculate average FPS
    const sum = this.state.frameHistory.reduce((a, b) => a + b, 0);
    this.state.currentFPS = sum / this.state.frameHistory.length;
    
    // Check for quality adjustment
    const currentTime = Date.now();
    if (currentTime - this.lastCheckTime >= this.CHECK_INTERVAL_MS) {
      this.lastCheckTime = currentTime;
      this.checkPerformance();
    }
  }
  
  private checkPerformance(): void {
    if (!this.state.autoAdjustEnabled) return;
    
    if (this.state.currentFPS < this.FPS_THRESHOLD) {
      this.state.lowFPSCount++;
      
      if (this.state.lowFPSCount >= this.LOW_FPS_DURATION) {
        // Reduce quality
        if (this.state.qualityLevel === 'high') {
          this.setQualityLevel('medium');
        } else if (this.state.qualityLevel === 'medium') {
          this.setQualityLevel('low');
        }
        
        this.state.lowFPSCount = 0;
      }
    } else {
      this.state.lowFPSCount = 0;
    }
  }
  
  getCurrentFPS(): number {
    return this.state.currentFPS;
  }
  
  setQualityLevel(level: QualityLevel): void {
    if (this.state.qualityLevel === level) return;
    
    this.state.qualityLevel = level;
    this.saveSettings();
    this.notifyCallbacks();
  }
  
  getQualitySettings(): QualitySettings {
    return { ...this.QUALITY_PRESETS[this.state.qualityLevel] };
  }
  
  onQualityChange(callback: QualityChangeCallback): void {
    this.callbacks.push(callback);
  }
  
  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      callback(this.state.qualityLevel);
    }
  }
  
  private detectMobile(): boolean {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }
  
  private saveSettings(): void {
    try {
      const settings = {
        qualityLevel: this.state.qualityLevel,
        autoAdjustEnabled: this.state.autoAdjustEnabled
      };
      localStorage.setItem('visual_effects_settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save performance settings:', error);
    }
  }
  
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('visual_effects_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.qualityLevel = settings.qualityLevel || this.state.qualityLevel;
        this.state.autoAdjustEnabled = settings.autoAdjustEnabled ?? this.state.autoAdjustEnabled;
      }
    } catch (error) {
      console.warn('Failed to load performance settings:', error);
    }
  }
  
  setAutoAdjust(enabled: boolean): void {
    this.state.autoAdjustEnabled = enabled;
    this.saveSettings();
  }
  
  get qualityLevel(): QualityLevel {
    return this.state.qualityLevel;
  }
}
