# Nous

> A modern, open-source desktop web browser designed around speed, privacy, customization, and extensibility.

[![CI](https://github.com/ZenOska/Nous-Oska/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenOska/Nous-Oska/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

## About

Nous is the browser application around an existing, mature web engine. We are not building a rendering engine. The initial desktop application will use Electron and Chromium, with a React and TypeScript interface.

## Vision

Nous aims to make a fast, private, customizable, and extensible desktop browsing experience. Privacy and security are architectural requirements from the start, especially when handling untrusted websites.

## Features

Nous is in Phase 0: foundation and architecture. Browser features are planned, not implemented yet. See the [roadmap](docs/roadmap/roadmap.md).

## Architecture

The planned application separates privileged native work from the web-facing user interface:

```text
Nous
├── Electron main process  Windows, sessions, downloads, security
├── Preload                Small, validated API bridge
└── Renderer               React UI: toolbar, tabs, settings
          │
         IPC
          │
       Chromium ── Internet
```

The main process owns privileged operations. The preload exposes only deliberate, validated capabilities. The renderer contains the React interface. Read [the architecture overview](docs/architecture/overview.md) and [security principles](docs/architecture/security.md).

## Technology

| Area                                 | Choice                |
| ------------------------------------ | --------------------- |
| Desktop framework and browser engine | Electron and Chromium |
| Frontend and language                | React and TypeScript  |
| UI styling and build                 | Tailwind CSS and Vite |
| Package manager and state            | pnpm and Zustand      |
| Unit and end-to-end testing          | Vitest and Playwright |
| Linting and formatting               | ESLint and Prettier   |
| CI                                   | GitHub Actions        |

The Phase 0 TypeScript tooling and CI are configured. The Electron + Vite + React application will be initialized together in Phase 1; this repository is not yet a runnable browser.

## Getting Started

There is no browser application to launch yet. To install the repository tooling, clone the repository and read the [development setup](docs/development/setup.md).

```bash
git clone https://github.com/ZenOska/Nous-Oska.git
cd Nous-Oska
corepack pnpm install
```

## Development

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [development guide](docs/development/setup.md) for branch naming, commits, reviews, and the planned toolchain.

## Roadmap

See [the Nous roadmap](docs/roadmap/roadmap.md) for phases 0–9.

## Contributing

Issues and pull requests are welcome. Please follow [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately using GitHub's Security Advisories for this repository when enabled. See [SECURITY.md](SECURITY.md) for the policy and planned Electron security boundaries.

## License

Nous is licensed under the [Apache License 2.0](LICENSE).
