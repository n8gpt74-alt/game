import * as THREE from 'three';
import type { TimePeriod, CloudObject, CelestialBody } from './types';

export class SkyManager {
  private scene: THREE.Scene | null = null;
  private clouds: CloudObject[] = [];
  private sun: CelestialBody | null = null;
  private moon: CelestialBody | null = null;
  private stars: THREE.Points | null = null;
  private skyBackground: THREE.Mesh | null = null;
  private cloudSpeed: number = 0.5;
  
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.createSkyBackground();
    this.createSun();
    this.createMoon();
    this.createStars();
    this.createClouds();
  }
  
  removeFromScene(scene: THREE.Scene): void {
    // Remove all sky elements
    if (this.skyBackground) {
      scene.remove(this.skyBackground);
      this.skyBackground.geometry.dispose();
      if (Array.isArray(this.skyBackground.material)) {
        this.skyBackground.material.forEach(m => m.dispose());
      } else {
        this.skyBackground.material.dispose();
      }
    }
    
    if (this.sun) {
      scene.remove(this.sun.mesh);
      scene.remove(this.sun.light);
      this.sun.mesh.geometry.dispose();
      if (Array.isArray(this.sun.mesh.material)) {
        this.sun.mesh.material.forEach(m => m.dispose());
      } else {
        this.sun.mesh.material.dispose();
      }
    }
    
    if (this.moon) {
      scene.remove(this.moon.mesh);
      scene.remove(this.moon.light);
      this.moon.mesh.geometry.dispose();
      if (Array.isArray(this.moon.mesh.material)) {
        this.moon.mesh.material.forEach(m => m.dispose());
      } else {
        this.moon.mesh.material.dispose();
      }
    }
    
    if (this.stars) {
      scene.remove(this.stars);
      this.stars.geometry.dispose();
      if (Array.isArray(this.stars.material)) {
        this.stars.material.forEach(m => m.dispose());
      } else {
        this.stars.material.dispose();
      }
    }
    
    for (const cloud of this.clouds) {
      scene.remove(cloud.mesh);
      cloud.mesh.geometry.dispose();
      if (Array.isArray(cloud.mesh.material)) {
        cloud.mesh.material.forEach(m => m.dispose());
      } else {
        cloud.mesh.material.dispose();
      }
    }
    
    this.clouds = [];
    this.scene = null;
  }
  
  private createSkyBackground(): void {
    if (!this.scene) return;
    
    // Create a large sphere for sky background
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    });
    
    this.skyBackground = new THREE.Mesh(geometry, material);
    this.scene.add(this.skyBackground);
  }
  
  private createSun(): void {
    if (!this.scene) return;
    
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFF5E1,
      emissive: 0xFFF5E1,
      emissiveIntensity: 1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    const light = new THREE.PointLight(0xFFF5E1, 0.5, 30);
    
    mesh.position.set(0, 10, -5);
    light.position.copy(mesh.position);
    
    this.scene.add(mesh);
    this.scene.add(light);
    
    this.sun = { mesh, light, visible: true };
  }
  
  private createMoon(): void {
    if (!this.scene) return;
    
    const geometry = new THREE.SphereGeometry(1.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xE0E0E0,
      emissive: 0xE0E0E0,
      emissiveIntensity: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    const light = new THREE.PointLight(0xE0E0E0, 0.2, 30);
    
    mesh.position.set(0, -10, -5);
    light.position.copy(mesh.position);
    mesh.visible = false;
    light.visible = false;
    
    this.scene.add(mesh);
    this.scene.add(light);
    
    this.moon = { mesh, light, visible: false };
  }
  
  private createStars(): void {
    if (!this.scene) return;
    
    const starCount = 80;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      // Random positions on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 40;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.15,
      transparent: true,
      opacity: 0
    });
    
    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }
  
  private createClouds(): void {
    if (!this.scene) return;
    
    const cloudCount = 4;
    
    for (let i = 0; i < cloudCount; i++) {
      const geometry = new THREE.PlaneGeometry(3, 1.5);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Random position
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        8 + Math.random() * 4,
        -10 - Math.random() * 5
      );
      
      mesh.rotation.x = Math.PI / 2;
      
      this.scene.add(mesh);
      
      this.clouds.push({
        mesh,
        speed: 0.3 + Math.random() * 0.4,
        position: mesh.position.clone()
      });
    }
  }
  
  update(time: number, period: TimePeriod, deltaTime: number): void {
    if (!this.scene) return;
    
    // Update sun visibility and position
    if (this.sun) {
      const isDaytime = period === 'morning' || period === 'day';
      this.sun.mesh.visible = isDaytime;
      this.sun.light.visible = isDaytime;
      
      if (isDaytime) {
        // Sun arc from 0 to 12 minutes
        const progress = time / 12;
        const angle = Math.PI * progress;
        
        this.sun.mesh.position.set(
          Math.cos(angle) * 15,
          Math.sin(angle) * 15,
          -8
        );
        this.sun.light.position.copy(this.sun.mesh.position);
      }
    }
    
    // Update moon visibility and position
    if (this.moon) {
      const isNighttime = period === 'evening' || period === 'night';
      this.moon.mesh.visible = isNighttime;
      this.moon.light.visible = isNighttime;
      
      if (isNighttime) {
        // Moon arc from 12 to 24 minutes
        const progress = (time - 12) / 12;
        const angle = Math.PI * progress;
        
        this.moon.mesh.position.set(
          Math.cos(angle) * 15,
          Math.sin(angle) * 15,
          -8
        );
        this.moon.light.position.copy(this.moon.mesh.position);
      }
    }
    
    // Update stars visibility with twinkling
    if (this.stars) {
      const isNight = period === 'night';
      const targetOpacity = isNight ? 1 : 0;
      const material = this.stars.material as THREE.PointsMaterial;
      
      // Smooth fade
      material.opacity += (targetOpacity - material.opacity) * 0.05;
      
      // Twinkling effect
      if (isNight) {
        const twinkle = Math.sin(performance.now() * 0.001) * 0.1;
        material.opacity = Math.max(0.8, Math.min(1, material.opacity + twinkle));
      }
    }
    
    // Update clouds
    const isDaytime = period === 'morning' || period === 'day';
    for (const cloud of this.clouds) {
      // Move clouds
      cloud.mesh.position.x += cloud.speed * deltaTime * this.cloudSpeed;
      
      // Wrap around
      if (cloud.mesh.position.x > 15) {
        cloud.mesh.position.x = -15;
      }
      
      // Fade clouds at night
      const material = cloud.mesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = isDaytime ? 0.7 : 0.2;
      material.opacity += (targetOpacity - material.opacity) * 0.05;
    }
  }
  
  setCloudSpeed(speed: number): void {
    this.cloudSpeed = speed;
  }
  
  updateSkyColor(color: string): void {
    if (this.skyBackground) {
      const material = this.skyBackground.material as THREE.MeshBasicMaterial;
      material.color.set(color);
    }
  }
}
