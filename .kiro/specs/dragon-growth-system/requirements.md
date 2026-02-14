# Requirements Document

## Introduction

The Dragon Growth System transforms the game into a true tamagotchi experience by implementing a comprehensive character development, evolution, mood, and life events system. The dragon will develop a unique personality based on player actions, progress through seven life stages, experience dynamic moods, and encounter random life events that create an engaging, living companion experience.

## Glossary

- **Dragon**: The virtual pet that the player cares for
- **Character_System**: The subsystem managing five personality parameters
- **Evolution_System**: The subsystem managing seven life stages
- **Mood_System**: The subsystem managing seven emotional states
- **Event_System**: The subsystem managing random life events
- **Character_Parameter**: A personality trait value (0-100)
- **Life_Stage**: One of seven developmental phases
- **Mood_State**: Current emotional condition affecting gameplay
- **Life_Event**: A random occurrence affecting the dragon
- **Game_Action**: Player interaction (feeding, playing, cleaning, etc.)
- **Stat_Modifier**: Bonus or penalty applied to gameplay values
- **Experience_Points**: Currency for leveling up
- **Age_Days**: Dragon's age measured in real-world days
- **Event_History**: Log of all life events that occurred

## Requirements

### Requirement 1: Character System

**User Story:** As a player, I want my dragon to develop a unique personality based on my actions, so that each dragon feels different and my choices matter.

#### Acceptance Criteria

1. THE Character_System SHALL maintain five personality parameters: Courage, Friendliness, Energy, Curiosity, and Tidiness
2. WHEN the dragon is created, THE Character_System SHALL initialize all parameters to 50
3. FOR ALL Character_Parameters, THE Character_System SHALL enforce values between 0 and 100 inclusive
4. WHEN a Game_Action is performed, THE Character_System SHALL increase the corresponding Character_Parameter by 1 to 3 points
5. WHEN playing mini-games, THE Character_System SHALL increase Courage by 2 points
6. WHEN feeding or interacting, THE Character_System SHALL increase Friendliness by 2 points
7. WHEN playing games, THE Character_System SHALL increase Energy by 2 points
8. WHEN interacting or exploring, THE Character_System SHALL increase Curiosity by 2 points
9. WHEN cleaning the dragon, THE Character_System SHALL increase Tidiness by 3 points
10. THE Character_System SHALL persist all Character_Parameters to the database
11. THE Character_System SHALL provide an API endpoint to retrieve current character values

### Requirement 2: Character Gameplay Impact

**User Story:** As a player, I want my dragon's personality to affect gameplay, so that character development has meaningful consequences.

#### Acceptance Criteria

1. WHEN Courage is greater than 70, THE Character_System SHALL apply a 20% bonus to Experience_Points gained from mini-games
2. WHEN Friendliness is greater than 70, THE Character_System SHALL reduce happiness decay rate by 30%
3. WHEN Friendliness is greater than 70, THE Character_System SHALL reduce illness probability by 50%
4. WHEN Energy is greater than 70, THE Character_System SHALL increase stat recovery rate by 15%
5. WHEN Energy is greater than 70, THE Character_System SHALL increase idle animation frequency by 50%
6. WHEN Curiosity is greater than 70, THE Character_System SHALL provide a 5% chance per hour to find random items worth 50-200 coins
7. WHEN Tidiness is greater than 70, THE Character_System SHALL reduce cleanliness decay rate by 40%
8. THE Character_System SHALL recalculate all Stat_Modifiers whenever Character_Parameters change

### Requirement 3: Extended Evolution System

**User Story:** As a player, I want my dragon to progress through seven distinct life stages, so that I can watch it grow from egg to wise elder.

#### Acceptance Criteria

1. THE Evolution_System SHALL support seven Life_Stages: Egg, Newborn, Baby, Child, Teen, Adult, and Elder
2. WHEN a dragon is created, THE Evolution_System SHALL set the Life_Stage to Egg
3. WHEN Age_Days equals 0 AND one hour has passed, THE Evolution_System SHALL evolve from Egg to Newborn
4. WHEN Age_Days is between 0 and 1 AND level is between 1 and 2, THE Evolution_System SHALL maintain Newborn stage
5. WHEN Age_Days is between 1 and 3 AND level is between 3 and 5, THE Evolution_System SHALL evolve to Baby stage
6. WHEN Age_Days is between 4 and 7 AND level is between 6 and 10, THE Evolution_System SHALL evolve to Child stage
7. WHEN Age_Days is between 8 and 14 AND level is between 11 and 15, THE Evolution_System SHALL evolve to Teen stage
8. WHEN Age_Days is between 15 and 30 AND level is between 16 and 25, THE Evolution_System SHALL evolve to Adult stage
9. WHEN Age_Days is greater than 30 AND level is greater than 25, THE Evolution_System SHALL evolve to Elder stage
10. WHEN evolution occurs, THE Evolution_System SHALL trigger an evolution animation
11. WHEN evolution occurs, THE Evolution_System SHALL send a notification to the player
12. WHEN evolution occurs, THE Evolution_System SHALL unlock new abilities appropriate to the Life_Stage
13. THE Evolution_System SHALL persist the current Life_Stage to the database

