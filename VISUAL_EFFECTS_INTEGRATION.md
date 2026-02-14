# Интеграция визуальных эффектов

## Обзор

Система визуальных эффектов полностью реализована и готова к интеграции в игру. Все модули находятся в `frontend/src/effects/`.

## Что реализовано

✅ **Базовая инфраструктура**
- TypeScript типы и интерфейсы
- Модульная архитектура

✅ **TimeManager** - Цикл день/ночь
- 24-минутный цикл
- Плавные переходы цветов неба
- 4 периода: утро, день, вечер, ночь

✅ **SkyManager** - Небесные элементы
- Анимированные облака
- Солнце и луна с освещением
- Мерцающие звёзды

✅ **WeatherSystem** - Погодные эффекты
- Случайные события дождя и снега
- Система частиц для осадков
- Влияние на освещение

✅ **EnvironmentAnimator** - Анимация природы
- Качающиеся деревья
- Волны травы
- Летающие бабочки
- Падающие листья

✅ **ParticleEmitter** - Эффекты действий
- Искры (level up)
- Сердечки (счастье)
- Пузыри (мытьё)
- Блёстки (лечение)
- След (движение)

✅ **LightingRig** - Динамическое освещение
- Освещение по времени суток
- Временные огни для действий
- Тени

✅ **PerformanceManager** - Оптимизация
- Мониторинг FPS
- Автоматическая настройка качества
- 3 уровня качества (low, medium, high)
- Определение мобильных устройств

✅ **VisualEffectsCoordinator** - Центральный координатор
- Singleton для глобального доступа
- Управление всеми подсистемами
- Сохранение настроек

✅ **UI улучшения**
- CSS переходы для панелей (300ms fade in, 200ms fade out)
- Анимация прогресс-баров (500ms)
- Пульсация низких статов
- Hover эффекты для кнопок (scale 1.05x, 150ms)

## Как интегрировать

### Шаг 1: Импорт в Dragon3D компонент

```typescript
// В frontend/src/components/Dragon3D.tsx
import { visualEffects } from '../effects';
```

### Шаг 2: Инициализация в useEffect

```typescript
useEffect(() => {
  // ... существующий код создания сцены ...
  
  // Инициализировать визуальные эффекты
  if (scene && camera) {
    visualEffects.initialize(scene, camera);
    visualEffects.start();
  }
  
  return () => {
    visualEffects.dispose();
  };
}, []);
```

### Шаг 3: Обновление в animation loop

```typescript
const animate = () => {
  if (!running) return;
  
  const delta = clock.getDelta();
  
  // Обновить визуальные эффекты
  visualEffects.update(delta);
  
  // ... остальной код анимации ...
  
  renderer.render(scene, camera);
  rafRef.current = requestAnimationFrame(animate);
};
```

### Шаг 4: Триггер эффектов при действиях

```typescript
// В функции playAction
const playAction = async (action: ТипДействия) => {
  // ... существующий код ...
  
  // Триггер визуальных эффектов
  const position = modelRootRef.current?.position || new THREE.Vector3(0, 1, 0);
  visualEffects.triggerActionEffect(action as ActionType, position);
  
  // ... остальной код ...
};
```

### Шаг 5: Эффект счастья

```typescript
// Когда счастье > 80%
if (state.happiness > 80) {
  const position = modelRootRef.current?.position || new THREE.Vector3(0, 1, 0);
  visualEffects.triggerHappinessHearts(position);
}
```

### Шаг 6: След при движении (опционально)

```typescript
// В animation loop, если дракон двигается
if (isMoving) {
  const position = modelRootRef.current?.position || new THREE.Vector3(0, 1, 0);
  visualEffects.triggerMovementTrail(position);
}
```

## Настройки

### Получение текущих настроек

```typescript
const settings = visualEffects.getSettings();
console.log('Quality:', settings.qualityLevel);
console.log('FPS:', visualEffects.currentFPS);
```

### Изменение настроек

