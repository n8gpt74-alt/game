# Telegram Mini App: Дракончик Тамагочи

Мобильная игра для Telegram Mini App:
- 2D-комната и интерфейс в casual-стиле;
- 3D-дракончик в центре (Three.js);
- сервер-авторитетная симуляция (FastAPI + Postgres/Redis/Celery);
- полноценная экономика, уровни, ежедневные задания, магазин и AI-поведение питомца;
- весь интерфейс игры на русском языке.

## Стек

- Фронтенд: `React + Vite + TypeScript + Three.js`
- Бэкенд: `FastAPI + SQLAlchemy + Celery + Redis + Postgres`
- Инфраструктура: `Docker Compose + Nginx`

## Ключевые возможности

- Вертикальная mobile-first раскладка с учётом safe-area Telegram.
- Сцена занимает около `75-80%` экрана по высоте.
- Действия: `Кормить`, `Мыть`, `Играть`, `Лечить`, `Общение`, `Мини-игры`.
- **Автоматическое сохранение прогресса**: Все данные сохраняются после каждого действия
- **Мгновенная загрузка**: Прогресс загружается из кэша при старте
- **Мягкая деградация**: Питомец не деградирует слишком сильно при длительном отсутствии
- **Офлайн-режим**: Игра работает без интернета с локальными данными
- 3D-компонент `Unicorn3D`:
  - фиксированная камера;
  - мягкий свет и тень;
  - `playAction(actionName)` с возвратом в `Idle`;
  - `evolveTo(stage)` при смене стадии.
- FX-слой поверх 3D (`FxOverlay`) с лимитом активных всплесков.
- Серверный decay-тик каждые 10 минут (через Beat + lazy-decay по запросу).

## Игровая экономика и формулы

### Ресурсы
- Монеты
- Опыт
- Интеллект
- Кристаллы

### Базовые награды действий
- Кормить: `+5 опыта`, `+2 монеты`
- Мыть: `+5 опыта`, `+2 монеты`
- Играть: `+10 опыта`, `+5 монет`, `-10 энергии` (по статам действия)
- Лечить: `+7 опыта`, `+3 монеты`
- Мини-игра (успех): `+15 опыта`, `+10 монет`, `+2 интеллекта`

### Формула уровня
- Опыт до следующего уровня:
  - `ceil(50 * уровень^1.4)`

### Множитель интеллекта
- Фактически начисляемый опыт:
  - `базовый_опыт * (1 + интеллект / 100)`

### Стадии роста
- `baby` (Малыш): уровни `1-5`
- `child` (Ребёнок): уровни `6-10`
- `teen` (Подросток): уровни `11-20`
- `adult` (Взрослый): уровень `21+`

### Формула цен магазина
- Цена товара:
  - `базовая_цена * 1.8^уровень`

## AI-поведение питомца

Состояния:
- Спокойный
- Радостный
- Голодный
- Уставший
- Грязный
- Больной
- Игривый
- Любопытный
- Грустный

Приоритеты определения состояния:
- если `сытость < 30` → Голодный
- если `энергия < 20` → Уставший
- если `чистота < 30` → Грязный
- если `здоровье < 40` → Больной
- если `настроение > 80` → Радостный
- иначе по правилам игры → Спокойный/Грустный/Игривый/Любопытный

Если игрок отсутствует более 24 часов:
- настроение падает быстрее;
- сервер возвращает признак `is_lonely`;
- интерфейс показывает сигнал «Питомец скучает».

## API

Авторизация:
- `POST /auth/telegram`

Состояние и действия:
- `GET /state`
- `POST /action/feed`
- `POST /action/wash`
- `POST /action/play`
- `POST /action/heal`
- `POST /action/chat`

Мини-игры:
- `POST /minigames/result`

Ежедневные задания:
- `GET /daily`
- `POST /daily/claim-login`
- `POST /daily/claim-chest`

Магазин и инвентарь:
- `GET /shop/catalog`
- `POST /shop/buy`
- `GET /inventory`

История:
- `GET /history`

## Локальный запуск без Docker

### 1) Бэкенд

Из корня проекта:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Запуск API:

```powershell
$env:DATABASE_URL='sqlite:///./local_run.db'
$env:ALLOW_DEV_AUTH='true'
$env:SECRET_KEY='dev-secret-not-for-prod'
$env:ENVIRONMENT='development'
.\.venv\Scripts\python -m app.migrations
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2) Фронтенд

Во втором терминале:

```powershell
cd frontend
npm install
$env:VITE_API_BASE='http://127.0.0.1:8000'
npm run dev -- --host 127.0.0.1 --port 5173
```

Открыть: `http://127.0.0.1:5173`

## Запуск через Docker Compose (локально/VPS)

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Проверка:
- `http://localhost/api/health`

## Деплой на VPS (production)

