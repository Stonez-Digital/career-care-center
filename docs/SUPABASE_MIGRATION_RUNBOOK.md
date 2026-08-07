# Supabase migration runbook

Production migrations are triggered only when migration-related files reach
`main`. The workflow always links the selected project, compares migration
history, and performs a dry run before any apply step.

## Required GitHub production environment

Create a GitHub environment named `production`, require an approving reviewer,
and add these environment secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

Do not enable automatic application during initial setup. Leave the environment
variable `SUPABASE_MIGRATIONS_READY` unset until the Bolt database has been
claimed and `supabase migration list` has been reviewed.

## Initial reconciliation

1. Claim the Bolt database into the organization's Supabase account.
2. Configure the three protected GitHub environment secrets.
3. Run `Supabase Migration Gate` manually from GitHub Actions.
4. Review the migration-list and dry-run output. It is expected that an older
   Bolt database may contain schema objects without matching migration-history
   rows.
5. Repair only versions proven to be present remotely. Never guess or mark a
   failed migration as applied.
6. Repeat the workflow until the dry run lists only the intended new changes.
7. Add the protected environment variable
   `SUPABASE_MIGRATIONS_READY=true`.

After this one-time baseline, a migration change merged to `main` will run the
same history check and dry run before applying through the protected production
environment.
