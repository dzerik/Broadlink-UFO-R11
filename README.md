# Broadlink to UFO-R11 IR Code Converter

> **This project is based on the original [broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11) by arkservertools.**
>
> IR codes for conversion can be found at [SmartIR codes repository](https://github.com/smartHomeHub/SmartIR/tree/master/codes).

---

**[Русская версия](README.ru.md)**

---

A web application and CLI tool to convert IR codes from Broadlink Base64 format to UFO-R11 MQTT format for MOES UFO-R11 devices used with SmartIR addon in Home Assistant.

## Features

- **Web UI** with two-panel JSON editor
- **REST API** for integration
- **CLI** for command-line usage
- JSON syntax highlighting
- 4 compression levels
- `ir_code_to_send` wrapper option
- English/Russian interface

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/arkservertools/broadlinktoUFOR11.git
cd broadlinktoUFOR11
docker-compose up -d
```

Open http://localhost:3000 in your browser.

### CLI Usage

```bash
# Install
pip install .

# Convert file
python btu.py input.json -o output.json

# With verbose logging
python btu.py -v input.json -o output.json

# Maximum compression
python btu.py -c 3 input.json -o output.json
```

### CLI Options

```
python btu.py [-h] [-o OUTPUT] [-v] [-q] [-c {0,1,2,3}] [--validate-only] input

Arguments:
  input                 Input SmartIR JSON file

Options:
  -h, --help            Show help
  -o, --output OUTPUT   Output file (default: stdout)
  -v, --verbose         Verbose logging (DEBUG)
  -q, --quiet           Quiet mode (errors only)
  -c, --compression     Compression level (0-3, default: 2)
  --validate-only       Only validate input file
```

## Compression Levels

| Level | Name | Description |
|-------|------|-------------|
| 0 | NONE | No compression (maximum size) |
| 1 | FAST | Fast compression (greedy algorithm) |
| 2 | BALANCED | Balance of speed and size (default) |
| 3 | OPTIMAL | Optimal compression (minimum size) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/convert` | Convert single IR code |
| POST | `/api/convert/file` | Convert SmartIR JSON file |

### Example API Request

```bash
curl -X POST http://localhost:8000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"command": "JgDKAJKQEzQT..."}'
```

## Architecture

```
Broadlink Base64 → hex → timings → uint16 LE → Tuya compress → Base64
```

### Components

- **IRConverter** — Conversion facade
- **BroadlinkDecoder** — Broadlink format decoder
- **TuyaEncoder** — UFO-R11 format encoder
- **TuyaCompressor** — LZ77-like Tuya Stream compression
- **FastAPI app** — REST API and web server

## Project Structure

```
broadlinktoUFOR11/
├── app/                    # FastAPI application
│   ├── main.py            # API entrypoint
│   ├── routers/           # API routes
│   └── services/          # Business logic
├── frontend/              # Next.js frontend
│   └── src/
│       ├── app/           # Pages
│       ├── components/    # React components
│       └── i18n/          # Internationalization
├── btu.py                 # CLI converter
├── docker-compose.yml     # Docker configuration
├── Dockerfile.backend     # Backend Dockerfile
└── tests/                 # Unit tests
```

## Development

### Requirements

- Python 3.8+
- Node.js 18+

### Backend

```bash
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Testing

```bash
# Run tests
python -m pytest tests/ -v

# With coverage
python -m pytest tests/ --cov=app --cov-report=term-missing
```

## License

MIT License

## Credits

- Original project: [arkservertools/broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11)
- IR codes: [SmartIR](https://github.com/smartHomeHub/SmartIR)
