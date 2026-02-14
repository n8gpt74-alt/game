# Implementation Plan: Dragon Growth System

## Overview

This implementation plan breaks down the Dragon Growth System into incremental, testable steps. The system consists of four interconnected subsystems (Character, Evolution, Mood, Life Events) that work together to create a living, evolving dragon companion. Each task builds on previous work and includes property-based tests to ensure correctness.

## Tasks

- [x] 1. Database schema migration for growth system
  - Add character parameter fields to PetState model
  - Add mood fields to PetState model
  - Add age fields to PetState model
  - Add event history JSON field to PetState model
  - Create and run Alembic migration
  - _Requirements: 1.1, 5.1, 8.1, 9.16_

- [ ] 2. Implement Character System backend
  - [ ] 2.1 Create character_system.py module
    - Implement initialize_character() function
    - Implement update_character_from_action() function
    - Implement get_character_modifiers() function
    - Implement get_character_stats() function
    - Define CharacterStats and CharacterModifiers dataclasses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1-2.7_
  
  - [ ]* 2.2 Write property test for character parameter bounds
    - **Property 1: Character Parameter Bounds**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.3 Write property test for character modifiers consistency
    - **Property 3: Character Modifiers Consistency**
    - **Validates: Requirements 2.1-2.7**
  
  - [ ]* 2.4 Write property test for character modifiers reactivity
    - **Property 4: Character Modifiers Reactivity**
    - **Validates: Requirements 2.8**
  
  - [ ]* 2.5 Write unit tests for character system
    - Test initialization to 50
    - Test specific action mappings (feed → friendliness +2, etc.)
    - Test parameter clamping at 0 and 100
    - _Requirements: 1.2, 1.5-1.9_

- [ ] 3. Implement Evolution System backend
  - [ ] 3.1 Create evolution_system.py module
    - Define STAGES dictionary with all seven stages
    - Implement check_evolution() function
    - Implement get_stage_info() function
    - Implement get_next_stage_requirements() function
    - Define StageInfo, EvolutionResult, StageRequirements dataclasses
    - _Requirements: 3.1, 3.3-3.9, 4.1-4.7_
  
  - [ ]* 3.2 Write property test for evolution stage thresholds
    - **Property 5: Evolution Stage Thresholds**
    - **Validates: Requirements 3.3-3.9**
  
  - [ ]* 3.3 Write property test for evolution notifications
    - **Property 7: Evolution Notifications**
    - **Validates: Requirements 3.11**
  
  - [ ]* 3.4 Write property test for evolution ability unlocks
    - **Property 8: Evolution Ability Unlocks**
    - **Validates: Requirements 3.12**
  
  - [ ]* 3.5 Write unit tests for evolution system
    - Test each stage transition at exact thresholds
    - Test scale values for each stage
    - Test egg hatching after 1 hour
    - _Requirements: 3.2, 3.3-3.9, 4.1-4.7_

- [ ] 4. Implement Mood System backend
  - [ ] 4.1 Create mood_system.py module
    - Implement calculate_mood() function with priority logic
    - Implement get_mood_modifiers() function
    - Implement get_mood_visual_data() function
    - Implement should_update_mood() function
    - Define MoodState, MoodModifiers, MoodVisuals dataclasses
    - _Requirements: 5.1, 5.2-5.8, 6.1-6.9_
  
  - [ ]* 4.2 Write property test for mood calculation priority
    - **Property 9: Mood Calculation Priority**
    - **Validates: Requirements 5.2-5.8**
  
  - [ ]* 4.3 Write property test for mood modifiers consistency
    - **Property 11: Mood Modifiers Consistency**
    - **Validates: Requirements 6.1-6.9**
  
  - [ ]* 4.4 Write property test for mood modifiers reactivity
    - **Property 12: Mood Modifiers Reactivity**
    - **Validates: Requirements 6.10**
  
  - [ ]* 4.5 Write unit tests for mood system
    - Test each mood calculation rule
    - Test mood priority order with edge cases
    - Test modifier values for each mood
    - _Requirements: 5.2-5.8, 6.1-6.9_

