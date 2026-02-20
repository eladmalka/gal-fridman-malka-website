# Replit.md

## Overview

This is a Hebrew (RTL) landing page for **גל פרידמן מלכה** (Gal Fridman Malka), a numerologist and couples coach. The project consists of a public-facing marketing landing page with lead capture, a WhatsApp integration for direct messaging, and an admin panel for managing images and content. The site uses an "antique pink" / dusty rose visual aesthetic with a premium, feminine design language.

Key features:
- **Public landing page** with Hero, Trust/Testimonials, Services, Benefits, Gallery, Contact form, and Footer sections — all in Hebrew RTL
- **Admin panel** (`/admin`) for managing image slots, gallery images, and viewing leads
- **Lead capture form** that sends emails via Gmail/Nodemailer to `galfridman21@gmail.com`
- **WhatsApp integration** with a floating button and hero CTA linking to `+972523491792`
- **Image slot system** allowing replacement of any image on the landing page through the admin panel

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router) — two routes: `/` (Home) and `/admin`
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) with CSS custom properties for theming. Uses shadcn/ui component library (new-york style) built on Radix UI primitives
- **State Management**: TanStack React Query for server state; React Context (`ContentProvider`) for content/image slot state
- **Build Tool**: Vite with React plugin
- **Fonts**: Google Fonts — Assistant (body) and Heebo (headings), both support Hebrew
- **RTL Support**: Full RTL via `dir="rtl"` on the HTML element and `lang="he"`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript, compiled with TSX (dev) and esbuild (production)
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **File Uploads**: Multer with disk storage in `./uploads/` directory, 10MB limit, image-only filter
- **Email**: Nodemailer with Gmail SMTP (requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables)
- **Dev Server**: Vite dev server integrated as Express middleware via `server/vite.ts`
- **Production**: Static files served from `dist/public` after Vite build

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Connection**: `pg` Pool using `DATABASE_URL` environment variable
- **Schema** (in `shared/schema.ts`):
  - `site_content` — key-value store for editable text content
  - `image_slots` — fixed image positions (hero, profile, benefits, etc.) with file path, alt text, and aspect ratio
  - `gallery_images` — ordered gallery items with file path, alt text, and sort order
  - `leads` — form submissions (name, phone, email, status, goals, seen flag for read/unread tracking)
  - `admin_settings` — key-value store for admin config (e.g., hashed password)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

### Authentication
- Simple password-based admin auth using bcryptjs (stored in `admin_settings` table)
- No session management framework visible — likely basic password check per request

### Content Management
- **Image Slots System**: Fixed slot keys (HERO_BACKGROUND, PROFILE_IMAGE, BENEFITS_IMAGE, GALLERY_1..N) mapped to database records
- **Content Context**: React context that fetches content and image data from the API, with fallback defaults for all text and images
- Landing page renders images by slot key, so replacing an image in admin updates it immediately

### Build Process
- **Development**: `tsx server/index.ts` runs the Express server with Vite dev middleware
- **Production Build**: Custom `script/build.ts` that runs Vite build for client, then esbuild for server (bundling select dependencies for faster cold starts)
- **Output**: `dist/public/` (client assets) and `dist/index.cjs` (server bundle)

### Key Design Decisions
1. **Monorepo structure** (`client/`, `server/`, `shared/`): Shared schema between frontend and backend ensures type safety for API contracts
2. **Drizzle ORM over Prisma**: Chosen for lighter weight and better SQL control; schema defined in TypeScript with Zod validation via `drizzle-zod`
3. **shadcn/ui components**: Copy-pasted UI primitives in `client/src/components/ui/` — allows full customization without dependency lock-in
4. **Image uploads stored on disk** (`./uploads/`): Simple approach; images served directly via Express static middleware. No CDN or cloud storage currently integrated
5. **Content context with defaults**: All landing page text has Hebrew defaults hardcoded in the frontend, with database overrides fetched at runtime

## External Dependencies

### Required Services
- **PostgreSQL Database**: Connected via `DATABASE_URL` environment variable. Used by Drizzle ORM for all data persistence
- **Gmail SMTP**: For sending lead notification emails. Requires:
  - `GMAIL_USER` — Gmail address
  - `GMAIL_APP_PASSWORD` — Gmail app-specific password
  - Destination hardcoded to `galfridman21@gmail.com`

### Third-Party Integrations
- **WhatsApp**: Direct link integration via `wa.me` URLs with pre-filled Hebrew message (URL-encoded). No API integration — just clickable links to phone number `+972523491792`

### Key NPM Dependencies
- **Server**: Express, Drizzle ORM, pg, multer, nodemailer, bcryptjs, zod
- **Client**: React, Wouter, TanStack React Query, React Hook Form, Radix UI (full suite), Tailwind CSS, class-variance-authority, date-fns
- **Build**: Vite, esbuild, TSX, Drizzle Kit

### Environment Variables Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GMAIL_USER` | Gmail sender address for lead notifications |
| `GMAIL_APP_PASSWORD` | Gmail app password for SMTP auth |