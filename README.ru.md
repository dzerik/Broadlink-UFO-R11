# Broadlink to UFO-R11 Конвертер ИК-кодов

> **Этот проект основан на оригинальном [broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11) от arkservertools.**
>
> ИК-коды для конвертации можно найти в [репозитории SmartIR](https://github.com/smartHomeHub/SmartIR/tree/master/codes).

---

**[English version](README.md)**

---

Веб-приложение и CLI-инструмент для конвертации ИК-кодов из формата Broadlink Base64 в формат MQTT UFO-R11 для устройств MOES UFO-R11, используемых с аддоном SmartIR в Home Assistant.

## Возможности

- **Веб-интерфейс** с двухпанельным JSON-редактором
- **REST API** для интеграции
- **CLI** для командной строки
- Подсветка синтаксиса JSON
- 4 уровня сжатия
- Опция обёртки `ir_code_to_send`
- Русский/английский интерфейс

## Быстрый старт

### Docker (Рекомендуется)

```bash
git clone https://github.com/arkservertools/broadlinktoUFOR11.git
cd broadlinktoUFOR11
docker-compose up -d
```

Откройте http://localhost:3000 в браузере.

### Использование CLI

```bash
# Установка
pip install .

# Конвертация файла
python btu.py input.json -o output.json

# С подробным логированием
python btu.py -v input.json -o output.json

# Максимальное сжатие
python btu.py -c 3 input.json -o output.json
```

### Параметры CLI

```
python btu.py [-h] [-o OUTPUT] [-v] [-q] [-c {0,1,2,3}] [--validate-only] input

Аргументы:
  input                 Входной JSON файл SmartIR

Опции:
  -h, --help            Показать справку
  -o, --output OUTPUT   Выходной файл (по умолчанию stdout)
  -v, --verbose         Подробное логирование (DEBUG)
  -q, --quiet           Тихий режим (только ошибки)
  -c, --compression     Уровень сжатия (0-3, по умолчанию 2)
  --validate-only       Только проверить входной файл
```

## Уровни сжатия

| Уровень | Название | Описание |
|---------|----------|----------|
| 0 | NONE | Без сжатия (максимальный размер) |
| 1 | FAST | Быстрое сжатие (жадный алгоритм) |
| 2 | BALANCED | Баланс скорости и размера (по умолчанию) |
| 3 | OPTIMAL | Оптимальное сжатие (минимальный размер) |

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/health` | Проверка состояния |
| POST | `/api/convert` | Конвертация одного ИК-кода |
| POST | `/api/convert/file` | Конвертация SmartIR JSON файла |

### Пример API запроса

```bash
curl -X POST http://localhost:8000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"command": "JgDKAJKQEzQT..."}'
```

## Архитектура

```
Broadlink Base64 → hex → тайминги → uint16 LE → Tuya compress → Base64
```

### Компоненты

- **IRConverter** — Фасад для конвертации
- **BroadlinkDecoder** — Декодер формата Broadlink
- **TuyaEncoder** — Кодировщик формата UFO-R11
- **TuyaCompressor** — LZ77-подобное сжатие Tuya Stream
- **FastAPI app** — REST API и веб-сервер

## Структура проекта

```
broadlinktoUFOR11/
├── app/                    # FastAPI приложение
│   ├── main.py            # Точка входа API
│   ├── routers/           # API маршруты
│   └── services/          # Бизнес-логика
├── frontend/              # Next.js фронтенд
│   └── src/
│       ├── app/           # Страницы
│       ├── components/    # React компоненты
│       └── i18n/          # Интернационализация
├── btu.py                 # CLI конвертер
├── docker-compose.yml     # Конфигурация Docker
├── Dockerfile.backend     # Dockerfile бэкенда
└── tests/                 # Unit-тесты
```

## Разработка

### Требования

- Python 3.8+
- Node.js 18+

### Бэкенд

```bash
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

### Тестирование

```bash
# Запуск тестов
python -m pytest tests/ -v

# С покрытием
python -m pytest tests/ --cov=app --cov-report=term-missing
```

## Лицензия

MIT License

## Благодарности

- Оригинальный проект: [arkservertools/broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11)
- ИК-коды: [SmartIR](https://github.com/smartHomeHub/SmartIR)
