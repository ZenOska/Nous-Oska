# Contributing to Nous

Thanks for helping build Nous. By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

Check existing issues and pull requests. For a substantial change, open an issue first so the team can agree on scope. Use the task template for implementation work.

## Team workflow

```text
Clone → create feature branch → implement → validate → push → pull request → review → merge
```

1. Clone the shared repository and update `develop`.
2. Create a branch from `develop` using `feature/<name>`, `fix/<name>`, `refactor/<name>`, or `docs/<name>`.
3. Make a focused change and add or update documentation and tests when applicable.
4. Run the checks applicable to your change and describe their results in the pull request.
5. Push your branch and open a pull request against `develop`.
6. Address review feedback. At least one approval and passing CI are expected before merge.
7. Release changes from `develop` to `main` through a reviewed pull request.

Do not push directly to `main`. See the [Git workflow](docs/development/git-workflow.md).

## Development setup

Use Git, Node.js 24 LTS, and pnpm 12.9.1. Run `corepack pnpm install` to install the Phase 0 tooling and use the lint, type-check, test, and build scripts before opening a pull request. The Electron + Vite + React application is still planned for Phase 1. See [development setup](docs/development/setup.md).

## Commits

Use Conventional Commits and keep changes small and focused. Examples: `feat: add browser shell`, `fix: prevent invalid navigation`, `docs: add architecture overview`, `chore: configure eslint`.

## Pull requests

- Use the pull request template.
- Link the issue the change addresses.
- Explain the change and its user or project impact.
- Include validation performed and note anything still outstanding.
- Request review from a maintainer and respond to review comments.
- Keep each pull request focused; do not merge until required CI checks pass.

## Issues and labels

Use bug reports for defects, feature requests for product proposals, and tasks for scoped implementation work. Suggested label names are listed in [issue labels](docs/development/issue-labels.md); repository maintainers apply these in GitHub.