### 1) Подготовка VPS

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

### 2) Запуск стека

```bash
git clone <repo-url> tamagotchi
cd tamagotchi
cp .env.example .env
# заполните .env реальными значениями (обязательно: ENVIRONMENT=production, ALLOW_DEV_AUTH=false, SECRET_KEY длиной 32+)
docker compose up -d --build
```

### 3) Проверка

```bash
docker compose ps
curl -f http://127.0.0.1/api/health
curl -f http://127.0.0.1/nginx-health
```

### 4) TLS через Certbot + Let's Encrypt

1. Направьте DNS `A`-записи домена на VPS.
2. Выпустите сертификат:

```bash
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d example.com -d www.example.com \
  --email you@example.com --agree-tos --no-eff-email
```

3. Откройте `nginx/nginx.tls.conf.example`, подставьте домен, сохраните как `nginx/nginx.conf`.
4. Перезапустите nginx:

```bash
docker compose up -d nginx
```

5. Проверьте HTTPS:

```bash
curl -I https://example.com
```

## Как менять баланс

Бэкенд:
- награды действий: `backend/app/services/game.py` (`ACTION_REWARDS`)
- эффекты действий по статам: `backend/app/services/simulation.py`
- формула уровней и множитель интеллекта: `backend/app/services/economy.py`
- формула цен магазина: `backend/app/services/shop.py`

## Как добавить новые стадии

1. Добавить стадию в `backend/app/services/economy.py` (`stage_by_level`, `stage_title`).
2. Расширить перечисление стадии в `backend/app/schemas.py`.
3. Добавить масштаб/визуал в `frontend/src/components/Unicorn3D.tsx`.
4. Обновить UI-лейблы стадии во фронтенде (если требуется).

## Как добавить новые состояния AI

1. Бэкенд-логика: `backend/app/services/pet_ai.py`.
2. Фронтенд-логика (клиентское отражение): `frontend/src/game/состоянияПитомца.ts`.
3. Отображение состояния в UI: `frontend/src/App.tsx`.

## Как масштабировать систему

- Горизонтально:
  - вынести FastAPI и Celery в отдельные сервисы;
  - масштабировать воркеры Celery;
  - использовать managed Postgres/Redis.
- По данным:
  - добавить индексы на историю/инвентарь по `user_id`;
  - хранить агрегаты отчётов отдельно от событий.
- По клиенту:
  - разделять тяжёлые экраны через lazy-load;
  - держать лимит FX и контролировать DPR (в проекте уже ограничен до 2).

## Замена 3D-модели дракончика

Файлы модели:
- `frontend/public/assets/models/unicorn.glb`
- `frontend/public/assets/models/unicorn_placeholder.glb`

Если модели нет, используется процедурный fallback-питомец без падения приложения.

Поддерживаемые анимационные клипы (рекомендуемо):
- `Idle`
- `Eat`
- `Wash` / `HappySplash`
- `Play`
- `Heal`
- `Chat`
- `Evolve` (опционально)

## BotFather: подключение WebApp

1. Откройте `@BotFather` и выберите вашего бота.
2. `Bot Settings` -> `Menu Button` -> `Configure menu button`.
3. Укажите:
   - Текст кнопки: `Играть`
   - URL: `https://example.com`
4. Откройте бота на телефоне и нажмите кнопку меню `Играть`.

## Тесты

Из каталога `backend`:

```powershell
.\.venv\Scripts\python -m pytest tests -q
```

Покрыто минимум:
- `apply_time_decay` с мягкой деградацией
- эффекты действий
- базовая логика экономики и AI
- тесты деградации для разных периодов отсутствия

Запуск отдельных тестов:

```powershell
# Тесты мягкой деградации
python tests/test_gentle_decay.py
```

## Система сохранения прогресса

### Что сохраняется автоматически

Все данные сохраняются после каждого действия:
- ✅ Уровень, опыт, ресурсы (монеты, интеллект, кристаллы)
- ✅ Состояние питомца (голод, энергия, чистота, настроение, здоровье)
- ✅ Инвентарь и экипировка
- ✅ История действий (последние 30 событий)
- ✅ Прогресс ежедневных заданий

### Мягкая деградация

При возврате в игру питомец деградирует по адаптивной формуле:
- **0-6 часов**: Нормальная скорость (100%)
- **6-24 часа**: Замедленная (50%)
- **>24 часов**: Минимальная (25%)

Это означает, что даже после длительного отсутствия питомец будет в приемлемом состоянии.

### Что НЕ деградирует

Эти данные **никогда** не теряются:
- Уровень и опыт
- Монеты, интеллект, кристаллы
- Инвентарь и экипировка
- История и достижения

Подробнее: [CHANGELOG_SAVE_SYSTEM.md](CHANGELOG_SAVE_SYSTEM.md)
