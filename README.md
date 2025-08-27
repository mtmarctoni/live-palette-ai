# Live Palette AI

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mtmarctonis-projects/live-palette-ai)

## What is this repo?

This repository contains the source code for **Live Palette AI**, a web application for generating, previewing, and collaborating on color palettes in real time. It is designed for designers, developers, and teams to streamline the workflow for creating and sharing color themes.

## What is it used for?

- Generate AI-powered color palettes based on user input or preferences.
- Preview palettes and apply them to UI components.
- Collaborate with others in real time, including live cursors and version history.
- Manage authentication and user accounts for secure access.

## Which tools are used?

- **Next.js**: React-based framework for building the web app.
- **TypeScript**: Type-safe development.
- **Supabase**: Backend for authentication and real-time collaboration.
- **PostCSS**: CSS processing.
- **Vercel**: Deployment platform.
- **pnpm**: Package manager for fast and efficient dependency management.

## How can I get started?

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mtmarctoni/live-palette-ai.git
   cd live-palette-ai
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials and other required settings.

4. **Run the development server:**

   ```bash
   pnpm dev
   ```

   - Visit `http://localhost:3000` in your browser.

5. **Deploy:**
   - The app is ready to deploy on Vercel. Push your changes to GitHub and connect your repo to Vercel for automatic deployments.
