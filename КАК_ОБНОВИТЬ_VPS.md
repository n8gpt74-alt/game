# Как обновить проект на VPS

## Быстрое обновление (рекомендуется)

Подключитесь к VPS по SSH и выполните:

```bash
# Перейти в папку проекта
cd /path/to/your/project

# Получить последние изменения из GitHub
git pull origin main

# Пересобрать и перезапустить контейнеры
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверить статус
docker-compose ps
```

## Полное обновление (если что-то сломалось)

```bash
# Остановить все контейнеры
docker-compose down

# Получить изменения
git pull origin main

# Пересобрать ВСЕ контейнеры
docker-compose build --no-cache

# Запустить
docker-compose up -d

# Посмотреть логи
docker-compose logs -f frontend
```

## Обновление только фронтенда

```bash
cd /path/to/your/project
git pull origin main
docker-compose up -d --build --force-recreate frontend
```

## Проверка визуальных эффектов

После обновления откройте браузер и проверьте:

1. **Консоль браузера** (F12):
   ```javascript
   window.visualEffects
   ```
   Должен вернуть объект с методами

2. **Визуальные эффекты**:
   - День/ночь цикл (24 минуты)
   - Облака, солнце, луна, звёзды
   - Случайная погода (дождь/снег)
   - Анимация деревьев, травы, бабочек
   - Эффекты частиц при действиях

## Troubleshooting

### Старая версия всё ещё показывается

```bash
# Жёсткая очистка кеша Docker
docker-compose down
docker system prune -a --volumes
git pull origin main
docker-compose up -d --build
```

### Ошибки при сборке

```bash
# Посмотреть логи сборки
docker-compose build frontend 2>&1 | tee build.log

# Проверить логи контейнера
docker-compose logs frontend
```

### Nginx показывает 502 Bad Gateway

```bash
# Проверить, что frontend запущен
docker-compose ps frontend

# Перезапустить nginx
docker-compose restart nginx
```

## Важно

- **Vercel** деплоит автоматически из GitHub (только frontend)
- **VPS** нужно обновлять вручную командами выше (frontend + backend)
- После `git pull` обязательно пересобрать Docker образы
