# Cron Builder

Visual cron expression builder with next execution preview, common presets and human-readable descriptions. Everything runs client-side -- no data is sent to any server.

**[Live Demo](https://gmowses.github.io/cron-builder)**

## Features

- **Visual builder** -- configure each field (minute, hour, day, month, weekday) via mode toggles: every, specific, range, or step
- **Human-readable descriptions** -- powered by [cronstrue](https://github.com/bradymholt/cronstrue)
- **Next 5 executions** -- calculated client-side by iterating forward from the current minute
- **Expression validation** -- real-time syntax checking with visual feedback
- **13 common presets** -- one-click presets from "every minute" to "every year"
- **Copy to clipboard** -- one-click copy with confirmation
- **Dark / Light mode** -- toggle or auto-detect from system preference
- **i18n** -- English and Portuguese (auto-detect from browser language)
- **Zero backend** -- pure client-side, works offline

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- cronstrue
- Lucide icons

## Getting Started

```bash
git clone https://github.com/gmowses/cron-builder.git
cd cron-builder
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build

```bash
npm run build
```

Static files are generated in `dist/`.

## Cron Expression Format

```
* * * * *
| | | | |
| | | | +-- Day of week  (0-7, 0 and 7 = Sunday)
| | | +---- Month        (1-12)
| | +------ Day of month (1-31)
| +-------- Hour         (0-23)
+---------- Minute       (0-59)
```

Supported syntax per field:

| Pattern | Meaning |
|---------|---------|
| `*` | Every value |
| `5` | Specific value |
| `1,3,5` | List of values |
| `1-5` | Range |
| `*/5` | Every N (step from 0) |
| `2/5` | Every N starting at value |

## License

[MIT](LICENSE) -- Gabriel Mowses
