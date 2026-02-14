import * as THREE from 'three';
import type { ParticleEffect, Particle, EmissionRequest } from './types';

export class ParticleEmitter {
  private scene: THREE.Scene | null = null;
  private activeParticles: Particle[] = [];
  private particlePool: Particle[] = [];
  private maxParticles: number = 200;
  private emissionQueue: EmissionRequest[] = [];
  private particleSystems: Map<ParticleEffect, THREE.Points> = new Map();
  
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.createParticleSystems();
  }
  
  removeFromScene(): void {
    // Clean up all particle systems
    for (const [, system] of this.particleSystems) {
      if (this.scene) {
        this.scene.remove(system);
      }
      system.geometry.dispose();
      if (Array.isArray(system.material)) {
        system.material.forEach(m => m.dispose());
      } else {
        system.material.dispose();
      }
    }
    
    this.particleSystems.clear();
    this.activeParticles = [];
    this.particlePool = [];
    this.scene = null;
  }
  
  private createParticleSystems(): void {
    if (!this.scene) return;
    
    const effects: ParticleEffect[] = ['sparks', 'hearts', 'bubbles', 'sparkles', 'trail'];
    
    for (const effect of effects) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.maxParticles * 3);
      const colors = new Float32Array(this.maxParticles * 3);
      const sizes = new Float32Array(this.maxParticles);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true
      });
      
      const system = new THREE.Points(geometry, material);
      this.scene.add(system);
      this.particleSystems.set(effect, system);
    }
  }
  
  emit(effect: ParticleEffect, position: THREE.Vector3, count: number): void {
    this.emissionQueue.push({
      effect,
      position: position.clone(),
      count,
      timestamp: Date.now()
    });
  }
  
  update(deltaTime: number): void {
    // Process emission queue
    while (this.emissionQueue.length > 0) {
      const request = this.emissionQueue.shift();
      if (request) {
        this.createParticles(request.effect, request.position, request.count);
      }
    }
    
    // Update active particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      particle.lifetime += deltaTime;
      
      // Remove if expired
      if (particle.lifetime >= particle.maxLifetime) {
        this.particlePool.push(particle);
        this.activeParticles.splice(i, 1);
        continue;
      }
      
      // Update position based on effect type
      this.updateParticlePosition(particle, deltaTime);
    }
    
    // Update particle systems
    this.updateParticleSystems();
  }
  
  private createParticles(effect: ParticleEffect, position: THREE.Vector3, count: number): void {
    const actualCount = Math.min(count, this.maxParticles - this.activeParticles.length);
    
    for (let i = 0; i < actualCount; i++) {
      let particle: Particle;
      
      if (this.particlePool.length > 0) {
        particle = this.particlePool.pop()!;
        particle.lifetime = 0;
      } else {
        particle = {
          position: new THREE.Vector3(),
          velocity: new THREE.Vector3(),
          lifetime: 0,
          maxLifetime: 1.5,
          size: 0.2,
          color: new THREE.Color(),
          effect
        };
      }
      
      particle.effect = effect;
      particle.position.copy(position);
      
      // Set properties based on effect type
      switch (effect) {
        case 'sparks':
          this.initSparkParticle(particle, i, actualCount);
          break;
        case 'hearts':
          this.initHeartParticle(particle);
          break;
        case 'bubbles':
          this.initBubbleParticle(particle);
          break;
        case 'sparkles':
          this.initSparkleParticle(particle, i, actualCount);
          break;
        case 'trail':
          this.initTrailParticle(particle);
          break;
      }
      
      this.activeParticles.push(particle);
    }
  }
  
  private initSparkParticle(particle: Particle, index: number, total: number): void {
    // Firework burst pattern
    const angle = (index / total) * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    
    particle.velocity.set(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed + 1,
      (Math.random() - 0.5) * speed
    );
    
    particle.color.setHex(0xFFD700); // Gold
    particle.size = 0.15 + Math.random() * 0.1;
    particle.maxLifetime = 1.5;
  }
  
  private initHeartParticle(particle: Particle): void {
    // Float upward with wobble
    particle.velocity.set(
      (Math.random() - 0.5) * 0.5,
      1 + Math.random() * 0.5,
      (Math.random() - 0.5) * 0.5
    );
    
    particle.color.setHex(0xFF69B4); // Pink
    particle.size = 0.25;
    particle.maxLifetime = 2;
  }
  
  private initBubbleParticle(particle: Particle): void {
    // Rise and pop
    particle.velocity.set(
      (Math.random() - 0.5) * 0.3,
      0.8 + Math.random() * 0.4,
      (Math.random() - 0.5) * 0.3
    );
    
    particle.color.setHex(0x87CEEB); // Sky blue
    particle.size = 0.2 + Math.random() * 0.15;
    particle.maxLifetime = 1.8;
  }
  
  private initSparkleParticle(particle: Particle, index: number, total: number): void {
    // Orbit pattern
    const angle = (index / total) * Math.PI * 2;
    const radius = 0.5;
    
    particle.position.x += Math.cos(angle) * radius;
    particle.position.z += Math.sin(angle) * radius;
    
    particle.velocity.set(0, 0.2, 0);
    particle.color.setHex(0xFFFFFF); // White
    particle.size = 0.15;
    particle.maxLifetime = 1.2;
  }
  
  private initTrailParticle(particle: Particle): void {
    // Minimal movement, quick fade
    particle.velocity.set(
      (Math.random() - 0.5) * 0.1,
      -0.1,
      (Math.random() - 0.5) * 0.1
    );
    
    particle.color.setHex(0xFFB6C1); // Light pink
    particle.size = 0.1;
    particle.maxLifetime = 0.5;
  }
  
  private updateParticlePosition(particle: Particle, deltaTime: number): void {
    // Apply velocity
    particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply gravity for some effects
    if (particle.effect === 'sparks' || particle.effect === 'bubbles') {
      particle.velocity.y -= 2 * deltaTime;
    }
    
    // Orbit for sparkles
    if (particle.effect === 'sparkles') {
      const angle = particle.lifetime * 3;
      const radius = 0.5;
      particle.position.x += Math.cos(angle) * 0.01;
      particle.position.z += Math.sin(angle) * 0.01;
    }
  }
  
  private updateParticleSystems(): void {
    // Group particles by effect
    const particlesByEffect = new Map<ParticleEffect, Particle[]>();
    
    for (const particle of this.activeParticles) {
      if (!particlesByEffect.has(particle.effect)) {
        particlesByEffect.set(particle.effect, []);
      }
      particlesByEffect.get(particle.effect)!.push(particle);
    }
    
    // Update each particle system
    for (const [effect, system] of this.particleSystems) {
      const particles = particlesByEffect.get(effect) || [];
      const positions = system.geometry.attributes.position.array as Float32Array;
      const colors = system.geometry.attributes.color.array as Float32Array;
      const sizes = system.geometry.attributes.size.array as Float32Array;
      
      for (let i = 0; i < this.maxParticles; i++) {
        if (i < particles.length) {
          const particle = particles[i];
          const progress = particle.lifetime / particle.maxLifetime;
          const opacity = 1 - progress;
          
          positions[i * 3] = particle.position.x;
          positions[i * 3 + 1] = particle.position.y;
          positions[i * 3 + 2] = particle.position.z;
          
          colors[i * 3] = particle.color.r * opacity;
          colors[i * 3 + 1] = particle.color.g * opacity;
          colors[i * 3 + 2] = particle.color.b * opacity;
          
          sizes[i] = particle.size * (1 - progress * 0.5);
        } else {
          // Hide unused particles
          positions[i * 3] = 0;
          positions[i * 3 + 1] = -1000;
          positions[i * 3 + 2] = 0;
          sizes[i] = 0;
        }
      }
      
      system.geometry.attributes.position.needsUpdate = true;
      system.geometry.attributes.color.needsUpdate = true;
      system.geometry.attributes.size.needsUpdate = true;
    }
  }
  
  clear(): void {
    this.activeParticles = [];
    this.emissionQueue = [];
  }
  
  setMaxParticles(max: number): void {
    this.maxParticles = max;
  }
}
