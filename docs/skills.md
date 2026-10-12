# Установленные навыки

Навыки установлены для Codex в `.agents/skills`. Это инструкции разработчику, а не код, выполняемый в браузере. В новый сеанс Codex каталог будет доступен из репозитория.

| Навык | Источник | Зафиксированная ревизия |
|---|---|---|
| frontend-design | https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines | `063bee94c3f4df8453406c830b0a7df0f2860278` |
| react-best-practices | https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices | `063bee94c3f4df8453406c830b0a7df0f2860278` |
| composition-patterns | https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns | `063bee94c3f4df8453406c830b0a7df0f2860278` |
| framer-motion | https://github.com/Schoepplake/framer-motion-skill/tree/1d984d5db13b3fe30edef3f3a5d88dba588a10b7/skills/framer-motion | `1d984d5db13b3fe30edef3f3a5d88dba588a10b7` |
| better-auth-best-practices | https://github.com/better-auth/skills/tree/20c9e88a5c007461a703f1c213572b073196113e/better-auth/best-practices | `20c9e88a5c007461a703f1c213572b073196113e` |
| security-best-practices | https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices | `49f948faa9258a0c61caceaf225e179651397431` |
| webapp-testing | https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` |
| seo-audit | https://github.com/seo-skills/seo-audit-skill/tree/479208b92e3b30e64d2188937dd7696ec162f019/skill | `479208b92e3b30e64d2188937dd7696ec162f019` |
| supabase-postgres-best-practices | https://github.com/supabase/agent-skills/tree/c9be0e931b7930f7d02126d04774d904c381e7d7/skills/supabase-postgres-best-practices | `c9be0e931b7930f7d02126d04774d904c381e7d7` |

Better Auth и Supabase установлены как навыки. Текущий кабинет использует существующий SQLite и серверные сессии; миграция на эти сервисы не выполнялась.

## Дополнительные навыки для 3D и анимации

- https://github.com/CloudAI-X/threejs-skills.git, commit `b1c623076c661fc9b03dac19292e825a5d106823`.
- https://github.com/remotion-dev/skills.git, commit `7ba4dcf8ebe1626b00baa41e1f2478113719b60b`.

Three.js: fundamentals, geometry, materials, lighting, animation, interaction, loaders. Remotion: router и встроенные references. Интерактивный сайт использует Three.js/Motion; Remotion не добавлен в браузерный bundle.
