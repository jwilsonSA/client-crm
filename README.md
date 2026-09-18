# Gugu's Team CRM

A small React and Firebase CRM for managing clients, deliverables, meeting reminders, action items, and team members.

## Features

- Email/password authentication with Firebase Authentication
- Client and tier management
- Deliverables and meeting reminders
- Action item tracking with due dates and assignees
- Team member directory
- Offline-aware Firestore persistence
- Responsive interface for desktop and mobile

## Tech stack

- React
- Vite
- Firebase Authentication and Cloud Firestore
- Tailwind CSS
- Lucide React

## Local development

### Requirements

- Node.js 20 or later
- A Firebase project with Email/Password Authentication and Cloud Firestore enabled

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Fill in the Firebase web-app values in `.env.local`.

4. Set `VITE_DEMO_MODE=false` in `.env.local` to enable the Firebase-backed application. Leave it as `true` to run the safe public demo page without Firebase.

5. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL shown by Vite.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Firebase deployment

Authenticate with the Firebase CLI, select your Firebase project, and create a production build:

```bash
npm run build
firebase deploy
```

The repository includes [`firebase.json`](./firebase.json) and [`firestore.rules`](./firestore.rules). The default Firestore rules allow access only to authenticated users. Review and tighten those rules before using this application with sensitive or regulated data.

## Public demo

The default configuration runs a read-only demo page with fictional clients and action items. This mode does not initialize Firebase and does not require credentials. It is intended for public repository previews.

## Security notes

- Never commit `.env.local` or any other environment file containing project-specific values.
- Firebase web configuration values identify a project but are not authorization credentials. Authentication and Firestore Security Rules are the controls that protect data.
- The included rules are a starting point for a small authenticated team app. Add role- and user-based access controls before exposing production customer data.

## License

This project is licensed under the MIT License. See [`LICENSE`](./LICENSE).
