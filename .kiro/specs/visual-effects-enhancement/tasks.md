# Implementation Plan: Visual Effects Enhancement

## Overview

This implementation plan breaks down the visual effects enhancement feature into discrete coding tasks. The approach follows a modular architecture where each visual system (time, weather, particles, lighting) is implemented independently and then integrated through a central coordinator. The implementation prioritizes core functionality first, then adds polish and optimization.

## Tasks

- [x] 1. Set up visual effects infrastructure
  - Create directory structure: `frontend/src/effects/`
  - Define core TypeScript interfaces and types for all managers
  - Set up Three.js scene integration points
  - Install fast-check for property-based testing
  - _Requirements: All requirements (foundation)_

- [x] 2. Implement TimeManager system
  - [x] 2.1 Create TimeManager class with time cycle logic
    - Implement 24-minute cycle with requestAnimationFrame
    - Add period detection (morning, day, evening, night)
    - Implement color interpolation for sky transitions
    - Add event emission for time changes
    - _Requirements: 1.1, 1.2, 1.8_
  
  - [-]* 2.2 Write property test for time cycle completion
    - **Property 1: Time Cycle Completion**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.3 Write property test for smooth color transitions
    - **Property 2: Smooth Color Transitions**
    - **Validates: Requirements 1.2, 1.8**
  
  - [ ]* 2.4 Write property test for time period color ranges
    - **Property 3: Time Period Color Ranges**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
  
  - [ ]* 2.5 Write property test for light intensity correlation
    - **Property 4: Light Intensity Correlation**
    - **Validates: Requirements 1.7**

- [x] 3. Implement SkyManager system
  - [x] 3.1 Create SkyManager class with celestial bodies
    - Implement sky gradient background
    - Add sun sphere with emissive material and point light
    - Add moon sphere with emissive material
    - Implement star field with twinkling animation
    - Add cloud objects with movement animation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 3.2 Write property test for day cloud count
    - **Property 11: Day Cloud Count**
    - **Validates: Requirements 3.1**
  
  - [ ]* 3.3 Write property test for night star count
    - **Property 12: Night Star Count**
    - **Validates: Requirements 3.4**
  
  - [ ]* 3.4 Write property test for celestial body movement
    - **Property 13: Celestial Body Movement**
    - **Validates: Requirements 3.5**
  
  - [ ]* 3.5 Write property test for cloud wrapping
    - **Property 14: Cloud Wrapping**
    - **Validates: Requirements 3.6**

- [ ] 4. Checkpoint - Verify time and sky systems
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement WeatherSystem
  - [x] 5.1 Create WeatherSystem class with particle effects
    - Implement random weather event triggering (15% every 2 minutes)
    - Add rain particle system with vertical fall
    - Add snow particle system with drift
    - Implement particle pooling for performance
    - Add weather duration limits (1-3 minutes)
    - Implement particle fadeout on weather end
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ]* 5.2 Write property test for weather probability distribution
    - **Property 5: Weather Probability Distribution**
    - **Validates: Requirements 2.1**
  
  - [ ]* 5.3 Write property test for weather particle generation
    - **Property 6: Weather Particle Generation**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 5.4 Write property test for particle ground removal
    - **Property 7: Particle Ground Removal**
    - **Validates: Requirements 2.4**
  
  - [ ]* 5.5 Write property test for weather duration bounds
    - **Property 8: Weather Duration Bounds**
    - **Validates: Requirements 2.5**
  
  - [ ]* 5.6 Write property test for weather lighting reduction
    - **Property 9: Weather Lighting Reduction**
    - **Validates: Requirements 2.6**
  
  - [ ]* 5.7 Write property test for weather particle fadeout
    - **Property 10: Weather Particle Fadeout**
    - **Validates: Requirements 2.7**

