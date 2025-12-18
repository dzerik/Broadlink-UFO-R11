# Деплой на Vercel + Render

Инструкция по публикации приложения в интернете с использованием бесплатных тарифов.

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐
│     Vercel      │     │     Render      │
│  (Frontend)     │────▶│   (Backend)     │
│   Next.js 16    │     │    FastAPI      │
│   бесплатно     │     │   бесплатно     │
└─────────────────┘     └─────────────────┘
```

## Шаг 1: Деплой бэкенда на Render

### 1.1 Создайте аккаунт
Перейдите на [render.com](https://render.com) и зарегистрируйтесь через GitHub.

### 1.2 Создайте Web Service

1. Нажмите **New** → **Web Service**
2. Подключите ваш GitHub репозиторий
3. Настройте сервис:

| Параметр | Значение |
|----------|----------|
| **Name** | `btu-backend` |
| **Region** | Frankfurt (EU Central) или ближайший |
| **Branch** | `main` |
| **Root Directory** | *(оставить пустым)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install ".[web]"` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### 1.3 Настройте переменные окружения

В разделе **Environment** добавьте:

| Key | Value |
|-----|-------|
| `BTU_DEBUG` | `false` |
| `BTU_CORS_ORIGINS` | `["https://YOUR-APP.vercel.app"]` |
| `PYTHON_VERSION` | `3.12.0` |

> ⚠️ Замените `YOUR-APP` на имя вашего Vercel приложения после деплоя фронтенда.

### 1.4 Запустите деплой

Нажмите **Create Web Service**. Первый деплой займёт 3-5 минут.

После деплоя запомните URL бэкенда: `https://btu-backend.onrender.com`

---

## Шаг 2: Деплой фронтенда на Vercel

### 2.1 Обновите vercel.json

Отредактируйте `frontend/vercel.json` и замените URL бэкенда:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://btu-backend.onrender.com/api/:path*"
    }
  ]
}
```

### 2.2 Создайте аккаунт Vercel

Перейдите на [vercel.com](https://vercel.com) и зарегистрируйтесь через GitHub.

### 2.3 Импортируйте проект

1. Нажмите **Add New** → **Project**
2. Выберите ваш GitHub репозиторий
3. Настройте проект:

| Параметр | Значение |
|----------|----------|
| **Framework Preset** | `Next.js` |
| **Root Directory** | `frontend` |
| **Build Command** | *(оставить по умолчанию)* |
| **Output Directory** | *(оставить по умолчанию)* |

### 2.4 Запустите деплой

Нажмите **Deploy**. Деплой займёт 1-2 минуты.

После деплоя вы получите URL: `https://your-app.vercel.app`

---

## Шаг 3: Обновите CORS на Render

Вернитесь в Render Dashboard и обновите переменную окружения:

```
BTU_CORS_ORIGINS=["https://your-app.vercel.app"]
```

Render автоматически перезапустит сервис.

---

## Проверка

1. Откройте ваш Vercel URL: `https://your-app.vercel.app`
2. Попробуйте конвертировать IR код
3. Если видите ошибку — проверьте CORS настройки

### Проверка бэкенда напрямую

```bash
curl https://btu-backend.onrender.com/api/health
```

Ожидаемый ответ:
```json
{"status": "healthy", "version": "1.0.0"}
```

---

## Ограничения бесплатного тарифа

### Render Free Tier
- ⚠️ **Cold starts**: После 15 минут неактивности сервис засыпает. Первый запрос после сна занимает ~30-50 секунд.
- 750 часов работы в месяц
- 512 MB RAM

### Vercel Hobby Plan
- 100 GB bandwidth/месяц
- 6000 build минут/месяц
- ❌ Запрещено коммерческое использование

---

## Устранение проблем

### CORS ошибки

Убедитесь, что `BTU_CORS_ORIGINS` на Render содержит точный URL вашего Vercel приложения (с `https://`).

### 502 Bad Gateway

Бэкенд ещё не проснулся. Подождите 30-60 секунд и повторите запрос.

### Build failed на Vercel

Проверьте, что `Root Directory` установлен в `frontend`.

---

## Альтернативный деплой через CLI

### Render CLI

```bash
# Установка
brew install render

# Деплой из render.yaml
render blueprint launch
```

### Vercel CLI

```bash
# Установка
npm i -g vercel

# Деплой
cd frontend
vercel --prod
```

---

## Обновление приложения

После пуша в `main`:
- **Vercel**: автоматически пересобирает фронтенд
- **Render**: автоматически пересобирает бэкенд

Для ручного редеплоя используйте Dashboard соответствующей платформы.
