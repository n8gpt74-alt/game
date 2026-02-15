import * as THREE from 'three';
import type { TimePeriod, SkyColors, TimeState } from './types';

type TimeChangeCallback = (time: number, period: TimePeriod) => void;

export class TimeManager {
  private currentMinute: number = 0;
  private currentPeriod: TimePeriod = 'morning';
  private running: boolean = false;
  private lastUpdateTime: number = 0;
  private callbacks: TimeChangeCallback[] = [];
  private animationFrameId: number | null = null;
  
  // 24 minutes real time = 24 game hours
  // 1 minute real time = 1 game hour
  // 1 second real time = 1 game minute
  private readonly CYCLE_DURATION_MS = 24 * 60 * 1000; // 24 minutes in milliseconds
  private readonly MINUTES_PER_MS = 24 / this.CYCLE_DURATION_MS;
  
  // Color palettes for each period
  private readonly COLOR_PALETTES = {
    morning: {
      top: '#FF9A76',      // Warm orange
      middle: '#FFB6A3',   // Light pink
      bottom: '#87CEEB'    // Sky blue
    },
    day: {
      top: '#87CEEB',      // Sky blue
      middle: '#B0E0E6',   // Powder blue
      bottom: '#E0F6FF'    // Very light blue
    },
    evening: {
      top: '#FF6B35',      // Deep orange
      middle: '#9B59B6',   // Purple
      bottom: '#2C3E50'    // Dark blue
    },
    night: {
      top: '#0F1419',      // Very dark blue
      middle: '#1A2332',   // Dark blue
      bottom: '#2C3E50'    // Lighter dark blue
    }
  };
  
