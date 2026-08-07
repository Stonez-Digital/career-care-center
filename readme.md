# Career Care Center

Career Care Center is a career-development platform for interns, mentors,
volunteers, administrators, and programme participants. It includes the public
website, authentication, role-based dashboards, applications, events,
mentorship sessions, resources, and administration tools.

The application uses React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Run the application locally

### Requirements

- Git
- Node.js 22.13 or newer, but lower than Node.js 25
- npm (included with Node.js)
- Access to this private GitHub repository
- The project's public Supabase URL and anon key from an authorized maintainer

Check the installed versions:

```powershell
node --version
npm.cmd --version
git --version
```

### 1. Download the repository

```powershell
git clone https://github.com/Onoja217/career-care-center.git
cd career-care-center
```

If the repository is already on your computer, update it instead:

```powershell
git switch main
git pull origin main
```

Do not run `git pull` while you have local changes that you have not committed.

### 2. Install dependencies

Use the lockfile for a reproducible installation:

```powershell
npm.cmd ci
```

`node_modules` is generated locally and must not be committed to GitHub.

### 3. Configure the local environment

Create `.env` from the safe template:

```powershell
Copy-Item .env.example .env
```

Open `.env` in VS Code and replace the placeholders:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_MAINTENANCE_MODE=true
```

Request the correct Supabase values from the project maintainer. Never paste a
database password, personal access token, Paystack secret key, or Supabase
service-role key into `.env` or commit it to GitHub.

Maintenance mode defaults to enabled. With it enabled, public routes show the
maintenance screen while the admin route remains available. Only an authorized
maintainer should set this to `false` after the production quality gate passes:

```env
VITE_MAINTENANCE_MODE=false
```

### 4. Start localhost

```powershell
npm.cmd run dev
```

Vite will print a local address, normally:

```text
http://localhost:5173
```

Open that address in a browser. Keep the terminal running while using the app.
Press `Ctrl+C` to stop the local server.

If port 5173 is busy, Vite will display a different port; use the exact address
shown in the terminal.

## Quality checks

Before committing or pushing changes, run:

```powershell
npm.cmd run check
git diff --check
```

`npm.cmd run check` performs the TypeScript check and production build. Both
commands must finish without errors.

To preview the generated production build locally:

```powershell
npm.cmd run preview
```

## Common problems

### PowerShell blocks `npm.ps1`

Use `npm.cmd` as shown throughout this guide instead of `npm`.

### Supabase connection warning

Confirm `.env` exists at the repository root and contains valid
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. Restart the development
server after changing `.env`.

### Dependencies are inconsistent

Remove no project files manually. Run:

```powershell
npm.cmd ci
```

If that fails, send the complete error to the maintainer before using
`npm install` or changing `package-lock.json`.

### The maintenance page appears

This is expected while `VITE_MAINTENANCE_MODE=true`. It is not a local-server
failure.

## Repository safety

- Do not commit `.env`, `node_modules`, `dist`, access tokens, or passwords.
- Create database changes as timestamped files under `supabase/migrations`.
- Do not enable `SUPABASE_MIGRATIONS_READY` without reviewing the migration dry
  run and receiving production approval.
- Do not change production DNS or disable maintenance mode during routine local
  development.

## Main commands

```powershell
npm.cmd run dev       # Start localhost
npm.cmd run typecheck # Check TypeScript
npm.cmd run build     # Create production build
npm.cmd run check     # Typecheck and build
npm.cmd run preview   # Preview production build
```

## Maintainer

Onoja Monday Ojonugba

This is a private repository for Career Care Center internal development and
deployment.
