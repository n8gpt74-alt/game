# Design Document: Visual Effects Enhancement

## Overview

This design implements a comprehensive visual enhancement system for the dragon tamagotchi game, adding dynamic time-of-day cycles, weather effects, animated nature elements, particle systems, and advanced lighting. The system is built on Three.js and React, with a focus on performance optimization and mobile compatibility.

The architecture follows a modular approach with separate managers for time, weather, particles, and performance. Each system operates independently but communicates through a central event bus to coordinate visual effects.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     React UI Layer                       │
│  (Settings, Stats, Panels with CSS transitions)         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Visual Effects Coordinator                  │
│  (Event bus, state management, effect triggers)         │
└─┬──────┬──────┬──────┬──────┬──────┬──────┬───────────┘
  │      │      │      │      │      │      │
  ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐
│Time│  │Sky│  │Wea-│  │Nat-│  │Par-│  │Lig-│  │Perf│
│Mgr │  │Mgr│  │ther│  │ure │  │ticle│  │ht │  │Mgr │
└───┘  └───┘  └───┘  └───┘  └───┘  └───┘  └───┘
  │      │      │      │      │      │      │
  └──────┴──────┴──────┴──────┴──────┴──────┘
                     │
         ┌───────────┴───────────┐
         │   Three.js Scene      │
         │  (3D objects, lights) │
         └───────────────────────┘
```

### Data Flow

1. **Time Manager** updates current time → triggers sky color changes and lighting updates
2. **Weather System** randomly activates → spawns particles and adjusts lighting
3. **User Actions** (feed, play, etc.) → trigger particle effects and temporary lighting
4. **Performance Manager** monitors FPS → adjusts quality settings dynamically
5. **Settings Changes** → propagate to all managers immediately

### Technology Stack

- **Three.js r150+**: 3D rendering, particle systems, lighting
- **React 18**: UI components, state management
- **TypeScript**: Type safety for all systems
- **CSS3**: UI transitions and animations
- **Web Workers** (optional): Particle calculations for high-end devices

## Components and Interfaces

### 1. TimeManager

Manages the 24-minute day-night cycle and coordinates time-based visual changes.

```typescript
interface TimeManager {
  // Current time in minutes (0-24)
  currentTime: number;
  
  // Time period (morning, day, evening, night)
  period: TimePeriod;
  
  // Start the time cycle
  start(): void;
  
  // Pause the time cycle
  pause(): void;
  
  // Get sky colors for current time
  getSkyColors(): SkyColors;
  
  // Get light intensity for current time
  getLightIntensity(): number;
  
  // Subscribe to time changes
  onTimeChange(callback: (time: number, period: TimePeriod) => void): void;
}

type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

interface SkyColors {
  top: string;      // Sky gradient top color
  middle: string;   // Sky gradient middle color
  bottom: string;   // Sky gradient bottom color
}
```

**Implementation Details:**
- Uses `requestAnimationFrame` for smooth updates
- Time advances at rate: 24 minutes real time = 24 game hours
- Color transitions use linear interpolation (lerp) over 30 seconds
- Emits events when crossing period boundaries

### 2. SkyManager

Manages sky elements (clouds, sun, moon, stars).

```typescript
interface SkyManager {
  // Update sky based on current time
  update(time: number, period: TimePeriod): void;
  
  // Add sky elements to scene
  addToScene(scene: THREE.Scene): void;
  
  // Remove sky elements from scene
  removeFromScene(scene: THREE.Scene): void;
  
  // Set cloud animation speed
  setCloudSpeed(speed: number): void;
}

interface CloudObject {
  mesh: THREE.Mesh;
  speed: number;
  position: THREE.Vector3;
}

interface CelestialBody {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  visible: boolean;
}
```

**Implementation Details:**
- Clouds: Plane geometries with transparent textures, move along X-axis
- Sun: Sphere with emissive material + point light
- Moon: Sphere with emissive material (lower intensity)
- Stars: Points geometry with random positions, twinkling via opacity animation
- Sky background: Gradient texture updated based on time

### 3. WeatherSystem

Manages random weather events and particle effects.

```typescript
interface WeatherSystem {
  // Current weather state
  currentWeather: WeatherType | null;
  
