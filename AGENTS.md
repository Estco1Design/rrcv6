# RRC development

Use Node.js 24 LTS and the existing checkout. Cloud tasks are already isolated; do not create worktrees unless requested. Read README.md and ACCOUNTS.md for the real manual-order and account workflows. Preserve local .env files and SQLite data; never print or commit credentials.

Project skills are installed under .agents/skills (sources/revisions: docs/skills.md). Read the appropriate SKILL.md and references when applying a skill:
- frontend-design and web-design-guidelines: UI design, accessibility and review; preserve RRC's established typography, photographs and palette.
- react-best-practices and composition-patterns: React/Next.js performance and component structure. React is 18: do not use React 19-only APIs.
- framer-motion: animation with the existing framer-motion imports; respect reduced motion.
- security-best-practices: server-side authorization, sessions and security review.
- webapp-testing: browser validation with Playwright, including mobile and keyboard interaction.
- seo-audit: SEO validation and release evidence; distinguish localhost limitations from production failures.
- better-auth-best-practices: when implementing or migrating to Better Auth; it is not currently installed as an application dependency.
- supabase-postgres-best-practices: when working with Postgres/Supabase; current account storage is SQLite.

RRC Inner Circle has independent code-based access through a server-side SQLite private session. Local setup defaults to the user-requested ESTCO code; never embed codes in browser code. Never grant access from cookie presence or client state alone. Measurements and weight are optional; the 3D mannequin is a measuring guide, not an inferred personal body shape. Future drops must not be presented as active before they exist.

Run npm run check. Do not build while a dev server uses the same .next directory. For UI changes validate desktop/mobile, keyboard controls, WebGL fallback and browser console. Report unmeasured production Core Web Vitals honestly. Do not publish without user instruction.

Additional skills: threejs-fundamentals, geometry, lighting, materials, loaders, animation, interaction and remotion-best-practices. Original GLB mannequins are generated offline with Blender by scripts/generate-fit-models.py; runtime loads retained assets. User-approved workshop photos arrive later; configure src/config/private-content.ts. Do not invent private drops or discounts.
