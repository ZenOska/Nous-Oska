# Development setup

## Tools

Use Git, Node.js 24 LTS, pnpm 12.9.1, and a code editor (VS Code is the team recommendation). Node.js is pinned to the 24.x LTS line in `.nvmrc`, `package.json`, and CI. Reevaluate the pin when a newer LTS is available and update all three together.

```bash
git --version
node --version
pnpm --version
```

The root `package.json` pins pnpm through its `packageManager` field and provides lint, type-check, test, and build scripts. The Phase 0 build compiles shared TypeScript foundation code; the Electron + Vite + React application will still be initialized together in Phase 1.

## Clone

```bash
git clone https://github.com/ZenOska/Nous-Oska.git
cd Nous-Oska
corepack pnpm install
```

## Checks

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Phase 1 will add the Electron + Vite + React application as one integrated setup. Do not initialize a separate Vite renderer first.