  // Start weather system (random events)
  start(): void;
  
  // Stop weather system
  stop(): void;
  
  // Force specific weather
  setWeather(type: WeatherType, duration: number): void;
  
  // Clear current weather
  clearWeather(): void;
  
  // Update weather particles
  update(deltaTime: number): void;
}

type WeatherType = 'rain' | 'snow';

interface WeatherParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
}
```

**Implementation Details:**
- Uses Three.js Points for particle rendering
- Rain: Vertical lines, fast fall speed (5-7 units/sec)
- Snow: Small circles, slow fall speed (1-2 units/sec), slight horizontal drift
- Particle pooling to avoid garbage collection
- Weather triggers every 2 minutes with 15% probability
- Duration: random 1-3 minutes

### 4. EnvironmentAnimator

Animates natural elements (trees, grass, butterflies, leaves).

```typescript
interface EnvironmentAnimator {
  // Start all animations
  start(): void;
  
  // Stop all animations
  stop(): void;
  
  // Update animations
  update(deltaTime: number): void;
  
  // Add butterfly to scene
  addButterfly(scene: THREE.Scene): void;
  
  // Enable/disable falling leaves
  setFallingLeaves(enabled: boolean): void;
}

interface ButterflyObject {
  mesh: THREE.Group;
  currentTarget: THREE.Vector3;
  speed: number;
  flutterPhase: number;
}

interface LeafParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Euler;
}
```

**Implementation Details:**
- Tree sway: Sine wave applied to tree mesh rotation (2-3 sec period)
- Grass wave: Vertex shader with time-based offset for wave effect
- Butterflies: Bezier curve paths between random waypoints, wing flutter animation
- Leaves: Individual meshes with physics (gravity + wind drift), rotation animation
- All animations use `deltaTime` for frame-rate independence

### 5. ParticleEmitter

Manages action-triggered particle effects.

```typescript
interface ParticleEmitter {
  // Emit particles for specific effect
  emit(effect: ParticleEffect, position: THREE.Vector3, count: number): void;
  
  // Update all active particles
  update(deltaTime: number): void;
  
  // Clear all particles
  clear(): void;
  
  // Set maximum particle count
  setMaxParticles(max: number): void;
}

type ParticleEffect = 'sparks' | 'hearts' | 'bubbles' | 'sparkles' | 'trail';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: THREE.Color;
  effect: ParticleEffect;
}
```

**Implementation Details:**
- Sparks: Radial burst pattern, fade out over 1.5 seconds
- Hearts: Float upward with slight wobble, fade at 80% lifetime
- Bubbles: Float upward, scale up then pop at end
- Sparkles: Orbit around point, twinkle effect
- Trail: Follow dragon position, fade quickly (0.5 sec)
- Uses sprite textures for each particle type
- Particle pooling with max 200 active particles

### 6. LightingRig

Manages dynamic lighting based on time and actions.

```typescript
interface LightingRig {
  // Update lighting for current time
  updateTimeOfDay(time: number, period: TimePeriod): void;
  
  // Add temporary action light
  addActionLight(position: THREE.Vector3, color: THREE.Color, duration: number): void;
  
  // Enable/disable shadows
  setShadowsEnabled(enabled: boolean): void;
  
  // Get main directional light
  getDirectionalLight(): THREE.DirectionalLight;
  
  // Get ambient light
  getAmbientLight(): THREE.AmbientLight;
}

interface ActionLight {
  light: THREE.PointLight;
  startTime: number;
  duration: number;
}
```

**Implementation Details:**
- Directional light: Simulates sun/moon, rotates across sky arc
- Ambient light: Provides base illumination, intensity varies by time
- Action lights: Temporary point lights at dragon position
- Shadow map: 2048x2048 resolution, updated when light moves
- Light colors: Warm (morning), white (day), orange (evening), blue (night)

### 7. PerformanceManager

Monitors FPS and adjusts quality settings dynamically.

```typescript
interface PerformanceManager {
  // Current quality level
  qualityLevel: QualityLevel;
  