```typescript
visualEffects.applySettings({
  qualityLevel: 'medium',
  weatherEnabled: true,
  particlesEnabled: true,
  shadowsEnabled: false
});
```

## UI компонент настроек (опционально)

Можно создать компонент для управления настройками:

```typescript
// frontend/src/components/VisualEffectsSettings.tsx
import { useState, useEffect } from 'react';
import { visualEffects } from '../effects';

export function VisualEffectsSettings() {
  const [settings, setSettings] = useState(visualEffects.getSettings());
  
  const handleQualityChange = (level: 'low' | 'medium' | 'high') => {
    visualEffects.applySettings({ qualityLevel: level });
    setSettings(visualEffects.getSettings());
  };
  
  return (
    <div className="settings-panel">
      <h3>Визуальные эффекты</h3>
      
      <div>
        <label>Качество:</label>
        <select 
          value={settings.qualityLevel} 
          onChange={(e) => handleQualityChange(e.target.value as any)}
        >
          <option value="low">Низкое</option>
          <option value="medium">Среднее</option>
          <option value="high">Высокое</option>
        </select>
      </div>
      
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={settings.weatherEnabled}
            onChange={(e) => visualEffects.applySettings({ weatherEnabled: e.target.checked })}
          />
          Погодные эффекты
        </label>
      </div>
      
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={settings.particlesEnabled}
            onChange={(e) => visualEffects.applySettings({ particlesEnabled: e.target.checked })}
          />
          Частицы
        </label>
      </div>
      
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={settings.shadowsEnabled}
            onChange={(e) => visualEffects.applySettings({ shadowsEnabled: e.target.checked })}
          />
          Тени
        </label>
      </div>
      
      <div>
        <small>FPS: {visualEffects.currentFPS.toFixed(1)}</small>
      </div>
    </div>
  );
}
```

## Производительность

### Автоматическая оптимизация

Система автоматически:
- Мониторит FPS каждую секунду
- Снижает качество если FPS < 45 в течение 3 секунд
- Определяет мобильные устройства и применяет оптимизации

### Уровни качества

**Low:**
- 100 частиц
- Тени выключены
- 100 частиц погоды
- 2 бабочки

**Medium:**
- 150 частиц
- Тени включены
- 200 частиц погоды
- 3 бабочки

**High:**
- 200 частиц
- Тени включены
- 300 частиц погоды
- 5 бабочек

### Мобильные оптимизации

На мобильных устройствах автоматически:
- Качество по умолчанию: Medium
- Частицы -30%
- Тени выключены
- Погодные частицы ≤ 100

## Отладка

```typescript
// Проверить текущее состояние
console.log('FPS:', visualEffects.currentFPS);
console.log('Time:', visualEffects.currentTime);
console.log('Weather:', visualEffects.currentWeather);
console.log('Settings:', visualEffects.getSettings());
```

## Что дальше

1. ✅ Интегрировать в Dragon3D компонент
2. ✅ Протестировать на разных устройствах
3. ⏳ Создать UI панель настроек (опционально)
4. ⏳ Написать property-based тесты (опционально)
5. ⏳ Добавить больше эффектов частиц (опционально)

## Известные ограничения

- Требуется WebGL
- Может снизить FPS на слабых устройствах (автоматически оптимизируется)
- Погодные эффекты случайные (15% каждые 2 минуты)

## Поддержка

Все модули находятся в `frontend/src/effects/`:
- `types.ts` - TypeScript типы
- `TimeManager.ts` - Цикл времени
- `SkyManager.ts` - Небо
- `WeatherSystem.ts` - Погода
- `EnvironmentAnimator.ts` - Анимация природы
- `ParticleEmitter.ts` - Частицы
- `LightingRig.ts` - Освещение
- `PerformanceManager.ts` - Производительность
- `VisualEffectsCoordinator.ts` - Координатор
- `index.ts` - Экспорты
- `README.md` - Документация

Настройки сохраняются в localStorage автоматически.