- [x] 6. Implement EnvironmentAnimator system
  - [x] 6.1 Create EnvironmentAnimator class with nature animations
    - Implement tree swaying animation (2-3 second period)
    - Add grass wave animation with vertex shader
    - Create butterfly objects with flight paths
    - Implement butterfly waypoint navigation
    - Add falling leaf particles with physics
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 6.2 Write property test for tree sway period
    - **Property 15: Tree Sway Period**
    - **Validates: Requirements 4.1**
  
  - [ ]* 6.3 Write property test for grass wave period
    - **Property 16: Grass Wave Period**
    - **Validates: Requirements 4.2**
  
  - [ ]* 6.4 Write property test for butterfly count range
    - **Property 17: Butterfly Count Range**
    - **Validates: Requirements 4.3**
  
  - [ ]* 6.5 Write property test for butterfly waypoint targeting
    - **Property 18: Butterfly Waypoint Targeting**
    - **Validates: Requirements 4.4**
  
  - [ ]* 6.6 Write property test for butterfly movement smoothness
    - **Property 19: Butterfly Movement Smoothness**
    - **Validates: Requirements 4.5**
  
  - [ ]* 6.7 Write property test for autumn leaf count
    - **Property 20: Autumn Leaf Count**
    - **Validates: Requirements 4.6**
  
  - [ ]* 6.8 Write property test for leaf physics
    - **Property 21: Leaf Physics**
    - **Validates: Requirements 4.7**

- [ ] 7. Checkpoint - Verify weather and environment systems
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement ParticleEmitter system
  - [x] 8.1 Create ParticleEmitter class with action effects
    - Implement particle pooling with 200 max limit
    - Add spark particles for level up (firework pattern)
    - Add heart particles for high happiness (rising)
    - Add bubble particles for wash action (rise and pop)
    - Add sparkle particles for heal action (orbit)
    - Add trail particles for dragon movement
    - Implement particle lifetime management
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 8.2 Write property test for level up particle count
    - **Property 28: Level Up Particle Count**
    - **Validates: Requirements 6.1**
  
  - [ ]* 8.3 Write property test for happiness heart particles
    - **Property 29: Happiness Heart Particles**
    - **Validates: Requirements 6.2**
  
  - [ ]* 8.4 Write property test for wash bubble particles
    - **Property 30: Wash Bubble Particles**
    - **Validates: Requirements 6.3**
  
  - [ ]* 8.5 Write property test for heal sparkle particles
    - **Property 31: Heal Sparkle Particles**
    - **Validates: Requirements 6.4**
  
  - [ ]* 8.6 Write property test for movement trail particles
    - **Property 32: Movement Trail Particles**
    - **Validates: Requirements 6.5**
  
  - [ ]* 8.7 Write property test for particle lifetime cleanup
    - **Property 33: Particle Lifetime Cleanup**
    - **Validates: Requirements 6.6**
  
  - [ ]* 8.8 Write property test for particle count limit
    - **Property 34: Particle Count Limit**
    - **Validates: Requirements 6.7**

- [x] 9. Implement LightingRig system
  - [x] 9.1 Create LightingRig class with dynamic lighting
    - Set up directional light for sun/moon simulation
    - Add ambient light with time-based intensity
    - Implement light color changes based on time of day
    - Add light position rotation for sun/moon arc
    - Implement temporary action lights (point lights)
    - Add shadow map configuration and updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 9.2 Write property test for light color time correlation
    - **Property 35: Light Color Time Correlation**
    - **Validates: Requirements 7.1**
  
  - [ ]* 9.3 Write property test for light intensity bounds
    - **Property 36: Light Intensity Bounds**
    - **Validates: Requirements 7.2**
  
  - [ ]* 9.4 Write property test for light position movement
    - **Property 37: Light Position Movement**
    - **Validates: Requirements 7.3**
  
  - [ ]* 9.5 Write property test for action light duration
    - **Property 38: Action Light Duration**
    - **Validates: Requirements 7.4**
  
  - [ ]* 9.6 Write property test for action light color mapping
    - **Property 39: Action Light Color Mapping**
    - **Validates: Requirements 7.5**
  
  - [ ]* 9.7 Write property test for shadow map updates
    - **Property 40: Shadow Map Updates**
    - **Validates: Requirements 7.7**