### Requirement 4: Visual Evolution Changes

**User Story:** As a player, I want to see my dragon change visually as it grows, so that evolution feels impactful and rewarding.

#### Acceptance Criteria

1. WHEN Life_Stage is Egg, THE Evolution_System SHALL set dragon scale to 0.5
2. WHEN Life_Stage is Newborn, THE Evolution_System SHALL set dragon scale to 0.7
3. WHEN Life_Stage is Baby, THE Evolution_System SHALL set dragon scale to 1.0
4. WHEN Life_Stage is Child, THE Evolution_System SHALL set dragon scale to 1.3
5. WHEN Life_Stage is Teen, THE Evolution_System SHALL set dragon scale to 1.6
6. WHEN Life_Stage is Adult, THE Evolution_System SHALL set dragon scale to 2.0
7. WHEN Life_Stage is Elder, THE Evolution_System SHALL set dragon scale to 2.2
8. WHEN Life_Stage is Elder, THE Evolution_System SHALL add visual indicators of wisdom (gray coloring, different texture)
9. WHEN Character_Parameters change significantly, THE Evolution_System SHALL adjust dragon color tint based on dominant personality trait

### Requirement 5: Mood System

**User Story:** As a player, I want my dragon to have moods that reflect its current state, so that I can understand its needs at a glance.

#### Acceptance Criteria

1. THE Mood_System SHALL support seven Mood_States: Happy, Normal, Sad, Angry, Sleepy, Sick, and Excited
2. WHEN all stats are above 70%, THE Mood_System SHALL set Mood_State to Happy
3. WHEN all stats are between 40% and 70%, THE Mood_System SHALL set Mood_State to Normal
4. WHEN any stat is below 40%, THE Mood_System SHALL set Mood_State to Sad
5. WHEN hunger is below 20%, THE Mood_System SHALL set Mood_State to Angry
6. WHEN current time is after 22:00 local time, THE Mood_System SHALL set Mood_State to Sleepy
7. WHEN health is below 30%, THE Mood_System SHALL set Mood_State to Sick
8. WHEN a game was played within the last 5 minutes, THE Mood_System SHALL set Mood_State to Excited
9. THE Mood_System SHALL update Mood_State every 30 seconds
10. THE Mood_System SHALL persist current Mood_State to the database
11. THE Mood_System SHALL provide an API endpoint to retrieve current mood

### Requirement 6: Mood Gameplay Impact

**User Story:** As a player, I want my dragon's mood to affect gameplay, so that maintaining good care has tangible benefits.

#### Acceptance Criteria

1. WHEN Mood_State is Happy, THE Mood_System SHALL apply a 50% bonus to Experience_Points gained
2. WHEN Mood_State is Happy, THE Mood_System SHALL increase idle animation activity level
3. WHEN Mood_State is Sad, THE Mood_System SHALL apply a 25% penalty to Experience_Points gained
4. WHEN Mood_State is Sad, THE Mood_System SHALL decrease idle animation activity level
5. WHEN Mood_State is Angry, THE Mood_System SHALL prevent playing mini-games
6. WHEN Mood_State is Angry, THE Mood_System SHALL display aggressive idle animations
7. WHEN Mood_State is Sleepy, THE Mood_System SHALL display yawning animations
8. WHEN Mood_State is Sick, THE Mood_System SHALL display weak idle animations
9. WHEN Mood_State is Excited, THE Mood_System SHALL display very active idle animations
10. THE Mood_System SHALL recalculate Experience_Points modifiers whenever Mood_State changes

### Requirement 7: Mood Visual Indicators

**User Story:** As a player, I want to see visual indicators of my dragon's mood, so that I can quickly understand its emotional state.

#### Acceptance Criteria

1. WHEN Mood_State changes, THE Mood_System SHALL display an emoji sprite above the dragon's head
2. WHEN Mood_State is Happy, THE Mood_System SHALL display "😊" emoji
3. WHEN Mood_State is Normal, THE Mood_System SHALL display "😐" emoji
4. WHEN Mood_State is Sad, THE Mood_System SHALL display "😢" emoji
5. WHEN Mood_State is Angry, THE Mood_System SHALL display "😠" emoji
6. WHEN Mood_State is Sleepy, THE Mood_System SHALL display "😴" emoji
7. WHEN Mood_State is Sick, THE Mood_System SHALL display "🤢" emoji
8. WHEN Mood_State is Excited, THE Mood_System SHALL display "🎉" emoji
9. WHEN Mood_State changes, THE Mood_System SHALL change the color of the aura around the dragon
10. THE Mood_System SHALL keep the emoji visible for at least 3 seconds

### Requirement 8: Age System

**User Story:** As a player, I want my dragon to age in real-time, so that it feels like a living companion with a life cycle.

#### Acceptance Criteria

