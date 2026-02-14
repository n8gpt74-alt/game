# Visual Effects System

Comprehensive visual enhancement system for the dragon tamagotchi game.

## Features

- **Time-of-Day Cycle**: 24-minute day-night cycle with smooth color transitions
- **Weather System**: Random rain and snow effects
- **Sky Elements**: Animated clouds, sun, moon, and twinkling stars
- **Environment Animations**: Swaying trees, waving grass, flying butterflies, falling leaves
- **Particle Effects**: Sparks, hearts, bubbles, sparkles for game actions
- **Dynamic Lighting**: Time-based lighting with action-triggered lights
- **Performance Management**: Auto-adjusting quality based on FPS
- **Mobile Optimization**: Reduced effects for mobile devices

## Quick Start

```typescript
import { visualEffects } from './effects';

// In your Three.js scene setup
visualEffects.initialize(scene, camera);
visualEffects.start();

// In your animation loop
function animate() {
  const deltaTime = clock.getDelta();
  visualEffects.update(deltaTime);
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Trigger effects on actions
visualEffects.triggerActionEffect('feed', dragonPosition);
visualEffects.triggerActionEffect('levelup', dragonPosition);

// Cleanup
visualEffects.dispose();
```

## Settings

```typescript
// Get current settings
const settings = visualEffects.getSettings();

// Apply settings
visualEffects.applySettings({
  qualityLevel: 'medium',
  weatherEnabled: true,
  particlesEnabled: true,
  shadowsEnabled: false
});
```

## Quality Levels

- **Low**: 100 particles, no shadows, 100 weather particles, 2 butterflies
- **Medium**: 150 particles, shadows on, 200 weather particles, 3 butterflies
- **High**: 200 particles, shadows on, 300 weather particles, 5 butterflies

## Performance

The system automatically monitors FPS and reduces quality if performance drops below 45 FPS for 3 consecutive seconds.

## Architecture

```
VisualEffectsCoordinator (Singleton)
├── TimeManager (24-minute cycle)
├── SkyManager (clouds, sun, moon, stars)
├── WeatherSystem (rain, snow)
├── EnvironmentAnimator (trees, grass, butterflies, leaves)
├── ParticleEmitter (action effects)
├── LightingRig (dynamic lighting)
└── PerformanceManager (FPS monitoring, auto-adjust)
```

## API Reference

### VisualEffectsCoordinator

- `initialize(scene, camera)` - Initialize all systems
- `start()` - Start all animations
- `stop()` - Pause all animations
- `update(deltaTime)` - Update all systems (call in animation loop)
- `triggerActionEffect(action, position)` - Trigger particle effect
- `getSettings()` - Get current settings
- `applySettings(settings)` - Apply new settings
- `dispose()` - Cleanup all resources

### Action Types

- `'feed'` - Sparkles effect
- `'wash'` - Bubbles effect
- `'play'` - Hearts effect
- `'heal'` - Sparkles effect
- `'levelup'` - Firework sparks effect

## Mobile Support

The system automatically detects mobile devices and applies optimized settings:
- Default quality: Medium
- Reduced particle count (30% reduction)
- Shadows disabled by default
- Weather particles limited to 100

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires WebGL support

## Performance Tips

1. Use `visualEffects.currentFPS` to monitor performance
2. Disable weather on low-end devices: `applySettings({ weatherEnabled: false })`
3. Reduce quality manually if needed: `applySettings({ qualityLevel: 'low' })`
4. Settings are persisted to localStorage automatically

## Testing

Property-based tests are located in `frontend/tests/effects/` (to be created).

Run tests:
```bash
npm test
```

## License

Part of the dragon tamagotchi game project.