  // Start monitoring
  start(): void;
  
  // Stop monitoring
  stop(): void;
  
  // Get current FPS
  getCurrentFPS(): number;
  
  // Set quality level manually
  setQualityLevel(level: QualityLevel): void;
  
  // Get quality settings
  getQualitySettings(): QualitySettings;
  
  // Subscribe to quality changes
  onQualityChange(callback: (level: QualityLevel) => void): void;
}

type QualityLevel = 'low' | 'medium' | 'high';

interface QualitySettings {
  particleCount: number;
  shadowsEnabled: boolean;
  weatherParticleCount: number;
  antialiasing: boolean;
  maxButterflies: number;
}
```

**Implementation Details:**
- FPS tracking: Rolling average over 60 frames
- Auto-adjust: Reduce quality if FPS < 45 for 3 seconds
- Quality presets:
  - Low: 50% particles, no shadows, 100 weather particles, no AA
  - Medium: 75% particles, shadows on, 200 weather particles, no AA
  - High: 100% particles, shadows on, 300 weather particles, AA on
- Settings persisted to localStorage
- Mobile detection: Defaults to medium on mobile devices

### 8. VisualEffectsCoordinator

Central coordinator that manages all visual systems.

```typescript
interface VisualEffectsCoordinator {
  // Initialize all systems
  initialize(scene: THREE.Scene, camera: THREE.Camera): void;
  
  // Start all systems
  start(): void;
  
  // Stop all systems
  stop(): void;
  
  // Update all systems (call in animation loop)
  update(deltaTime: number): void;
  
  // Trigger action effect
  triggerActionEffect(action: ActionType, position: THREE.Vector3): void;
  
  // Get settings interface
  getSettings(): EffectSettings;
  
  // Apply settings
  applySettings(settings: Partial<EffectSettings>): void;
}

interface EffectSettings {
  qualityLevel: QualityLevel;
  weatherEnabled: boolean;
  particlesEnabled: boolean;
  shadowsEnabled: boolean;
  timeSpeed: number;
}

type ActionType = 'feed' | 'wash' | 'play' | 'heal' | 'levelup';
```

**Implementation Details:**
- Singleton pattern for global access
- Event bus for inter-system communication
- Manages lifecycle of all sub-systems
- Handles settings persistence and restoration
- Provides unified API for triggering effects

## Data Models

### Time State

```typescript
interface TimeState {
  currentMinute: number;      // 0-24
  period: TimePeriod;         // morning, day, evening, night
  skyColors: SkyColors;
  lightIntensity: number;     // 0-1
  sunPosition: THREE.Vector3;
  moonPosition: THREE.Vector3;
}
```

### Weather State

```typescript
interface WeatherState {
  active: boolean;
  type: WeatherType | null;
  startTime: number;
  duration: number;
  particles: WeatherParticle[];
  particleCount: number;
}
```

### Particle State

```typescript
interface ParticleState {
  activeParticles: Particle[];
  particlePool: Particle[];
  maxParticles: number;
  emissionQueue: EmissionRequest[];
}