1. WHEN a dragon is created, THE Event_System SHALL record the birth_date as the current timestamp
2. THE Event_System SHALL calculate Age_Days as the difference between current time and birth_date in days
3. THE Event_System SHALL update Age_Days every hour
4. THE Event_System SHALL display Age_Days in the dragon profile as "Age: X days"
5. WHEN Age_Days exceeds 30, THE Event_System SHALL add visual aging indicators (gray hair, wise appearance)
6. THE Event_System SHALL persist birth_date to the database
7. THE Event_System SHALL provide an API endpoint to retrieve current age

### Requirement 9: Random Life Events

**User Story:** As a player, I want my dragon to experience random life events, so that the game feels dynamic and unpredictable.

#### Acceptance Criteria

1. THE Event_System SHALL check for random events every hour
2. WHEN checking for events, THE Event_System SHALL have a 30% chance of triggering a positive event
3. WHEN checking for events, THE Event_System SHALL have a 15% chance of triggering a negative event
4. WHEN checking for events, THE Event_System SHALL have a 10% chance of triggering a neutral event
5. WHEN Age_Days is a multiple of 7, THE Event_System SHALL trigger a birthday event
6. WHEN a birthday event occurs, THE Event_System SHALL award 500 coins and display a celebration animation
7. WHEN Curiosity is above 70, THE Event_System SHALL have a 5% chance per hour to trigger a "Found Item" event
8. WHEN a "Found Item" event occurs, THE Event_System SHALL award 50-200 coins
9. WHEN a random event occurs, THE Event_System SHALL have a 3% chance to award a random shop item
10. WHEN health is below 50%, THE Event_System SHALL have a 15% chance to trigger a "Cold" event
11. WHEN a "Cold" event occurs, THE Event_System SHALL reduce health by 20 points
12. WHEN current time is between 22:00 and 06:00, THE Event_System SHALL have a 10% chance to trigger a "Nightmare" event
13. WHEN a "Nightmare" event occurs, THE Event_System SHALL reduce happiness by 15 points
14. WHEN cleanliness is below 30%, THE Event_System SHALL have a 15% chance to trigger a "Parasites" event
15. WHEN a "Parasites" event occurs, THE Event_System SHALL reduce health by 10 points and cleanliness by 20 points
16. THE Event_System SHALL persist last_event_check timestamp to the database

### Requirement 10: Event Notifications and History

**User Story:** As a player, I want to be notified of life events and review past events, so that I can stay informed and track my dragon's life story.

#### Acceptance Criteria

1. WHEN a Life_Event occurs, THE Event_System SHALL display a popup notification with event details
2. WHEN a Life_Event occurs, THE Event_System SHALL add the event to Event_History
3. THE Event_System SHALL store event type, timestamp, description, and stat changes in Event_History
4. THE Event_System SHALL persist Event_History as JSON in the database
5. THE Event_System SHALL provide an API endpoint to retrieve Event_History
6. THE Event_System SHALL limit Event_History to the most recent 50 events
7. WHEN displaying Event_History, THE Event_System SHALL show events in reverse chronological order
8. WHEN displaying an event notification, THE Event_System SHALL include an appropriate emoji icon
9. THE Event_System SHALL auto-dismiss event notifications after 5 seconds
10. THE Event_System SHALL allow manual dismissal of event notifications

### Requirement 11: Data Persistence

**User Story:** As a developer, I want all growth system data to persist reliably, so that players never lose their dragon's personality and history.

#### Acceptance Criteria

1. THE Character_System SHALL save all Character_Parameters to the database after each change
2. THE Evolution_System SHALL save current Life_Stage to the database after each evolution
3. THE Mood_System SHALL save current Mood_State to the database every 30 seconds
4. THE Event_System SHALL save birth_date, Age_Days, last_event_check, and Event_History to the database
5. WHEN the game loads, THE Character_System SHALL restore all Character_Parameters from the database
6. WHEN the game loads, THE Evolution_System SHALL restore Life_Stage from the database
7. WHEN the game loads, THE Mood_System SHALL restore Mood_State from the database
8. WHEN the game loads, THE Event_System SHALL restore age and event data from the database
9. THE Dragon SHALL validate all restored values are within acceptable ranges
10. IF any restored value is invalid, THE Dragon SHALL reset that value to a safe default

### Requirement 12: API Endpoints

**User Story:** As a frontend developer, I want clear API endpoints for all growth system features, so that I can integrate them into the UI.

#### Acceptance Criteria

1. THE Backend SHALL provide GET /pet/character endpoint returning all five Character_Parameters
2. THE Backend SHALL provide GET /pet/mood endpoint returning current Mood_State and timestamp
3. THE Backend SHALL provide GET /pet/age endpoint returning Age_Days and birth_date
4. THE Backend SHALL provide GET /pet/events endpoint returning Event_History array
5. THE Backend SHALL provide GET /pet/evolution endpoint returning current Life_Stage and next stage requirements
6. WHEN POST /pet/action is called, THE Backend SHALL update relevant Character_Parameters
7. WHEN POST /pet/action is called, THE Backend SHALL recalculate Mood_State
8. WHEN POST /pet/action is called, THE Backend SHALL check for triggered events
9. THE Backend SHALL return updated character, mood, and event data in action responses
10. THE Backend SHALL handle all database errors gracefully and return appropriate HTTP status codes
