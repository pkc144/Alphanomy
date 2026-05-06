# TENANT_TAGLINES.md — Per-tenant auth-screen copy via `appadvisors.taglines`

> **Status**: backend schema *defined*, client passthrough *shipped* (2026-05-05).
> The variant falls back to hardcoded copy until the backend writes a value.

## Why this exists

The alphanomy variant ships hardcoded marketing copy on the auth screens:

- LoginScreen — `"Folios · Research"` sub-tag, `"Your Alpha, Engineered."` hero, `"Research-backed investment plans curated by SEBI-registered advisors."` subhead, `"SEBI Registered"` + `"256-bit Encrypted"` trust badges.
- SignupScreen — `"Create account"` sub-tag, `"Start investing smarter today."` hero, **`"Join 50,000+ investors getting institutional-grade advice."`** subhead.

That last claim is a quantitative legal/compliance hazard if shipped to a tenant whose actual investor count is different. **Surfacing all of this copy via `appadvisors.taglines` lets per-tenant compliance own the message without code changes.**

## Resolution order

```
hardcoded variant fallback
    ←  overridden by →  appadvisors.taglines (backend)
```

Per-field fallback: a partial backend override (e.g. only `heroTitle` set) keeps the rest from the built-in copy. No tenant has to set every field.

## Backend schema — `appadvisors.taglines`

```js
{
  taglines: {
    login: {
      brandSubtag:   string?,         // sub-tag under brand name
      heroTitle:     string?,         // hero heading (allows '\n')
      heroSubtitle:  string?,         // supporting copy
      trustBadges:   [
        { icon: 'check' | 'shield' | 'lock' | 'award' | 'sparkles',
          label: string }
      ]?,
    },
    signup: {
      brandSubtag:   string?,
      heroTitle:     string?,
      heroSubtitle:  string?,
        // ⚠️ Quantitative claims (investor counts, returns) — tenant +
        // compliance approval REQUIRED before going live.
    }
  }
}
```

All fields optional; missing fields fall back to the variant's hardcoded copy.

## Trust-badge icons

The `icon` string maps to a lucide-react-native component in
`designs/alphanomy/screens/LoginScreen.js`:

| `icon` value | Component |
|---|---|
| `check` | `Check` |
| `shield` | `ShieldCheck` |
| `lock` | `Lock` |
| `award` | `Award` |
| `sparkles` | `Sparkles` |

Add new keys to `TRUST_ICON_MAP` in the same file when a tenant requests a new icon. Unknown keys silently fall back to `Check`.

## Client passthrough

1. `src/context/ConfigContext.js` reads `apiData.taglines` from `/api/app-advisor/get` and exposes it as `config.taglines` on the React context.
2. `src/screens/Authentication/LoginScreen.js` and `SignupScreen.js` containers spread `config?.taglines?.login` / `.signup` into their respective `viewModel.taglines` field.
3. `designs/alphanomy/screens/LoginScreen.js` and `SignupScreen.js` consume `viewModel.taglines` and merge per-field with `FALLBACK_TAGLINES`.

Default presentation ignores the field — the addition is variant-only.

## Backend work outstanding (2026-05-05)

The backend has NOT yet added the `taglines` field to the `appadvisors` collection schema or the `/api/app-advisor/get` response shape. Until it does, every tenant sees the alphanomy hardcoded copy. To ship per-tenant copy:

1. **Schema** — extend the Mongoose `appadvisor` schema in `aq_backend_github/Models/appAdvisorModel.js` (or wherever the model lives) to include the `taglines` shape above.
2. **Endpoint** — `aq_backend_github/Routes/appAdvisor.js` `/get` handler must include `taglines` in the response (probably already auto-passes if the field exists on the doc).
3. **Admin UI** — `support.alphaquark.in` form to set per-tenant taglines. Compliance review on signup `heroSubtitle` per tenant.
4. **Backfill** — existing advisor records get `taglines: null` (or unset) and the variant falls back gracefully — no migration urgency.

Coordinate the backend change in the same PR cycle as the support-UI form, since one without the other is half-shipped. Until then this doc serves as the source-of-truth contract that the client side is already coded against.

## Related docs

- `src/context/ConfigContext.js` § `TENANT TAGLINES` — code-level shape comment.
- `designs/alphanomy/screens/LoginScreen.js` (`FALLBACK_TAGLINES`) — built-in copy.
- `designs/alphanomy/screens/SignupScreen.js` — Signup taglines (no `trustBadges`).
- `docs/DESIGN_MIGRATION_PROGRESS.md § 2026-05-05 (taglines)` — work log.