- [ ] 5. Checkpoint - Ensure all core systems pass tests
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 6. Implement Life Events System backend
  - [ ] 6.1 Create life_events_system.py module
    - Define POSITIVE_EVENTS, NEGATIVE_EVENTS, NEUTRAL_EVENTS lists
    - Implement check_for_events() function
    - Implement apply_event_effects() function
    - Implement get_event_history() function
    - Implement should_check_events() function
    - Define LifeEvent, EventResult, EventProbabilities dataclasses
    - _Requirements: 9.1-9.16, 10.2-10.7_
  
  - [ ]* 6.2 Write property test for birthday event triggering
    - **Property 15: Birthday Event Triggering**
    - **Validates: Requirements 9.5**
  
  - [ ]* 6.3 Write property test for event effects application
    - **Property 16: Event Effects Application**
    - **Validates: Requirements 9.6-9.16**
  
  - [ ]* 6.4 Write property test for event history logging
    - **Property 17: Event History Logging**
    - **Validates: Requirements 10.2, 10.3**
  
  - [ ]* 6.5 Write property test for event history size limit
    - **Property 19: Event History Size Limit**
    - **Validates: Requirements 10.6**
  
  - [ ]* 6.6 Write property test for event history ordering
    - **Property 20: Event History Ordering**
    - **Validates: Requirements 10.7**
  
  - [ ]* 6.7 Write unit tests for life events system
    - Test each event type triggers correctly
    - Test event probability distributions
    - Test event effects on stats
    - Test history limiting to 50 events
    - _Requirements: 9.2-9.16, 10.6_

- [ ] 7. Implement Age System backend
  - [ ] 7.1 Add age calculation functions to life_events_system.py
    - Implement calculate_age_days() function
    - Implement update_age() function
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 7.2 Write property test for age calculation
    - **Property 13: Age Calculation**
    - **Validates: Requirements 8.2**
  
  - [ ]* 7.3 Write unit tests for age system
    - Test age calculation with various birth dates
    - Test age = 0 on creation
    - Test age increments correctly
    - _Requirements: 8.1, 8.2_

- [ ] 8. Integrate growth systems into game service
  - [ ] 8.1 Update ensure_pet_state() to initialize growth fields
    - Initialize character parameters to 50
    - Initialize mood to "normal"
    - Set birth_date to current time
    - Initialize empty event_history
    - _Requirements: 1.2, 5.8, 8.1, 9.16_
  
  - [ ] 8.2 Update execute_action() to update character and mood
    - Call update_character_from_action() after action
    - Apply character modifiers to XP calculation
    - Recalculate mood after stat changes
    - Apply mood modifiers to XP calculation
    - Check for evolution after XP gain
    - Check for events (if hour passed)
    - _Requirements: 1.4, 2.1-2.8, 5.9, 6.1-6.10, 9.1_
  
  - [ ] 8.3 Update execute_minigame() to apply character and mood modifiers
    - Apply courage modifier to XP if courage > 70
    - Apply mood modifier to XP
    - Update character energy parameter
    - Recalculate mood after stat changes
    - _Requirements: 2.1, 6.1_
  
  - [ ] 8.4 Update run_decay() to check for events and update age
    - Check if hour passed since last event check
    - Call check_for_events() if needed
    - Apply event effects
    - Update age_days
    - Check for evolution
    - _Requirements: 8.3, 9.1_

- [ ] 9. Implement persistence for growth systems
  - [ ] 9.1 Update serialize_pet_state() to include growth data
    - Add character stats and modifiers
    - Add mood state and modifiers
    - Add age info
    - Add recent events (last 5)
    - _Requirements: 1.11, 5.11, 8.7_
  
  - [ ]* 9.2 Write property test for character persistence round-trip
    - **Property 2: Character Persistence Round-Trip**
    - **Validates: Requirements 1.10, 11.5**
  
  - [ ]* 9.3 Write property test for evolution persistence round-trip
    - **Property 6: Evolution Persistence Round-Trip**
    - **Validates: Requirements 3.13, 11.6**
  
  - [ ]* 9.4 Write property test for mood persistence round-trip
    - **Property 10: Mood Persistence Round-Trip**
    - **Validates: Requirements 5.10, 11.7**
  
  - [ ]* 9.5 Write property test for age persistence round-trip
    - **Property 14: Age Persistence Round-Trip**
    - **Validates: Requirements 8.6, 11.8**
  
  - [ ]* 9.6 Write property test for event history persistence round-trip
    - **Property 18: Event History Persistence Round-Trip**
    - **Validates: Requirements 10.4**
  
  - [ ]* 9.7 Write property test for data validation on load
    - **Property 21: Data Validation on Load**
    - **Validates: Requirements 11.9, 11.10**

