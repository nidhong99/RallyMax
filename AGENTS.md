# AGENTS.md

Project-specific guidance for AI coding agents.

<!-- ASTRYX:START -->
Astryx v0.7.0 · 168 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:
1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx template <Block>` for parts it lacks; `astryx component <Name>` to read props before using one.
Changing an existing page? Keep it: skip step 2 and add blocks/components inside its sections.

RULES:
- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then tokens (var(--color-*|--spacing-*|--radius-*)). No raw hex/px. No StyleX/Tailwind compiler here — don't use xstyle/utility classes directly. Some templates use StyleX and need a compiler plugin; see `astryx docs styling-overview`.
- Palettes and custom colors go through the theme, never :root overrides. Run `astryx theme add <slug>` to import; `theme eject <slug>` only forks source. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any raw <div>/<span>, imported .css/@apply, or hardcoded #hex/px with the component or a token.

`astryx help` lists every command. Key ones beyond the workflow:
  search "<query>"   find any component / hook / doc / template
  discover <words>   integrations you could add
  docs <topic>       getting-started, principles, tokens, theme … (`astryx docs` lists all)
  docs cli           commands, API reference, integration authoring
  upgrade --from <old version> --apply   run after a dependency bump
<!-- ASTRYX:END -->

## Security & CodeQL Rules

To maintain a zero-alert status on GitHub CodeQL (High/Critical severity), all agents and developers must strictly adhere to the following rules:

1. **Cryptographically Secure Randomness (`js/insecure-randomness`):**
   - **Never** use `Math.random()` for IDs, tokens, verification codes, salt, or state keys.
   - **Always** use the Web Crypto API:
     - For UUIDs: `crypto.randomUUID()` (with fallback to `crypto.getRandomValues()`).
     - For numbers/tokens: `crypto.getRandomValues(new Uint32Array(1))[0]`.

2. **Strict URL & Domain Parsing (`js/incomplete-url-substring-sanitization`):**
   - **Never** validate hostnames or URLs using `.includes()` or loose regular expressions (e.g. `!url.includes('example.com')`).
   - **Always** parse the URL safely inside a `try/catch` block and check exact hostnames or strict suffix matching on `parsedUrl.hostname`:
     ```ts
     try {
       const parsedUrl = new URL(inputUrl);
       return parsedUrl.hostname === 'example.com' || parsedUrl.hostname.endsWith('.example.com');
     } catch {
       return false;
     }
     ```

3. **Sanitized Storage & Sensitive Data Protection (`js/clear-text-storage-of-sensitive-data`):**
   - **Never** serialize sensitive credentials (`password`, `token`, `secret`, `auth`, `pin`, `access_token`, `refresh_token`, etc.) into `localStorage` or `sessionStorage`.
   - Supabase Auth exclusively manages auth tokens and session tokens.
   - **Never** call `localStorage.setItem` or `sessionStorage.setItem` directly with user profiles, auth payloads, or tainted objects.
   - **Always** route state persistence through the centralized sanitized helper `savePublicAppState(key, safeData)` in `src/context/AppContext.tsx`, which explicitly strips any sensitive fields and picks only non-sensitive public UI properties.


## Repository Hygiene & Package Management Rules

1. **Package Manager Enforcement:**
   - **Strictly use `pnpm`** (`pnpm install`, `pnpm add`, `pnpm run ...`).
   - **Never** commit `package-lock.json`, `yarn.lock`, `dist/`, `.DS_Store`, or any `.env` / `.env.*` file to Git.

## Database & Supabase Security Rules

1. **Server-Side Enforcement Over UI Guards:**
   - **Never** write Supabase RLS policies that trust frontend UI guards alone.
   - Always enforce `profiles.role` checks (`IN ('HOST', 'ADMIN')`) and user identity (`auth.uid()`) directly at the PostgreSQL policy level (`WITH CHECK` / `USING`).
2. **Column-Level Restriction & Privilege Escalation Prevention:**
   - Always protect sensitive columns (such as `role`, `is_verified_host`, `reliability_score`, `total_no_shows` on `profiles`, or `status`, `payment_status` on `event_registrations`) using PostgreSQL `BEFORE UPDATE ... SECURITY DEFINER` triggers so malicious clients cannot update unauthorized columns from the browser console.
