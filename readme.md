# Career Care Center

A comprehensive career development platform that empowers students, graduates, mentors, volunteers, and administrators through mentorship, career guidance, events, learning resources, and application management.

The platform provides a secure, modern, and responsive experience powered by React, TypeScript, Vite, Tailwind CSS, and Supabase.

---

## Features

### Public Website

- Responsive landing page
- About CCC
- Programs
- Events
- Success Stories
- Blog
- Volunteer Registration
- Donations
- Contact
- Application Portal
- User Authentication

### User Dashboard

Authenticated users can:

- Manage their profile
- View notifications
- Apply for opportunities
- Register for events
- Track volunteer activities
- Access mentorship resources
- Manage availability
- View assigned schedules
- Access learning resources

### Administration

Administrators can manage platform users, programs, events, applications, volunteers, and platform content from a dedicated admin dashboard.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React
- Recharts

### Backend

- Supabase Authentication
- Supabase Database
- Supabase Storage
- Row Level Security (RLS)

---

## Project Structure

```text
src/
├── components/
├── pages/
│   ├── admin/
│   ├── dashboard/
│   └── ...
├── lib/
├── hooks/
├── contexts/
├── assets/
├── App.tsx
└── main.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <private-repository-url>
cd project
npm install
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Development

Start the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Lint the project:

```bash
npm run lint
```

---

## Security

This project uses:

- Supabase Authentication
- Row Level Security (RLS)
- Protected Routes
- Secure API Access
- Environment Variables for secrets

---

## Deployment

The application is production-ready and can be deployed to platforms such as:

- Vercel
- Netlify
- Cloudflare Pages

with Supabase serving as the backend.

---

## License

This repository is private and intended for internal development and deployment.

All rights reserved.

---

## Maintainer

**Onoja Monday Ojonugba**
