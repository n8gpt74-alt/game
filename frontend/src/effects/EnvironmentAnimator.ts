import * as THREE from 'three';
import type { ButterflyObject, LeafParticle } from './types';

export class EnvironmentAnimator {
  private scene: THREE.Scene | null = null;
  private running: boolean = false;
  private trees: THREE.Group[] = [];
  private grassPatches: THREE.Group[] = [];
  private butterflies: ButterflyObject[] = [];
  private leaves: LeafParticle[] = [];
  private fallingLeavesEnabled: boolean = false;
  private time: number = 0;
  
  start(): void {
    this.running = true;
  }
  
  stop(): void {
    this.running = false;
  }
  
  update(deltaTime: number): void {
    if (!this.running) return;
    
    this.time += deltaTime;
    
    // Update tree swaying
    this.updateTreeSway();
    
    // Update grass waves
    this.updateGrassWaves();
    
    // Update butterflies
    this.updateButterflies(deltaTime);
    
    // Update falling leaves
    if (this.fallingLeavesEnabled) {
      this.updateFallingLeaves(deltaTime);
    }
  }
  
  private updateTreeSway(): void {
    const swayPeriod = 2.5; // 2-3 seconds
    const swayAmount = 0.05; // Radians
    
    for (const tree of this.trees) {
      const phase = this.time / swayPeriod;
      const sway = Math.sin(phase * Math.PI * 2) * swayAmount;
      tree.rotation.z = sway;
    }
  }
  
  private updateGrassWaves(): void {
    const wavePeriod = 1.75; // 1.5-2 seconds
    
    for (const grass of this.grassPatches) {
      const phase = this.time / wavePeriod;
      
      // Apply wave to each blade
      grass.children.forEach((blade, index) => {
        const offset = index * 0.1;
        const wave = Math.sin((phase + offset) * Math.PI * 2) * 0.02;
        blade.rotation.x = wave;
      });
    }
  }
  
