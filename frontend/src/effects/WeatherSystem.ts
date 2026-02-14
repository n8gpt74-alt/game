import * as THREE from 'three';
import type { WeatherType, WeatherParticle, WeatherState } from './types';

export class WeatherSystem {
  private scene: THREE.Scene | null = null;
  private state: WeatherState = {
    active: false,
    type: null,
    startTime: 0,
    duration: 0,
    particles: [],
    particleCount: 0
  };
  
  private particleSystem: THREE.Points | null = null;
  private running: boolean = false;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly WEATHER_PROBABILITY = 0.15; // 15%
  private maxParticles: number = 300;
  
  start(): void {
    this.running = true;
    this.lastCheckTime = Date.now();
  }
  
  stop(): void {
    this.running = false;
    this.clearWeather();
  }
  
  setWeather(type: WeatherType, duration: number): void {
    this.clearWeather();
    
    this.state.active = true;
    this.state.type = type;
    this.state.startTime = Date.now();
    this.state.duration = duration;
    
    this.createParticleSystem(type);
  }
  
  clearWeather(): void {
    if (this.particleSystem && this.scene) {
      // Fade out particles over 2 seconds
      const material = this.particleSystem.material as THREE.PointsMaterial;
      const fadeStart = Date.now();
      const fadeDuration = 2000;
      
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - fadeStart;
        const progress = Math.min(elapsed / fadeDuration, 1);
        material.opacity = 1 - progress;
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          if (this.particleSystem && this.scene) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            if (Array.isArray(this.particleSystem.material)) {
              this.particleSystem.material.forEach(m => m.dispose());
            } else {
              this.particleSystem.material.dispose();
            }
            this.particleSystem = null;
          }
        }
      }, 16);
    }
    
    this.state.active = false;
    this.state.type = null;
    this.state.particles = [];
    this.state.particleCount = 0;
  }
  
  update(deltaTime: number): void {
    if (!this.running) return;
    
    const now = Date.now();
    
    // Check for random weather trigger
    if (now - this.lastCheckTime >= this.CHECK_INTERVAL_MS) {
      this.lastCheckTime = now;
      
      if (!this.state.active && Math.random() < this.WEATHER_PROBABILITY) {
        // Trigger random weather
        const weatherTypes: WeatherType[] = ['rain', 'snow'];
        const randomType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        const randomDuration = (1 + Math.random() * 2) * 60 * 1000; // 1-3 minutes
        
        this.setWeather(randomType, randomDuration);
      }
    }
    
    // Check if current weather should end
    if (this.state.active && now - this.state.startTime >= this.state.duration) {
      this.clearWeather();
      return;
    }
    
    // Update particles
    if (this.state.active && this.particleSystem) {
      this.updateParticles(deltaTime);
    }
  }
  
  private createParticleSystem(type: WeatherType): void {
    if (!this.scene) return;
    
    const particleCount = type === 'rain' ? 250 : 180;
    this.state.particleCount = particleCount;
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Random position in a box above the scene
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = 5 + Math.random() * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      if (type === 'rain') {
        // Rain falls straight down, fast
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = -(5 + Math.random() * 2);
        velocities[i * 3 + 2] = 0;
      } else {
        // Snow falls slowly with drift
        velocities[i * 3] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 1] = -(1 + Math.random());
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
      
      this.state.particles.push({
        position: new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
        velocity: new THREE.Vector3(velocities[i * 3], velocities[i * 3 + 1], velocities[i * 3 + 2]),
        lifetime: 0
      });
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: type === 'rain' ? 0x4A90E2 : 0xFFFFFF,
      size: type === 'rain' ? 0.1 : 0.15,
      transparent: true,
      opacity: type === 'rain' ? 0.6 : 0.8
    });
    
    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }
  
  private updateParticles(deltaTime: number): void {
    if (!this.particleSystem) return;
    
    const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.state.particles.length; i++) {
      const particle = this.state.particles[i];
      
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      
      // Check if particle hit ground
      if (particle.position.y < 0) {
        // Respawn at top
        particle.position.x = (Math.random() - 0.5) * 20;
        particle.position.y = 10 + Math.random() * 5;
        particle.position.z = (Math.random() - 0.5) * 20;
      }
      
      // Update buffer
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    }
    
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }
  
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
  }
  
  removeFromScene(): void {
    this.clearWeather();
    this.scene = null;
  }
  
  get currentWeather(): WeatherType | null {
    return this.state.type;
  }
  
  get isActive(): boolean {
    return this.state.active;
  }
  
  setMaxParticles(max: number): void {
    this.maxParticles = max;
  }
  
  // Get lighting reduction factor (0.8 = 20% reduction)
  getLightingFactor(): number {
    return this.state.active ? 0.8 : 1.0;
  }
}
