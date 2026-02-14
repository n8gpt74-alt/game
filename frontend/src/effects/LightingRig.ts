import * as THREE from 'three';
import type { TimePeriod, ActionLight, ActionType } from './types';

export class LightingRig {
  private scene: THREE.Scene | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private actionLights: ActionLight[] = [];
  private shadowsEnabled: boolean = true;
  
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.createLights();
  }
  
  removeFromScene(): void {
    if (this.directionalLight && this.scene) {
      this.scene.remove(this.directionalLight);
      this.directionalLight = null;
    }
    
    if (this.ambientLight && this.scene) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }
    
    for (const actionLight of this.actionLights) {
      if (this.scene) {
        this.scene.remove(actionLight.light);
      }
    }
    
    this.actionLights = [];
    this.scene = null;
  }
  
  private createLights(): void {
    if (!this.scene) return;
    
    // Directional light (sun/moon)
    this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    this.directionalLight.position.set(5, 10, 5);
    this.directionalLight.castShadow = this.shadowsEnabled;
    
    if (this.shadowsEnabled) {
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 50;
      this.directionalLight.shadow.camera.left = -10;
      this.directionalLight.shadow.camera.right = 10;
      this.directionalLight.shadow.camera.top = 10;
      this.directionalLight.shadow.camera.bottom = -10;
    }
    
    this.scene.add(this.directionalLight);
    
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    this.scene.add(this.ambientLight);
  }
  
  updateTimeOfDay(time: number, period: TimePeriod): void {
    if (!this.directionalLight || !this.ambientLight) return;
    
    // Update light color based on period
    const colors = {
      morning: 0xFFB366, // Warm orange
      day: 0xFFFFFF,     // White
      evening: 0xFF8C42, // Orange
      night: 0x6B8EFF    // Blue
    };
    
    this.directionalLight.color.setHex(colors[period]);
    
    // Update light intensity
    const intensities = {
      morning: 0.5,
      day: 0.8,
      evening: 0.5,
      night: 0.3
    };
    
    this.directionalLight.intensity = intensities[period];
    this.ambientLight.intensity = intensities[period] * 0.5;
    
    // Update light position (sun/moon arc)
    if (period === 'morning' || period === 'day') {
      // Sun arc (0-12 minutes)
      const progress = time / 12;
      const angle = Math.PI * progress;
      
      this.directionalLight.position.set(
        Math.cos(angle) * 15,
        Math.sin(angle) * 15,
        5
      );
    } else {
      // Moon arc (12-24 minutes)
      const progress = (time - 12) / 12;
      const angle = Math.PI * progress;
      
      this.directionalLight.position.set(
        Math.cos(angle) * 15,
        Math.sin(angle) * 15,
        5
      );
    }
    
    // Update shadow map
    if (this.shadowsEnabled && this.directionalLight.shadow) {
      this.directionalLight.shadow.needsUpdate = true;
    }
  }
  
  addActionLight(position: THREE.Vector3, action: ActionType): void {
    if (!this.scene) return;
    
    // Map action to color
    const colors: Record<ActionType, number> = {
      feed: 0xFFD700,    // Yellow
      wash: 0x4A90E2,    // Blue
      play: 0xFF69B4,    // Pink
      heal: 0x00FF7F,    // Green
      levelup: 0xFFFFFF  // White
    };
    
    const color = colors[action] || 0xFFFFFF;
    
    const light = new THREE.PointLight(color, 1, 5);
    light.position.copy(position);
    
    this.scene.add(light);
    
    this.actionLights.push({
      light,
      startTime: Date.now(),
      duration: 1000 // 1 second
    });
  }
  
  update(deltaTime: number): void {
    const now = Date.now();
    
    // Update and remove expired action lights
    for (let i = this.actionLights.length - 1; i >= 0; i--) {
      const actionLight = this.actionLights[i];
      const elapsed = now - actionLight.startTime;
      
      if (elapsed >= actionLight.duration) {
        if (this.scene) {
          this.scene.remove(actionLight.light);
        }
        this.actionLights.splice(i, 1);
      } else {
        // Fade out
        const progress = elapsed / actionLight.duration;
        actionLight.light.intensity = 1 - progress;
      }
    }
  }
  
  setShadowsEnabled(enabled: boolean): void {
    this.shadowsEnabled = enabled;
    
    if (this.directionalLight) {
      this.directionalLight.castShadow = enabled;
    }
  }
  
  getDirectionalLight(): THREE.DirectionalLight | null {
    return this.directionalLight;
  }
  
  getAmbientLight(): THREE.AmbientLight | null {
    return this.ambientLight;
  }
  
  applyWeatherLighting(factor: number): void {
    if (!this.ambientLight) return;
    
    // Reduce ambient light during weather
    const baseIntensity = 0.4;
    this.ambientLight.intensity = baseIntensity * factor;
  }
}