interface EmissionRequest {
  effect: ParticleEffect;
  position: THREE.Vector3;
  count: number;
  timestamp: number;
}
```

### Performance State

```typescript
interface PerformanceState {
  currentFPS: number;
  frameHistory: number[];     // Last 60 frame times
  qualityLevel: QualityLevel;
  autoAdjustEnabled: boolean;
  lowFPSCount: number;        // Consecutive seconds below threshold
}
```

### Settings State

```typescript
interface SettingsState {
  qualityLevel: QualityLevel;
  weatherEnabled: boolean;
  particlesEnabled: boolean;
  shadowsEnabled: boolean;
  timeSpeed: number;          // Multiplier for time cycle speed
  isMobile: boolean;
}
```


## Error Handling

### Error Categories

1. **Initialization Errors**
   - WebGL not supported
   - Three.js scene creation failure
   - Shader compilation errors

2. **Runtime Errors**
   - Particle system overflow
   - Memory allocation failures
   - Animation loop crashes

3. **Performance Errors**
   - Sustained low FPS
   - Memory leaks
   - GPU overload

### Error Handling Strategies

**WebGL Compatibility:**
```typescript
function initializeScene(): Result<THREE.Scene, InitError> {
  if (!isWebGLAvailable()) {
    return Err({ type: 'NO_WEBGL', message: 'WebGL not supported' });
  }
  
  try {
    const scene = new THREE.Scene();
    return Ok(scene);
  } catch (error) {
    return Err({ type: 'SCENE_INIT_FAILED', message: error.message });
  }
}
```

**Graceful Degradation:**
- If shadows fail: Disable shadows, continue without them
- If particles overflow: Stop new emissions, clear oldest particles
- If weather system fails: Disable weather, log error
- If FPS drops critically: Auto-reduce to lowest quality

**Error Recovery:**
```typescript
class VisualEffectsCoordinator {
  private handleSystemError(system: string, error: Error): void {
    console.error(`[${system}] Error:`, error);
    
    // Attempt recovery based on system
    switch (system) {
      case 'particles':
        this.particleEmitter.clear();
        this.particleEmitter.setMaxParticles(100);
        break;
      case 'weather':
        this.weatherSystem.stop();
        this.settings.weatherEnabled = false;
        break;
      case 'lighting':
        this.lightingRig.setShadowsEnabled(false);
        break;
    }
    
    // Notify user
    this.notifyUser(`Visual effect temporarily disabled: ${system}`);
  }
}
```

**Memory Management:**
- Dispose Three.js objects properly (geometries, materials, textures)
- Clear particle pools when switching quality levels
- Remove event listeners on component unmount
- Use WeakMap for object references where possible

**Fallback Rendering:**
If advanced effects fail, fall back to basic rendering:
- Static sky color (no gradient)
- No particles
- Single ambient light
- No shadows
- No animations

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time Cycle Completion

*For any* starting time in the cycle, advancing by 24 minutes of real time should return the time system to the same period and similar sky colors (accounting for smooth transitions).

**Validates: Requirements 1.1**

### Property 2: Smooth Color Transitions

*For any* two consecutive time samples taken within a transition period (30 seconds), the color difference should be small and proportional to the time elapsed, ensuring no sudden jumps in sky color.

**Validates: Requirements 1.2, 1.8**

### Property 3: Time Period Color Ranges

*For any* time value within a specific period (morning, day, evening, night), the sky colors should fall within the expected color palette for that period (warm tones for morning, bright for day, sunset for evening, dark for night).

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

### Property 4: Light Intensity Correlation

*For any* time of day, the lighting intensity should correlate with the time period, with day having highest intensity, night having lowest, and morning/evening having intermediate values.

**Validates: Requirements 1.7**

### Property 5: Weather Probability Distribution

*For any* sufficiently large number of 2-minute intervals (e.g., 100+ trials), the frequency of weather events should approach 15% with reasonable variance.

**Validates: Requirements 2.1**

### Property 6: Weather Particle Generation

*For any* active weather type (rain or snow), the particle count should be within the specified range (150-300 for rain, 150-200 for snow) and particles should have downward velocity.

**Validates: Requirements 2.2, 2.3**

### Property 7: Particle Ground Removal

*For any* weather particle, if its Y position drops below ground level (Y < 0), it should be removed from the active particle list within one frame.

**Validates: Requirements 2.4**

### Property 8: Weather Duration Bounds

*For any* weather event, the duration from start to end should be between 1 and 3 minutes, with no weather lasting longer than the maximum.

**Validates: Requirements 2.5**

### Property 9: Weather Lighting Reduction

*For any* weather state transition from clear to active weather, the ambient light intensity should decrease by exactly 20%, and restore to original value when weather ends.

**Validates: Requirements 2.6**

### Property 10: Weather Particle Fadeout

*For any* weather end event, all weather particles should have their opacity decrease to zero over 2 seconds, with smooth interpolation.

**Validates: Requirements 2.7**

### Property 11: Day Cloud Count

*For any* time during the day period (6-12 minutes), the number of cloud objects in the scene should be between 3 and 5.

**Validates: Requirements 3.1**

### Property 12: Night Star Count

*For any* time during the night period (18-24 minutes), the number of visible star points should be between 50 and 80.

**Validates: Requirements 3.4**

### Property 13: Celestial Body Movement

*For any* two time samples during a celestial body's active period (sun during day, moon during night), the position should change in a consistent arc direction, simulating sky movement.

**Validates: Requirements 3.5**

### Property 14: Cloud Wrapping

*For any* cloud that moves beyond the scene boundary (X > boundary), it should reappear on the opposite side (X = -boundary) within one frame, maintaining Y and Z coordinates.

**Validates: Requirements 3.6**

### Property 15: Tree Sway Period

*For any* tree mesh, the rotation oscillation should complete one full cycle in 2-3 seconds, measured by tracking rotation angle over time.

**Validates: Requirements 4.1**

### Property 16: Grass Wave Period

*For any* grass patch, the wave animation should complete one full cycle in 1.5-2 seconds, measured by vertex displacement.

**Validates: Requirements 4.2**

### Property 17: Butterfly Count Range

*For any* scene state, the number of active butterfly objects should be between 3 and 5.

**Validates: Requirements 4.3**

### Property 18: Butterfly Waypoint Targeting

*For any* butterfly that reaches its current target waypoint (distance < threshold), it should have a new valid target position assigned within one frame.

**Validates: Requirements 4.4**

### Property 19: Butterfly Movement Smoothness

*For any* two consecutive frames, a butterfly's position change should be smooth (distance < max_speed * deltaTime) with no teleportation.

**Validates: Requirements 4.5**

### Property 20: Autumn Leaf Count

*For any* scene with autumn season enabled, the number of falling leaf particles should be between 10 and 15.

**Validates: Requirements 4.6**

### Property 21: Leaf Physics

*For any* falling leaf particle, it should have both non-zero rotation velocity and horizontal drift velocity, simulating realistic leaf fall.

**Validates: Requirements 4.7**

### Property 22: UI Panel Fade In Duration

*For any* UI panel opening animation, the opacity should transition from 0 to 1 over exactly 300ms with smooth easing.

**Validates: Requirements 5.1**

### Property 23: UI Panel Fade Out Duration

*For any* UI panel closing animation, the opacity should transition from 1 to 0 over exactly 200ms with smooth easing.

**Validates: Requirements 5.2**

### Property 24: Progress Bar Animation Duration

*For any* progress bar value change, the visual fill should animate from old value to new value over 500ms with smooth easing.

**Validates: Requirements 5.3**

### Property 25: Low Stat Pulsing

*For any* stat value below 30%, the corresponding UI chip should have a pulsing animation applied (opacity or scale oscillation).

**Validates: Requirements 5.5**

### Property 26: Button Hover Transform

*For any* button receiving hover state, the scale transform should be exactly 1.05x and shadow should increase.

**Validates: Requirements 5.6**

### Property 27: Hover Transition Duration

*For any* hover effect transition, the duration should be exactly 150ms.

**Validates: Requirements 5.7**

### Property 28: Level Up Particle Count

*For any* level up event, the particle emitter should spawn between 30 and 50 spark particles in a radial burst pattern.

**Validates: Requirements 6.1**

### Property 29: Happiness Heart Particles

*For any* dragon state with happiness > 80%, the particle emitter should spawn between 5 and 8 heart particles that rise upward.

**Validates: Requirements 6.2**

### Property 30: Wash Bubble Particles

*For any* wash action performed, the particle emitter should spawn between 20 and 30 bubble particles that rise and pop.

**Validates: Requirements 6.3**

### Property 31: Heal Sparkle Particles

*For any* heal action performed, the particle emitter should spawn between 15 and 20 sparkle particles that rotate around the dragon.

**Validates: Requirements 6.4**

### Property 32: Movement Trail Particles

*For any* dragon movement, the particle emitter should spawn trail particles behind the dragon's current position.

**Validates: Requirements 6.5**

### Property 33: Particle Lifetime Cleanup

*For any* particle, if its lifetime exceeds its maximum lifetime (1-2 seconds), it should be removed from the active particle list within one frame.

**Validates: Requirements 6.6**

### Property 34: Particle Count Limit

*For any* sequence of particle emissions, the total number of active particles should never exceed 200, with oldest particles removed first if limit is reached.

**Validates: Requirements 6.7**

### Property 35: Light Color Time Correlation

*For any* time of day, the directional light color should match the expected color for that period (warm for morning, white for day, orange for evening, blue for night).

**Validates: Requirements 7.1**

### Property 36: Light Intensity Bounds

*For any* time of day, the directional light intensity should be within the bounds: 0.3 during night and 0.8 during day, with smooth transitions between.

**Validates: Requirements 7.2**

### Property 37: Light Position Movement

*For any* two time samples, the directional light position should change to simulate sun/moon arc movement across the sky.

**Validates: Requirements 7.3**

### Property 38: Action Light Duration

*For any* dragon action, a temporary point light should be created at the dragon's position and removed after exactly 1 second.

**Validates: Requirements 7.4**

### Property 39: Action Light Color Mapping

*For any* action type (feed, wash, play, heal), the temporary point light should have the correct color: green for heal, blue for wash, yellow for feed, pink for play.

**Validates: Requirements 7.5**

### Property 40: Shadow Map Updates

*For any* directional light position change, the shadow map should be updated to reflect the new light direction.

**Validates: Requirements 7.7**

### Property 41: FPS Monitoring Interval

*For any* performance monitoring session, FPS measurements should be taken at 1-second intervals.

**Validates: Requirements 8.1**

### Property 42: Quality Auto-Adjustment

*For any* performance state where average FPS remains below 45 for 3 consecutive seconds, the quality level should be reduced by one step.

**Validates: Requirements 8.2**

### Property 43: Quality Reduction Effects

*For any* quality level reduction, all of the following should occur: particle count reduced by 50%, shadows disabled, and weather particle count reduced by 50%.

**Validates: Requirements 8.3, 8.4, 8.5**

### Property 44: Settings Persistence Round Trip

*For any* quality setting value, saving to localStorage and then loading should produce the same quality level value.

**Validates: Requirements 8.7**

### Property 45: Mobile Default Quality

*For any* device detected as mobile (screen width < 768px), the default quality level should be set to medium.

**Validates: Requirements 9.1**

### Property 46: Mobile Performance Reductions

*For any* mobile device, all of the following should be applied: particle count reduced by 30%, shadows disabled by default, and weather particles limited to 100 maximum.

**Validates: Requirements 9.2, 9.3, 9.4**

### Property 47: Mobile Touch Events

*For any* mobile device, touch events should be registered and handled for all interactive elements.

**Validates: Requirements 9.5**

### Property 48: Mobile UI Scaling

*For any* mobile viewport, UI elements should scale appropriately to fit the screen without horizontal scrolling.

**Validates: Requirements 9.6**

### Property 49: Device Capability Detection

*For any* device, the performance manager should detect capabilities (mobile vs desktop, GPU tier) and apply appropriate quality settings automatically.

**Validates: Requirements 9.7**

### Property 50: Settings Immediate Application

*For any* settings change made through the UI, the change should take effect immediately in the scene without requiring a page reload.

**Validates: Requirements 10.6**

### Property 51: All Settings Persistence Round Trip

*For any* complete settings state (quality, weather enabled, particles enabled, shadows enabled), saving to localStorage and then loading should produce an equivalent settings state.

**Validates: Requirements 10.7**

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized data

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Unit Testing

**Test Framework:** Vitest + @testing-library/react

**Unit Test Focus Areas:**
- Specific examples demonstrating correct behavior
- Integration points between visual systems
- Edge cases (e.g., time wrapping at 24 minutes, particle pool exhaustion)
- Error conditions (e.g., WebGL not available, shader compilation failure)

**Component Tests:**
- TimeManager: Period boundary transitions, color interpolation edge cases
- WeatherSystem: Weather start/stop, particle cleanup
- ParticleEmitter: Pool exhaustion, emission queue overflow
- PerformanceManager: Quality level transitions, localStorage errors
- Settings UI: User interactions, validation

**Example Unit Test:**
```typescript
describe('TimeManager', () => {
  it('should wrap time from 24 back to 0', () => {
    const timeManager = new TimeManager();
    timeManager.setTime(23.9);
    timeManager.advance(0.2); // Should wrap to 0.1
    
    expect(timeManager.currentTime).toBeCloseTo(0.1);
    expect(timeManager.period).toBe('morning');
  });
  
  it('should handle rapid time changes without crashing', () => {
    const timeManager = new TimeManager();
    
    // Rapidly change time 100 times
    for (let i = 0; i < 100; i++) {
      timeManager.setTime(Math.random() * 24);
    }
    
    // Should still be in valid state
    expect(timeManager.currentTime).toBeGreaterThanOrEqual(0);
    expect(timeManager.currentTime).toBeLessThan(24);
  });
});
```

### Property-Based Testing

**Test Framework:** fast-check (TypeScript property testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property number
- Tag format: `Feature: visual-effects-enhancement, Property {N}: {property title}`

**Property Test Implementation:**

Each correctness property from the design document must be implemented as a property-based test. The test should:
1. Generate random valid inputs using fast-check generators
2. Execute the system behavior
3. Assert the property holds for all generated inputs
4. Reference the property number in a comment

**Example Property Tests:**

```typescript
import fc from 'fast-check';

