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

The closed level is available to all registered members through the same SQLite-backed account session. Never grant access from cookie presence or client state alone. Measurements and weight are optional; the 3D mannequin is a measuring guide, not an inferred personal body shape. Future drops must not be presented as active before they exist.

Run npm run check. Do not build while a dev server uses the same .next directory. For UI changes validate desktop/mobile, keyboard controls, WebGL fallback and browser console. Report unmeasured production Core Web Vitals honestly. Do not publish without user instruction.