  private updateButterflies(deltaTime: number): void {
    for (const butterfly of this.butterflies) {
      // Move towards target
      const direction = new THREE.Vector3()
        .subVectors(butterfly.currentTarget, butterfly.mesh.position)
        .normalize();
      
      const moveDistance = butterfly.speed * deltaTime;
      butterfly.mesh.position.add(direction.multiplyScalar(moveDistance));
      
      // Check if reached target
      const distance = butterfly.mesh.position.distanceTo(butterfly.currentTarget);
      if (distance < 0.5) {
        // Select new random target
        butterfly.currentTarget = new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          1 + Math.random() * 3,
          (Math.random() - 0.5) * 10
        );
      }
      
      // Flutter animation
      butterfly.flutterPhase += deltaTime * 10;
      const flutter = Math.sin(butterfly.flutterPhase) * 0.3;
      butterfly.mesh.rotation.y = Math.atan2(direction.x, direction.z) + flutter;
      
      // Wing flap (scale animation)
      const wingFlap = Math.abs(Math.sin(butterfly.flutterPhase * 2));
      butterfly.mesh.scale.set(1, 1, 0.8 + wingFlap * 0.4);
    }
  }
  
  private updateFallingLeaves(deltaTime: number): void {
    for (const leaf of this.leaves) {
      // Apply gravity and drift
      leaf.velocity.y += -9.8 * deltaTime * 0.1; // Gentle gravity
      leaf.position.add(leaf.velocity.clone().multiplyScalar(deltaTime));
      
      // Apply rotation
      leaf.rotation.x += leaf.rotationSpeed.x * deltaTime;
      leaf.rotation.y += leaf.rotationSpeed.y * deltaTime;
      leaf.rotation.z += leaf.rotationSpeed.z * deltaTime;
      
      leaf.mesh.position.copy(leaf.position);
      leaf.mesh.rotation.copy(leaf.rotation);
      
      // Respawn if hit ground
      if (leaf.position.y < 0) {
        leaf.position.set(
          (Math.random() - 0.5) * 15,
          8 + Math.random() * 4,
          (Math.random() - 0.5) * 15
        );
        leaf.velocity.set(
          (Math.random() - 0.5) * 0.5,
          -0.5 - Math.random() * 0.5,
          (Math.random() - 0.5) * 0.5
        );
      }
    }
  }
  
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.findEnvironmentObjects();
  }
  
  private findEnvironmentObjects(): void {
    if (!this.scene) return;
    
    // Find trees and grass in the scene
    this.scene.traverse((object) => {
      if (object.name === 'tree' || object.type === 'Group') {
        // Check if it looks like a tree (has cylinder trunk)
        const hasTree = object.children.some(child => 
          child instanceof THREE.Mesh && 
          child.geometry instanceof THREE.CylinderGeometry
        );
        if (hasTree) {
          this.trees.push(object as THREE.Group);
        }
      }
      
      if (object.name === 'grass' || object.type === 'Group') {
        // Check if it looks like grass (has plane geometries)
        const hasGrass = object.children.some(child =>
          child instanceof THREE.Mesh &&
          child.geometry instanceof THREE.PlaneGeometry
        );
        if (hasGrass) {
          this.grassPatches.push(object as THREE.Group);
        }
      }
    });
  }
  
  addButterfly(scene: THREE.Scene): void {
    if (this.butterflies.length >= 5) return;
    
    // Create simple butterfly mesh
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    
    const wingGeometry = new THREE.CircleGeometry(0.15, 16);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B9D,
      side: THREE.DoubleSide
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.1, 0, 0);
    leftWing.rotation.y = Math.PI / 4;
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.1, 0, 0);
    rightWing.rotation.y = -Math.PI / 4;
    
    const butterfly = new THREE.Group();
    butterfly.add(body);
    butterfly.add(leftWing);
    butterfly.add(rightWing);
    
    butterfly.position.set(
      (Math.random() - 0.5) * 10,
      1 + Math.random() * 3,
      (Math.random() - 0.5) * 10
    );
    
    scene.add(butterfly);
    
    this.butterflies.push({
      mesh: butterfly,
      currentTarget: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 10
      ),
      speed: 1 + Math.random() * 0.5,
      flutterPhase: Math.random() * Math.PI * 2
    });
  }
  
  setFallingLeaves(enabled: boolean): void {
    this.fallingLeavesEnabled = enabled;
    
    if (enabled && this.leaves.length === 0 && this.scene) {
      // Create falling leaves
      const leafCount = 12;
      
      for (let i = 0; i < leafCount; i++) {
        const geometry = new THREE.PlaneGeometry(0.15, 0.2);
        const colors = [0xD2691E, 0xFF8C00, 0xFFD700, 0x8B4513];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshStandardMaterial({
          color,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          8 + Math.random() * 4,
          (Math.random() - 0.5) * 15
        );
        
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        this.leaves.push({
          mesh,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            -0.5 - Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
          ),
          rotation: new THREE.Euler(0, 0, 0),
          rotationSpeed: new THREE.Euler(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ),
          position: position.clone()
        });
      }
    } else if (!enabled && this.scene) {
      // Remove leaves
      for (const leaf of this.leaves) {
        this.scene.remove(leaf.mesh);
        leaf.mesh.geometry.dispose();
        if (Array.isArray(leaf.mesh.material)) {
          leaf.mesh.material.forEach(m => m.dispose());
        } else {
          leaf.mesh.material.dispose();
        }
      }
      this.leaves = [];
    }
  }
  
  removeFromScene(): void {
    if (!this.scene) return;
    
    // Remove butterflies
    for (const butterfly of this.butterflies) {
      this.scene.remove(butterfly.mesh);
      butterfly.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    // Remove leaves
    this.setFallingLeaves(false);
    
    this.butterflies = [];
    this.trees = [];
    this.grassPatches = [];
    this.scene = null;
  }
}