- [ ] 10. Checkpoint - Ensure backend integration passes tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement API endpoints for growth systems
  - [ ] 11.1 Add GET /pet/character endpoint
    - Return CharacterStats and CharacterModifiers
    - _Requirements: 1.11, 12.1_
  
  - [ ] 11.2 Add GET /pet/mood endpoint
    - Return MoodState and MoodModifiers
    - _Requirements: 5.11, 12.2_
  
  - [ ] 11.3 Add GET /pet/age endpoint
    - Return age_days, birth_date, age_display
    - _Requirements: 8.7, 12.3_
  
  - [ ] 11.4 Add GET /pet/evolution endpoint
    - Return current stage, scale, next stage requirements
    - _Requirements: 12.5_
  
  - [ ] 11.5 Add GET /pet/events endpoint
    - Return event history with limit parameter
    - _Requirements: 10.5, 12.4_
  
  - [ ] 11.6 Update POST /pet/action/* responses
    - Include character_deltas in response
    - Include mood_changed and new_mood
    - Include evolution_occurred flag
    - Include triggered_events list
    - _Requirements: 12.6, 12.7, 12.8, 12.9_
  
  - [ ]* 11.7 Write unit tests for API endpoints
    - Test each endpoint returns correct data structure
    - Test error handling (404, 400, 500)
    - Test action response includes growth data
    - _Requirements: 12.1-12.10_

- [ ] 12. Create TypeScript types for growth systems
  - [ ] 12.1 Create types.ts in frontend/src/types/
    - Define CharacterStats interface
    - Define CharacterModifiers interface
    - Define LifeStage type
    - Define StageInfo interface
    - Define EvolutionProgress interface
    - Define MoodType type
    - Define MoodState interface
    - Define MoodModifiers interface
    - Define EventCategory type
    - Define LifeEvent interface
    - Define EventHistory interface
    - Define AgeInfo interface
    - Extend PetState interface with growth fields
    - _Requirements: All_

- [ ] 13. Implement CharacterPanel component
  - [ ] 13.1 Create CharacterPanel.tsx
    - Display five character parameters with progress bars
    - Show parameter values (0-100)
    - Use emoji icons for each parameter
    - Style with Tailwind CSS
    - _Requirements: 1.11_
  
  - [ ]* 13.2 Write component tests for CharacterPanel
    - Test renders all five parameters
    - Test progress bars show correct percentages
    - Test displays correct values

- [ ] 14. Implement MoodIndicator component
  - [ ] 14.1 Create MoodIndicator.tsx
    - Display emoji sprite above dragon
    - Position using Three.js coordinates
    - Implement floating animation
    - Auto-hide after 3 seconds
    - Show on mood change
    - _Requirements: 7.1-7.10_
  
  - [ ] 14.2 Add aura effect to Dragon3D
    - Implement colored glow based on mood
    - Use Three.js PointLight or shader
    - Update color when mood changes
    - _Requirements: 7.9_
  
  - [ ]* 14.3 Write component tests for MoodIndicator
    - Test displays correct emoji for each mood
    - Test positioning above dragon
    - Test auto-hide after 3 seconds

- [ ] 15. Implement AgeDisplay component
  - [ ] 15.1 Create AgeDisplay.tsx
    - Display age in days
    - Display birth date
    - Format dates in user's locale
    - Style with Tailwind CSS
    - _Requirements: 8.4_
  
  - [ ]* 15.2 Write component tests for AgeDisplay
    - Test displays correct age
    - Test formats dates correctly


- [ ] 16. Implement EventNotification component
  - [ ] 16.1 Create EventNotification.tsx
    - Display popup with event emoji, title, description
    - Show stat changes and rewards
    - Implement slide-in animation from top
    - Auto-dismiss after 5 seconds
    - Allow manual dismiss on click
    - Queue multiple notifications
    - _Requirements: 10.1, 10.8, 10.9, 10.10_
  
  - [ ]* 16.2 Write component tests for EventNotification
    - Test displays event data correctly
    - Test auto-dismiss after 5 seconds
    - Test manual dismiss
    - Test notification queue

- [ ] 17. Implement EventHistory component
  - [ ] 17.1 Create EventHistory.tsx
    - Display list of past events
    - Show emoji, title, timestamp, effects
    - Format timestamps in user's locale
    - Implement scroll for long lists
    - Add "Load More" button if needed
    - Style with Tailwind CSS
    - _Requirements: 10.5, 10.7_
  
  - [ ]* 17.2 Write component tests for EventHistory
    - Test displays events in reverse chronological order
    - Test formats timestamps correctly
    - Test shows event effects

- [ ] 18. Update Dragon3D component for growth system
  - [ ] 18.1 Add stage-based scaling
    - Map stage to scale value (0.5 to 2.2)
    - Animate scale transitions smoothly
    - _Requirements: 4.1-4.7_
  
  - [ ] 18.2 Add mood-based animations
    - Define animation sets for each mood
    - Switch animations when mood changes
    - Adjust animation speed based on mood
    - _Requirements: 6.3, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [ ] 18.3 Add elder stage visual effects
    - Add gray hair texture for elder stage
    - Adjust color tint for wisdom appearance
    - _Requirements: 4.8_
  
  - [ ] 18.4 Add evolution animation
    - Implement glow effect
    - Implement rotation animation
    - Implement scale transition
    - Trigger on evolution event
    - _Requirements: 3.10_
  
  - [ ]* 18.5 Write component tests for Dragon3D updates
    - Test scale changes with stage
    - Test animation changes with mood
    - Test elder stage visuals

- [ ] 19. Integrate growth systems into main App
  - [ ] 19.1 Add state management for growth data
    - Add character state
    - Add mood state
    - Add age state
    - Add events state
    - _Requirements: All_
  
  - [ ] 19.2 Fetch growth data on app load
    - Call /pet/character endpoint
    - Call /pet/mood endpoint
    - Call /pet/age endpoint
    - Call /pet/evolution endpoint
    - Call /pet/events endpoint
    - _Requirements: 12.1-12.5_
  
  - [ ] 19.3 Update growth data on actions
    - Parse character_deltas from action response
    - Update mood if mood_changed is true
    - Show evolution animation if evolution_occurred
    - Show event notifications for triggered_events
    - _Requirements: 12.6-12.9_
  
  - [ ] 19.4 Add periodic mood updates
    - Poll /pet/mood every 30 seconds
    - Update MoodIndicator when mood changes
    - _Requirements: 5.9_
  
  - [ ] 19.5 Add periodic event checks
    - Poll /pet/events every 5 minutes
    - Show notifications for new events
    - _Requirements: 9.1_

- [ ] 20. Add UI for growth system panels
  - [ ] 20.1 Add CharacterPanel to sidebar or modal
    - Position in UI layout
    - Add toggle button if needed
    - Style consistently with existing UI
    - _Requirements: 1.11_
  
  - [ ] 20.2 Add AgeDisplay to pet profile
    - Position in profile section
    - Style consistently with existing UI
    - _Requirements: 8.4_
  
  - [ ] 20.3 Add EventHistory to sidebar or modal
    - Position in UI layout
    - Add toggle button if needed
    - Style consistently with existing UI
    - _Requirements: 10.5_
  
  - [ ] 20.4 Add MoodIndicator to dragon view
    - Position above dragon in 3D scene
    - Ensure visibility at all camera angles
    - _Requirements: 7.1-7.10_

- [ ] 21. Checkpoint - Ensure frontend integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Add evolution notification system
  - [ ] 22.1 Create EvolutionNotification component
    - Display large celebration notification
    - Show old and new stage
    - Show unlocked abilities
    - Play evolution animation
    - _Requirements: 3.11, 3.12_
  
  - [ ] 22.2 Trigger evolution notification on evolution
    - Listen for evolution_occurred in action response
    - Show EvolutionNotification component
    - Play sound effect (optional)
    - _Requirements: 3.11_

- [ ] 23. Implement character-based visual effects
  - [ ] 23.1 Add color tint based on dominant character trait
    - Calculate dominant trait (highest parameter)
    - Map trait to color (courage → red, friendliness → pink, etc.)
    - Apply subtle tint to dragon material
    - _Requirements: 4.9_
  
  - [ ] 23.2 Add animation frequency based on energy
    - Increase idle animation frequency if energy > 70
    - Decrease if energy < 30
    - _Requirements: 2.5_

- [ ] 24. Add error handling and edge cases
  - [ ] 24.1 Handle missing growth data gracefully
    - Show default values if API fails
    - Log errors for debugging
    - Don't block gameplay
    - _Requirements: Error Handling section_
  
  - [ ] 24.2 Handle invalid growth data
    - Validate ranges on frontend
    - Clamp values if out of bounds
    - Show warning to user if data seems corrupted
    - _Requirements: 11.9, 11.10_
  
  - [ ]* 24.3 Write integration tests for error scenarios
    - Test API failure handling
    - Test invalid data handling
    - Test network errors

- [ ] 25. Performance optimization
  - [ ] 25.1 Optimize growth data fetching
    - Batch API calls where possible
    - Cache growth data in memory
    - Only refetch when needed
    - _Requirements: Performance section_
  
  - [ ] 25.2 Optimize mood updates
    - Debounce mood recalculation
    - Only update UI if mood actually changed
    - _Requirements: 5.9_
  
  - [ ] 25.3 Optimize event history
    - Paginate event history if > 50 events
    - Lazy load older events
    - _Requirements: 10.6_

- [ ] 26. Final integration testing
  - [ ]* 26.1 Test complete action flow
    - Perform action → character updates → mood updates → XP modified
    - Verify all systems work together
    - _Requirements: All_
  
  - [ ]* 26.2 Test evolution flow
    - Level up → check evolution → trigger animation → notification
    - Verify evolution unlocks abilities
    - _Requirements: 3.3-3.12_
  
  - [ ]* 26.3 Test event flow
    - Wait for event → apply effects → show notification → log to history
    - Verify events affect stats correctly
    - _Requirements: 9.1-9.16, 10.1-10.7_
  
  - [ ]* 26.4 Test persistence flow
    - Perform actions → save → reload → verify all data restored
    - Test with various growth states
    - _Requirements: 11.1-11.10_

- [ ] 27. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests verify that all systems work together correctly
- The implementation follows a bottom-up approach: database → backend systems → API → frontend components → integration
