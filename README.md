# Live Palette AI

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mtmarctonis-projects/live-palette-ai)

## Overview

**Live Palette AI** is a modern web application for generating, previewing, and collaborating on color palettes in real time. Built for designers, developers, and creative teams, it streamlines the workflow for creating, sharing, and managing color themes.

---

## Features

- 🎨 **AI-powered palette generation**: Create beautiful color palettes from keywords or moods using AI.
- 👀 **Live preview**: Instantly apply palettes to UI components and see results in real time.
- 🤝 **Real-time collaboration**: Work together with live cursors, shared editing, and version history.
- 🔒 **Authentication**: Secure user accounts and personalized palette management.
- 🕒 **Version history**: Track changes and restore previous palettes.
- 📦 **Export options**: Download palettes in CSS, SCSS, Adobe formats, and more.

---

## Tech Stack

- [Next.js](https://nextjs.org/) – React-based framework
- [TypeScript](https://www.typescriptlang.org/) – Type-safe development
- [Supabase](https://supabase.com/) – Auth, database, and real-time collaboration
- [PostCSS](https://postcss.org/) – CSS processing
- [Vercel](https://vercel.com/) – Deployment platform
- [pnpm](https://pnpm.io/) – Fast package manager

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mtmarctoni/live-palette-ai.git
cd live-palette-ai
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

- Copy `.env.example` to `.env.local`:

  ```bash
  cp .env.example .env.local
  ```

- Fill in your Supabase credentials and any other required settings.

### 4. Run the development server

```bash
pnpm run dev
```

- Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy

- Push your changes to GitHub and connect your repo to [Vercel](https://vercel.com/) for automatic deployments.

---

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, new features, or improvements.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact & Support

- [Issues](https://github.com/mtmarctoni/live-palette-ai/issues) – For bug reports and feature requests
- [Email](mailto:marctonimas@outlook.es) – For direct contact
