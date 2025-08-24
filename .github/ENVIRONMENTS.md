GitHub Environments and protected deployments
=============================================

This project uses a protected environment named `production` to guard the manual
migration job in `.github/workflows/migrate.yml`.

Why
---
Using a protected environment allows you to require manual approvals before running
destructive or irreversible actions (like applying database migrations) from GitHub
Actions.

How to create and configure the `production` environment
--------------------------------------------------------

1. Go to your repository on GitHub.
2. Click Settings -> Environments (left sidebar).
3. Click "New environment" and enter the name: `production`.
4. After creating it, you can add "Required reviewers". Add one or more GitHub users or teams
   who must approve workflow runs that target this environment.
5. Optionally configure required wait timer or deployment branches.

Using the migrations workflow
----------------------------

- The workflow `Manual migrations` (`.github/workflows/migrate.yml`) has two inputs:
  - `dry_run` (default `true`) — lists migrations without applying them.
  - `apply` (default `false`) — when set to `true`, the workflow will run the protected
    job that actually applies migrations and will require the configured approvers to
    approve the run.

Example: run a dry-run from Actions UI first, then run apply=true and request approval.

Tip: ensure team members who will approve have the appropriate repository permissions.
