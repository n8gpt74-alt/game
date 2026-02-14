# Как запушить изменения в GitHub

## Коммит уже создан! ✅

Коммит с визуальными эффектами уже готов:
```
feat: Add comprehensive visual effects system
- 21 файлов изменено
- 4815 строк добавлено
```

## Теперь нужно только запушить

### Способ 1: VS Code (РЕКОМЕНДУЮ)

1. Открой проект в VS Code
2. Нажми `Ctrl+Shift+G` (Source Control)
3. Нажми кнопку **"Sync Changes"** или **"Push"**
4. Войди в GitHub когда попросит
5. Готово!

### Способ 2: GitHub Desktop

1. Скачай [GitHub Desktop](https://desktop.github.com/)
2. File → Add Local Repository → выбери папку проекта
3. Войди в GitHub аккаунт
4. Нажми **"Push origin"**
5. Готово!

### Способ 3: Командная строка с токеном

1. Создай Personal Access Token на GitHub:
   - Зайди на https://github.com/settings/tokens
   - Generate new token (classic)
   - Выбери scope: `repo` (полный доступ к репозиториям)
   - Скопируй токен (он показывается только один раз!)

2. Запусти в PowerShell:
```powershell
git push https://YOUR_TOKEN@github.com/n8gpt74-alt/game.git main
```

Замени `YOUR_TOKEN` на свой токен.

### Способ 4: SSH ключ

Если настроен SSH ключ:
```powershell
git remote set-url origin git@github.com:n8gpt74-alt/game.git
git push origin main
```

## После успешного push

1. Зайди на https://github.com/n8gpt74-alt/game
2. Увидишь новый коммит
3. Vercel автоматически начнет деплой (займет 2-3 минуты)
4. Проверь статус деплоя на https://vercel.com/dashboard
5. После деплоя визуальные эффекты будут работать на production!

## Что будет задеплоено

✅ Система день/ночь (24 минуты цикл)
✅ Погода (дождь/снег)
✅ Анимации окружения (деревья, трава, бабочки, листья)
✅ Эффекты частиц для всех действий
✅ Динамическое освещение
✅ Автоматическая оптимизация производительности

## Если возникли проблемы

Напиши мне, помогу разобраться!