  constructor(initialMinute: number = 0) {
    this.currentMinute = ((initialMinute % 24) + 24) % 24;
    this.currentPeriod = this.getPeriodForTime(this.currentMinute);
  }
  
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastUpdateTime = performance.now();
    this.update();
  }
  
  pause(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private update = (): void => {
    if (!this.running) return;
    
    const now = performance.now();
    const deltaMs = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    // Advance time
    this.currentMinute += deltaMs * this.MINUTES_PER_MS;
    
    // Wrap around at 24 minutes
    if (this.currentMinute >= 24) {
      this.currentMinute = this.currentMinute % 24;
    }
    
    // Check for period change
    const newPeriod = this.getPeriodForTime(this.currentMinute);
    if (newPeriod !== this.currentPeriod) {
      this.currentPeriod = newPeriod;
      this.notifyCallbacks();
    }
    
    this.animationFrameId = requestAnimationFrame(this.update);
  };
  
  private getPeriodForTime(time: number): TimePeriod {
    if (time >= 0 && time < 6) return 'morning';
    if (time >= 6 && time < 12) return 'day';
    if (time >= 12 && time < 18) return 'evening';
    return 'night';
  }
  
  getSkyColors(): SkyColors {
    const currentPalette = this.COLOR_PALETTES[this.currentPeriod];
    
    // Get next period for smooth transitions
    const nextPeriod = this.getNextPeriod(this.currentPeriod);
    const nextPalette = this.COLOR_PALETTES[nextPeriod];
    
    // Calculate transition progress (30 seconds = 0.5 minutes)
    const periodStart = this.getPeriodStartTime(this.currentPeriod);
    const timeSincePeriodStart = this.currentMinute - periodStart;
    const transitionDuration = 0.5; // 30 seconds
    
    if (timeSincePeriodStart < transitionDuration) {
      // In transition, interpolate colors
      const t = timeSincePeriodStart / transitionDuration;
      const prevPeriod = this.getPreviousPeriod(this.currentPeriod);
      const prevPalette = this.COLOR_PALETTES[prevPeriod];
      
      return {
        top: this.lerpColor(prevPalette.top, currentPalette.top, t),
        middle: this.lerpColor(prevPalette.middle, currentPalette.middle, t),
        bottom: this.lerpColor(prevPalette.bottom, currentPalette.bottom, t)
      };
    }
    
    return currentPalette;
  }
  
  getLightIntensity(): number {
    // Day: 0.8, Night: 0.3, Morning/Evening: interpolated
    const periodIntensities = {
      morning: 0.5,
      day: 0.8,
      evening: 0.5,
      night: 0.3
    };
    
    const currentIntensity = periodIntensities[this.currentPeriod];
    
    // Smooth transition at period boundaries
    const periodStart = this.getPeriodStartTime(this.currentPeriod);
    const timeSincePeriodStart = this.currentMinute - periodStart;
    const transitionDuration = 0.5;
    
    if (timeSincePeriodStart < transitionDuration) {
      const t = timeSincePeriodStart / transitionDuration;
      const prevPeriod = this.getPreviousPeriod(this.currentPeriod);
      const prevIntensity = periodIntensities[prevPeriod];
      return prevIntensity + (currentIntensity - prevIntensity) * t;
    }
    
    return currentIntensity;
  }
  
  getSunPosition(): THREE.Vector3 {
    // Sun visible during morning and day (0-12 minutes)
    if (this.currentMinute >= 0 && this.currentMinute < 12) {
      const progress = this.currentMinute / 12; // 0 to 1
      const angle = Math.PI * progress; // 0 to PI (sunrise to sunset)
      
      return new THREE.Vector3(
        Math.cos(angle) * 10,
        Math.sin(angle) * 10,
        -5
      );
    }
    
    // Sun below horizon
    return new THREE.Vector3(0, -10, -5);
  }
  
  getMoonPosition(): THREE.Vector3 {
    // Moon visible during evening and night (12-24 minutes)
    if (this.currentMinute >= 12 && this.currentMinute < 24) {
      const progress = (this.currentMinute - 12) / 12; // 0 to 1
      const angle = Math.PI * progress; // 0 to PI (moonrise to moonset)
      
      return new THREE.Vector3(
        Math.cos(angle) * 10,
        Math.sin(angle) * 10,
        -5
      );
    }
    
    // Moon below horizon
    return new THREE.Vector3(0, -10, -5);
  }
  
  getState(): TimeState {
    return {
      currentMinute: this.currentMinute,
      period: this.currentPeriod,
      skyColors: this.getSkyColors(),
      lightIntensity: this.getLightIntensity(),
      sunPosition: this.getSunPosition(),
      moonPosition: this.getMoonPosition()
    };
  }
  
  onTimeChange(callback: TimeChangeCallback): void {
    this.callbacks.push(callback);
  }
  
  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      callback(this.currentMinute, this.currentPeriod);
    }
  }
  
  private getNextPeriod(period: TimePeriod): TimePeriod {
    const periods: TimePeriod[] = ['morning', 'day', 'evening', 'night'];
    const index = periods.indexOf(period);
    return periods[(index + 1) % periods.length];
  }
  
  private getPreviousPeriod(period: TimePeriod): TimePeriod {
    const periods: TimePeriod[] = ['morning', 'day', 'evening', 'night'];
    const index = periods.indexOf(period);
    return periods[(index - 1 + periods.length) % periods.length];
  }
  
  private getPeriodStartTime(period: TimePeriod): number {
    const starts = {
      morning: 0,
      day: 6,
      evening: 12,
      night: 18
    };
    return starts[period];
  }
  
  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const result = new THREE.Color();
    result.r = c1.r + (c2.r - c1.r) * t;
    result.g = c1.g + (c2.g - c1.g) * t;
    result.b = c1.b + (c2.b - c1.b) * t;
    return '#' + result.getHexString();
  }
  
  // Test helpers
  setTime(minutes: number): void {
    this.currentMinute = ((minutes % 24) + 24) % 24;
    this.currentPeriod = this.getPeriodForTime(this.currentMinute);
  }
  
  advance(minutes: number): void {
    this.currentMinute = ((this.currentMinute + minutes) % 24 + 24) % 24;
    this.currentPeriod = this.getPeriodForTime(this.currentMinute);
  }
  
  get currentTime(): number {
    return this.currentMinute;
  }

  get period(): TimePeriod {
    return this.currentPeriod;
  }

  dispose(): void {
    this.pause();
    this.callbacks = [];
  }
}