- [ ] 10. Checkpoint - Verify particle and lighting systems
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement PerformanceManager system
  - [x] 11.1 Create PerformanceManager class with FPS monitoring
    - Implement FPS tracking with rolling average
    - Add quality level presets (low, medium, high)
    - Implement auto-adjustment logic (reduce quality if FPS < 45)
    - Add mobile device detection
    - Implement settings persistence to localStorage
    - Add quality change event emission
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.7_
  
  - [ ]* 11.2 Write property test for FPS monitoring interval
    - **Property 41: FPS Monitoring Interval**
    - **Validates: Requirements 8.1**
  
  - [ ]* 11.3 Write property test for quality auto-adjustment
    - **Property 42: Quality Auto-Adjustment**
    - **Validates: Requirements 8.2**
  
  - [ ]* 11.4 Write property test for quality reduction effects
    - **Property 43: Quality Reduction Effects**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [ ]* 11.5 Write property test for settings persistence round trip
    - **Property 44: Settings Persistence Round Trip**
    - **Validates: Requirements 8.7**
  
  - [ ]* 11.6 Write property test for mobile default quality
    - **Property 45: Mobile Default Quality**
    - **Validates: Requirements 9.1**
  
  - [ ]* 11.7 Write property test for mobile performance reductions
    - **Property 46: Mobile Performance Reductions**
    - **Validates: Requirements 9.2, 9.3, 9.4**
  
  - [ ]* 11.8 Write property test for device capability detection
    - **Property 49: Device Capability Detection**
    - **Validates: Requirements 9.7**

- [x] 12. Implement VisualEffectsCoordinator
  - [x] 12.1 Create VisualEffectsCoordinator class as central manager
    - Implement singleton pattern for global access
    - Add initialization method for all sub-systems
    - Create event bus for inter-system communication
    - Implement unified update loop for all systems
    - Add action effect triggering interface
    - Implement settings management and persistence
    - Wire all managers together
    - _Requirements: All requirements (integration)_
  
  - [ ]* 12.2 Write integration tests for coordinator
    - Test initialization of all systems
    - Test action effect triggering
    - Test settings application across systems
    - _Requirements: All requirements_

- [ ] 13. Checkpoint - Verify performance and coordination
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement UI enhancements
  - [x] 14.1 Add CSS transitions for UI panels
    - Implement fade in animation (300ms)
    - Implement fade out animation (200ms)
    - Add progress bar gradient animation (500ms)
    - Add low stat pulsing animation
    - Add button hover effects (scale 1.05x, 150ms)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 14.2 Write property test for UI panel fade in duration
    - **Property 22: UI Panel Fade In Duration**
    - **Validates: Requirements 5.1**
  
  - [ ]* 14.3 Write property test for UI panel fade out duration
    - **Property 23: UI Panel Fade Out Duration**
    - **Validates: Requirements 5.2**
  
  - [ ]* 14.4 Write property test for progress bar animation duration
    - **Property 24: Progress Bar Animation Duration**
    - **Validates: Requirements 5.3**
  
  - [ ]* 14.5 Write property test for low stat pulsing
    - **Property 25: Low Stat Pulsing**
    - **Validates: Requirements 5.5**
  
  - [ ]* 14.6 Write property test for button hover transform
    - **Property 26: Button Hover Transform**
    - **Validates: Requirements 5.6**
  
  - [ ]* 14.7 Write property test for hover transition duration
    - **Property 27: Hover Transition Duration**
    - **Validates: Requirements 5.7**

