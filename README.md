# Broadlink to UFO-R11 IR Code Converter

> **Based on the original [broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11) by arkservertools.**
>
> IR codes for conversion can be found at [SmartIR codes repository](https://github.com/smartHomeHub/SmartIR/tree/master/codes).

---

A client-side web application to convert IR codes from Broadlink Base64 format to UFO-R11 MQTT format for MOES UFO-R11 devices used with SmartIR addon in Home Assistant.

**All conversion runs entirely in the browser — no backend required.**

## Features

- Two-panel JSON editor with syntax highlighting
- Single IR code conversion
- File upload (SmartIR JSON)
- 4 compression levels (LZ77-like Tuya Stream)
- `ir_code_to_send` wrapper option
- English/Russian interface
- Hosted on GitHub Pages

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

- **IRConverter** — Conversion facade
- **BroadlinkDecoder** — Broadlink format decoder
- **TuyaEncoder** — UFO-R11 format encoder
- **TuyaCompressor** — LZ77-like Tuya Stream compression

## Development

```bash
cd frontend
npm install
npm run dev
```

### Testing

```bash
cd frontend
npm test
```

### Build

```bash
cd frontend
npm run build
# Static output in frontend/out/
```

## Deployment

The app auto-deploys to GitHub Pages on push to `main` via GitHub Actions.

## License

MIT License

## Credits

- Original project: [arkservertools/broadlinktoUFOR11](https://github.com/arkservertools/broadlinktoUFOR11)
- IR codes: [SmartIR](https://github.com/smartHomeHub/SmartIR)
