# Git workflow

## Branches

- `main` contains stable releases. Work reaches it through reviewed pull requests; do not push directly.
- `develop` is the integration branch for completed feature work.
- Create short-lived branches from `develop`: `feature/<name>`, `fix/<name>`, `refactor/<name>`, or `docs/<name>`.

Example names: `feature/electron-shell`, `fix/invalid-navigation`, `docs/architecture-overview`.

```bash
git checkout develop
git pull
git checkout -b feature/electron-shell
```

Push the branch and open a pull request against `develop`. Release pull requests go from `develop` to `main`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add browser shell
fix: prevent invalid navigation
refactor: extract tab controller
docs: add architecture overview
test: add navigation tests
chore: configure eslint
```

Keep commits small and focused. Avoid messages such as `update stuff` or `final changes`.

## Reviews

Pull requests should explain the change, link related issues, and include relevant validation. Request at least one review and resolve review comments before merging. GitHub branch protection should enforce reviews and passing CI on `main`, and later on `develop`.