describe('Property-Based Tests: Time System', () => {
  // Feature: visual-effects-enhancement, Property 1: Time Cycle Completion
  it('time cycle returns to same state after 24 minutes', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 24 }), (startTime) => {
        const timeManager = new TimeManager();
        timeManager.setTime(startTime);
        
        const startPeriod = timeManager.period;
        const startColors = timeManager.getSkyColors();
        
        // Advance by full cycle
        timeManager.advance(24);
        
        const endPeriod = timeManager.period;
        const endColors = timeManager.getSkyColors();
        
        // Should return to same period
        expect(endPeriod).toBe(startPeriod);
        
        // Colors should be similar (within transition tolerance)
        expect(colorDistance(startColors, endColors)).toBeLessThan(0.1);
      }),
      { numRuns: 100 }
    );
  });
  
  // Feature: visual-effects-enhancement, Property 2: Smooth Color Transitions
  it('color transitions are smooth with no sudden jumps', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 24 }),
        fc.float({ min: 0.01, max: 0.5 }),
        (startTime, deltaTime) => {
          const timeManager = new TimeManager();
          timeManager.setTime(startTime);
          
          const colors1 = timeManager.getSkyColors();
          timeManager.advance(deltaTime);
          const colors2 = timeManager.getSkyColors();
          
          // Color change should be proportional to time elapsed
          const colorChange = colorDistance(colors1, colors2);
          const maxExpectedChange = deltaTime / 30; // 30 sec transition
          
          expect(colorChange).toBeLessThan(maxExpectedChange * 1.5); // 1.5x tolerance
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based Tests: Particle System', () => {
  // Feature: visual-effects-enhancement, Property 34: Particle Count Limit
  it('particle count never exceeds maximum', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            effect: fc.constantFrom('sparks', 'hearts', 'bubbles', 'sparkles', 'trail'),
            count: fc.integer({ min: 1, max: 100 }),
            position: fc.record({
              x: fc.float({ min: -10, max: 10 }),
              y: fc.float({ min: 0, max: 10 }),
              z: fc.float({ min: -10, max: 10 })
            })
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (emissions) => {
          const emitter = new ParticleEmitter();
          emitter.setMaxParticles(200);
          
          // Emit all particles
          for (const emission of emissions) {
            const pos = new THREE.Vector3(
              emission.position.x,
              emission.position.y,
              emission.position.z
            );
            emitter.emit(emission.effect, pos, emission.count);
          }
          
          // Active count should never exceed max
          expect(emitter.getActiveCount()).toBeLessThanOrEqual(200);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: visual-effects-enhancement, Property 33: Particle Lifetime Cleanup
  it('particles are removed after lifetime expires', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }),
        fc.float({ min: 1.0, max: 2.0 }),
        (particleCount, lifetime) => {
          const emitter = new ParticleEmitter();
          emitter.emit('sparks', new THREE.Vector3(), particleCount);
          
          const initialCount = emitter.getActiveCount();
          expect(initialCount).toBe(particleCount);
          
          // Advance time beyond lifetime
          emitter.update(lifetime + 0.1);
          
          // All particles should be removed
          expect(emitter.getActiveCount()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based Tests: Settings Persistence', () => {
  // Feature: visual-effects-enhancement, Property 44: Settings Persistence Round Trip
  it('quality settings round trip through localStorage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('low', 'medium', 'high'),
        (qualityLevel) => {
          const perfManager = new PerformanceManager();
          
          // Save setting
          perfManager.setQualityLevel(qualityLevel);
          perfManager.saveSettings();
          
          // Create new instance and load
          const perfManager2 = new PerformanceManager();
          perfManager2.loadSettings();
          
          // Should match original
          expect(perfManager2.qualityLevel).toBe(qualityLevel);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: visual-effects-enhancement, Property 51: All Settings Persistence Round Trip
  it('all settings round trip through localStorage', () => {
    fc.assert(
      fc.property(
        fc.record({
          quality: fc.constantFrom('low', 'medium', 'high'),
          weatherEnabled: fc.boolean(),
          particlesEnabled: fc.boolean(),
          shadowsEnabled: fc.boolean()
        }),
        (settings) => {
          const coordinator = new VisualEffectsCoordinator();
          
          // Apply settings
          coordinator.applySettings(settings);
          coordinator.saveSettings();
          
          // Create new instance and load
          const coordinator2 = new VisualEffectsCoordinator();
          coordinator2.loadSettings();
          
          const loadedSettings = coordinator2.getSettings();
          
          // All settings should match
          expect(loadedSettings.qualityLevel).toBe(settings.quality);
          expect(loadedSettings.weatherEnabled).toBe(settings.weatherEnabled);
          expect(loadedSettings.particlesEnabled).toBe(settings.particlesEnabled);
          expect(loadedSettings.shadowsEnabled).toBe(settings.shadowsEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Three.js Scene Tests:**
- Verify all managers can add/remove objects from scene without errors
- Test coordinator initialization with real Three.js scene
- Verify lighting updates affect rendered output
- Test particle systems with real geometries and materials

**Performance Tests:**
- Measure FPS with different particle counts (50, 100, 200)
- Verify quality auto-adjustment triggers correctly under load
- Test memory usage over extended runtime (30+ minutes)
- Verify no memory leaks after multiple effect cycles

### End-to-End Testing

**Playwright Tests:**
- Load game in browser and verify visual effects render
- Trigger all dragon actions and verify correct particle effects appear
- Change settings through UI and verify effects update immediately
- Test on different viewport sizes (mobile, tablet, desktop)
- Verify performance on simulated slow devices

**Test Scenarios:**
1. Complete time cycle: Start game, accelerate time, verify full 24-minute cycle
2. Weather event: Force weather trigger, verify particles appear and disappear correctly
3. Action effects: Perform all actions (feed, wash, play, heal), verify correct particles
4. Quality adjustment: Simulate low FPS, verify quality reduces automatically
5. Settings persistence: Change all settings, reload page, verify settings restored

### Visual Regression Testing

**Manual Testing Checklist:**
- [ ] Time cycle completes in 24 minutes with smooth transitions
- [ ] Sky colors match expected palettes for each period
- [ ] Weather particles render correctly (rain falls, snow drifts)
- [ ] Butterflies follow smooth curved paths
- [ ] Trees and grass animate with correct periods
- [ ] All particle effects appear on corresponding actions
- [ ] Lighting changes are visible and smooth
- [ ] Shadows render correctly and update with light position
- [ ] UI transitions are smooth (300ms fade in, 200ms fade out)
- [ ] Settings persist across browser sessions
- [ ] Mobile layout works without horizontal scroll
- [ ] Performance stays above 45 FPS on target devices

**Screenshot Comparison:**
- Capture screenshots at each time period (morning, day, evening, night)
- Capture screenshots of each weather type (rain, snow)
- Capture screenshots of each particle effect
- Compare before/after for visual consistency during updates

