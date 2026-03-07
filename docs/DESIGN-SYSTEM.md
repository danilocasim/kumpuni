# Kumpuni Design System — "Kapitbahay Energy"

Design language for the Kumpuni web app: warm, grounded, Filipino, built for mid-range phones and trust.

## Quick reference

- **Fonts**: Plus Jakarta Sans (headings), DM Sans (body), JetBrains Mono (numbers). See `app/layout.tsx` and `tailwind.config.ts`.
- **Colors**: `app/globals.css` (`:root`) and `tailwind.config.ts` theme.extend.colors. Primary: Kumpuni Blue `#1B4A6B`, Action Orange `#E8722A`, Concrete White `#F5F2EE`.
- **Components**: Use classes from `app/globals.css` (@layer components): `btn-primary`, `btn-secondary`, `btn-ghost`, `card-kumpuni`, `input-kumpuni`, `label-kumpuni`, `badge-status` + `badge-asap` / `badge-this-week` / etc., `skeleton`, `animate-in`, `animate-cta-pulse`.
- **Worker/Job cards**: `components/WorkerCard.tsx` (supports `href`, `onClick`, or both). Use design tokens for borders, shadows, and status accents.

## Typography

- Body: 15px min (DM Sans). Labels/captions: 13px. Headlines: 22–28px (Plus Jakarta Sans). Button text: 16px bold, uppercase for primary CTAs.
- Use `font-heading` for headlines, `font-sans` (default) for body, `font-mono` for rates and counts.

## Do not use

Inter, Roboto, Arial, Poppins, purple/blue gradients, pill-shaped buttons (use `rounded-kumpuni-sm` 6px), placeholder-only labels, or English-only dummy content (use Taglish).

## Performance

- Tailwind purge enabled. Lucide icons: import only what you need. Google Fonts loaded via next/font (Plus Jakarta 700/800, DM Sans 400/500). Images: Supabase Storage with `?width=200` for thumbnails, `loading="lazy"` below fold.
