# Broadlink to UFO-R11 IR Code Converter

[![Deploy to GitHub Pages](https://github.com/dzerik/Broadlink-UFO-R11/actions/workflows/deploy.yml/badge.svg)](https://github.com/dzerik/Broadlink-UFO-R11/actions/workflows/deploy.yml)
[![Tests](https://github.com/dzerik/Broadlink-UFO-R11/actions/workflows/test.yml/badge.svg)](https://github.com/dzerik/Broadlink-UFO-R11/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

> **Based on the original [broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11) by arkservertools.**
>
> IR codes for conversion can be found at [SmartIR codes repository](https://github.com/smartHomeHub/SmartIR/tree/master/codes).

---

A client-side web application to convert IR codes from **Broadlink Base64** format to **UFO-R11 MQTT** format for [MOES UFO-R11](https://www.moeshouse.com/) devices used with [SmartIR](https://github.com/smartHomeHub/SmartIR) addon in [Home Assistant](https://www.home-assistant.io/).

> **Note:** While primarily designed for MOES UFO-R11, this converter may also work with other Tuya-based IR blasters that use the same Tuya IR stream protocol (e.g., Zigbee or Wi-Fi IR remotes with Tuya firmware).

**All conversion runs entirely in the browser — no backend required.**

## Demo

**[Live Demo on GitHub Pages](https://dzerik.github.io/Broadlink-UFO-R11/)**

## Features

- Two-panel JSON editor with syntax highlighting
- Single IR code conversion
- File upload (SmartIR JSON)
- 4 compression levels (LZ77-like Tuya Stream)
- `ir_code_to_send` wrapper option for MQTT payloads
- English / Russian interface

## Compression Levels

| Level | Name | Description |
|-------|------|-------------|
| 0 | NONE | No compression |
| 1 | FAST | Greedy, first match |
| 2 | BALANCED | Greedy, best match (default) |
| 3 | OPTIMAL | Dynamic programming (smallest output) |

## Architecture

```
Broadlink Base64 → hex → timings → uint16 LE → Tuya compress → Base64
```

All conversion logic is implemented in TypeScript and runs client-side:

| Module | Description |
|--------|-------------|
| **IRConverter** | Conversion facade |
| **BroadlinkDecoder** | Broadlink format decoder |
| **TuyaEncoder** | UFO-R11 format encoder |
| **TuyaCompressor** | LZ77-like Tuya Stream compression |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

### Installation

```bash
git clone https://github.com/dzerik/Broadlink-UFO-R11.git
cd Broadlink-UFO-R11/frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
npm test
```

### Build

```bash
npm run build
# Static output in frontend/out/
```

## Deployment

The app auto-deploys to GitHub Pages on push to `main` via [GitHub Actions](.github/workflows/deploy.yml).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Credits

- Original project: [arkservertools/broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11)
- IR codes: [SmartIR](https://github.com/smartHomeHub/SmartIR)