- [ ] 15. Implement settings UI panel
  - [ ] 15.1 Create settings panel React component
    - Add quality level selector (low, medium, high)
    - Add weather effects toggle
    - Add particle effects toggle
    - Add shadows toggle
    - Wire settings to VisualEffectsCoordinator
    - Implement immediate settings application
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ]* 15.2 Write property test for settings immediate application
    - **Property 50: Settings Immediate Application**
    - **Validates: Requirements 10.6**
  
  - [ ]* 15.3 Write property test for all settings persistence round trip
    - **Property 51: All Settings Persistence Round Trip**
    - **Validates: Requirements 10.7**
  
  - [ ]* 15.4 Write unit tests for settings UI
    - Test user interactions with controls
    - Test validation and error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 16. Implement mobile responsiveness
  - [ ] 16.1 Add mobile-specific optimizations
    - Implement touch event handling
    - Add responsive UI scaling
    - Apply mobile performance defaults
    - Test on mobile viewport sizes
    - _Requirements: 9.5, 9.6_
  
  - [ ]* 16.2 Write property test for mobile touch events
    - **Property 47: Mobile Touch Events**
    - **Validates: Requirements 9.5**
  
  - [ ]* 16.3 Write property test for mobile UI scaling
    - **Property 48: Mobile UI Scaling**
    - **Validates: Requirements 9.6**

- [ ] 17. Checkpoint - Verify UI and mobile features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Integrate visual effects with existing game
  - [x] 18.1 Wire VisualEffectsCoordinator into main App component
    - Initialize coordinator in App.tsx
    - Connect coordinator to Three.js scene
    - Add coordinator update to animation loop
    - Wire dragon actions to particle effects
    - Wire level up events to particle effects
    - Wire stat changes to UI animations
    - _Requirements: All requirements (integration)_
  
  - [ ]* 18.2 Write integration tests for game integration
    - Test coordinator initialization with game scene
    - Test action triggering from game events
    - Test stat updates triggering UI effects
    - _Requirements: All requirements_

- [x] 19. Add error handling and graceful degradation
  - [x] 19.1 Implement error handling for all systems
    - Add WebGL compatibility check
    - Implement fallback rendering for failed effects
    - Add error recovery for particle overflow
    - Add error recovery for shader compilation failures
    - Implement memory management and cleanup
    - Add user notifications for disabled effects
    - _Requirements: All requirements (error handling)_
  
  - [ ]* 19.2 Write unit tests for error handling
    - Test WebGL not available scenario
    - Test particle overflow recovery
    - Test shader compilation failure fallback
    - Test memory cleanup on component unmount
    - _Requirements: All requirements_

- [ ] 20. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Performance optimization and polish
  - [ ] 21.1 Optimize rendering performance
    - Profile particle systems and optimize hot paths
    - Implement object pooling for all particle types
    - Optimize shader performance
    - Add LOD (level of detail) for distant objects
    - Verify 60 FPS on target devices
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 21.2 Write performance tests
    - Measure FPS with different particle counts
    - Test memory usage over extended runtime
    - Verify no memory leaks after multiple cycles
    - _Requirements: 8.1, 8.2_

- [ ] 22. Final integration and testing
  - [ ]* 22.1 Run all property-based tests
    - Execute all 51 property tests with 100+ iterations each
    - Verify all properties pass
    - _Requirements: All requirements_
  
  - [ ]* 22.2 Run end-to-end tests
    - Test complete time cycle (24 minutes)
    - Test all weather events
    - Test all action effects
    - Test quality auto-adjustment
    - Test settings persistence
    - _Requirements: All requirements_
  
  - [ ] 22.3 Manual visual verification
    - Verify all visual effects render correctly
    - Check time transitions are smooth
    - Verify particle effects appear correctly
    - Test on multiple devices and browsers
    - _Requirements: All requirements_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breaks
- Property tests validate universal correctness properties (100+ iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests verify systems work together correctly
- The implementation follows a bottom-up approach: individual systems first, then integration
- Performance optimization is done after core functionality is complete
- Error handling is added after happy path is working
