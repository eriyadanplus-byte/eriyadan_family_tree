# Eriyadan's Legacy - Family Tree Visualizer

A premium, mobile-first multi-generational family tree application with Apple-inspired glassmorphism design.

## Features

- 🌳 Interactive 8+ generation family tree visualization
- 📱 Mobile-first responsive design
- 🎨 Apple-inspired glassmorphism UI
- ✨ GSAP + Framer Motion animations
- 🔐 Role-based access control (Admin, Editor, Contributor, Viewer)
- 📊 Admin dashboard with Excel export
- ☁️ Cloudflare D1 + Pages deployment (free)

## Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Styling:** Tailwind CSS + Glassmorphism
- **Animations:** GSAP + Framer Motion
- **Database:** Cloudflare D1 (SQLite at edge)
- **Deployment:** Cloudflare Pages (free)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx       # Landing page
│   ├── globals.css    # Global styles
│   ├── tree/
│   │   └── page.tsx  # Tree visualization
│   ├── admin/
│   │   └── page.tsx  # Admin panel
│   └── profile/
│       └── page.tsx  # Profile page
├── db/
│   └── schema.sql    # D1 database schema
└── package.json
```

## Design System

- **Colors:** Deep space (#0a0a0f), Purple (#7b61ff), Emerald (#41eec2)
- **Typography:** Manrope (headings), Inter (body)
- **Effects:** Glassmorphism, glow effects, parallax depth

## Cloudflare Deployment

```bash
# Deploy to Cloudflare Pages
npm run build
wrangler pages deploy
```

## License

MIT