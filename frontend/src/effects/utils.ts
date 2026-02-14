/**
 * Utility functions for the visual effects system
 */

import * as THREE from 'three';

/**
 * Linear interpolation between two numbers
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two colors
 */
export function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  const result = new THREE.Color();
  result.r = lerp(color1.r, color2.r, t);
  result.g = lerp(color1.g, color2.g, t);
  result.b = lerp(color1.b, color2.b, t);
  return result;
}

/**
 * Calculate distance between two colors (for testing smooth transitions)
 */
export function colorDistance(color1: THREE.Color, color2: THREE.Color): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Convert hex color string to THREE.Color
 */
export function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Random number between min and max
 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || 
         window.innerWidth < 768;
}

/**
 * Get performance tier (low, medium, high) based on device capabilities
 */
export function getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
  // Check if mobile
  if (isMobileDevice()) {
    return 'medium';
  }
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check device memory (if available)
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  
  if (memory && memory < 4) {
    return 'low';
  }
  
  if (cores >= 8 && (!memory || memory >= 8)) {
    return 'high';
  }
  
  return 'medium';
}

/**
 * Dispose Three.js object and its children
 */
export function disposeObject(object: THREE.Object3D): void {
  if (object instanceof THREE.Mesh) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  }
  
  // Recursively dispose children
  const children = [...object.children];
  children.forEach(child => {
    disposeObject(child);
    object.remove(child);
  });
}

/**
 * Create a simple event emitter
 */
export class EventEmitter<T = unknown> {
  private listeners: Array<(data: T) => void> = [];
  
  on(callback: (data: T) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  emit(data: T): void {
    this.listeners.forEach(callback => callback(data));
  }
  
  clear(): void {
    this.listeners = [];
  }
}
