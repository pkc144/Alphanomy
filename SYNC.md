# SYNC.md — Alphanomy Whitelabel Overlay

This repo is a whitelabel overlay on top of the `Alphab2bapp` upstream. The
canonical contract for whitelabel forks is in
`docs/WHITELABEL_RECIPE.md` (mirrored from upstream). Read that first if
you're new here.

## Upstream

- **Repo**: `https://github.com/.../Alphab2bapp` (local clone at
  `/home/pk/Alphaquark_docs/AlphaQuark/codes/github/Alphab2bapp`)
- **Tracked branch**: `feature/sdk-plus-config_forkv2`
- **Last sync attempt**: 2026-06-10 — full `src/` + new-features content
  port (not git merge), see § "Sync history" below.

## ⚠️ This fork has unrelated git history with upstream

`git merge-base feature/prince upstream/feature/sdk-plus-config_forkv2`
returns no merge base. This repo was not created by `git clone` from
Alphab2bapp — it was seeded as a fresh repo containing a copy of an old
upstream snapshot. As a result:

- The canonical `git fetch upstream && git merge upstream/<branch>` from
  `WHITELABEL_RECIPE.md` will **NOT** work here. Git would need
  `--allow-unrelated-histories` and would conflict on every shared file.
- Until this is fixed (rebuild the fork as a real clone of upstream — see
  § "Long-term: rebuild as a real fork"), syncs happen by **content port**:
  read upstream's diff, port the relevant edits manually onto matching
  files here.
- Do not rely on `git log feature/prince..upstream/...` for "what's coming
  in from upstream" — the histories are unrelated, so `git log` shows
  every upstream commit as "new".

## What this fork contains

Per the recipe contract, an overlay should contain:

1. `designs/alphanomy/` — variant-specific tokens, composites, screens,
   assets (currently 13 screens + 2 composites + the tokens bundle).
2. `designs/alphanomy/assets/` — variant-local logo PNGs.
3. `designs/alphanomy/tokens/assets.js` — variant override of the
   `DEFAULT_ASSETS` slot. Wired into `tokens/index.js` re-exports.
4. A 2-line patch on `designs/registry.js` adding the variant import +
   map entry.
5. Native shell delta — Android/iOS icons, `applicationId`, build number,
   signing config, splash, display name, deep-link scheme.
6. `.env` with `DESIGN_VARIANT=alphanomy` (or equivalent).
7. This `SYNC.md`.

## ✅ CLOSED 2026-06-10 — `useTokens()` is now variant-aware (asset slot)

**Previously** `src/theme/useTokens.js` imported the default `buildAssets`
directly, so `useTokens().assets.*` always returned the AlphaQuark logos
even under `DESIGN_VARIANT=alphanomy`. The fork worked around this with a
hardcoded `if (variant === 'alphanomy')` branch + a JS-drawn `AlphanomyLogo`
component living in shared `src/` (`BrandLogo`, `LogoSection`, `SplashScreen`).

**Fixed upstream (and ported here) on 2026-06-10:** `useTokens()` now reads
the active variant's `buildAssets` via `DesignContext`
(`design.tokens.buildAssets`, resolved by `resolveDesign`'s token-namespace
merge), falling back to the default builder when outside a `DesignProvider`.
Consequences:

- `BrandLogo`, `LogoSection`, `SplashScreen` are now **generic** — they read
  `useTokens().assets.logoPng` and have **no hardcoded `'alphanomy'` branch**.
- The JS-drawn `src/components/AlphanomyLogo.js` was **deleted from both
  this fork and upstream** (it was a tenant-brand leak in the default repo).
- The alphanomy brand mark is now the finalized PNG at
  `designs/alphanomy/assets/logo.png`, surfaced through
  `designs/alphanomy/tokens/assets.js` → `useTokens().assets.logoPng`.
- Default-fall-through surfaces (BasketCard, ChangeAdvisor) and the former
  variant-blind `src/` consumers (PlanCard, RebalanceCard) now render the
  **correct per-variant** logo automatically.

Only `assets` was made variant-aware; colors/typography/spacing already vary
per-tenant via ConfigContext legacy-branding (the alphanomy `appVariants`
entry sets `mainColor`/`gradient1`/etc.), so they needed no change.

The fork carries **no** `AlphanomyLogo`/`BrandLogo` `src/` divergence anymore
— those files are byte-identical to upstream. The only fork-specific value is
`googleIosClientId` + the brand PNGs under `designs/alphanomy/`.

## Always-tracked files that aren't obvious

`android/gradle.properties` is **TRACKED** in this repo (it was previously
gitignored — that was a bug; removed 2026-05-09 because fresh clones
couldn't build). It carries `hermesEnabled`, `newArchEnabled`,
`android.useAndroidX`, the JVM heap, the Java install path, the
release-signing-config key names. The build.gradle reads these at
configure time; the file going missing kills the build with
`Could not get unknown property 'hermesEnabled'` at line 130 of
`android/app/build.gradle`.

Standing rule: **any change to `android/gradle.properties` must be
committed**. Do not gitignore it. Do not let your local IDE silently
diverge from it. Per-machine-only overrides (your Java install path,
your local heap, real signing passwords) belong in
`~/.gradle/gradle.properties` instead — Gradle merges that file
automatically and it is never in any repo. The `TODO_*` placeholder
tokens for release-signing in `android/gradle.properties` should stay
as TODO tokens here; the real values go in `~/.gradle/gradle.properties`
on the machine that does release builds.

## What this fork must NOT have

- A patch to `src/assets/*` — that breaks the default variant's
  appearance. Variant-specific images go under `designs/alphanomy/assets/`.
- Any `src/`-side patch that diverges from upstream behavior. If you find
  one, it belongs upstream as a generic improvement OR as a new
  variant-override mechanism that the fork then consumes. Do not
  perpetuate `src/`-side drift.
- A copy of `designs/default/` — fallback chain handles default flow-
  through automatically.
- Direct edits to the SDK package (`@alphaquark/mobile-sdk`).

## Sync workflow (today, until the rebuild)

Because `git merge` doesn't work without `--allow-unrelated-histories`,
sync by content port:

1. Identify the upstream branch tip and the time window of upstream commits
   you want to bring in.
2. For each upstream commit, read its diff (`git show <sha>` in the local
   `Alphab2bapp` clone).
3. Apply the same edits to matching files in this repo. **Skip** anything
   under `src/`-paths that this fork has variant-specific divergence on
   — but record it in this SYNC.md so the divergence is tracked.
4. Update the variant where needed (e.g. if a new viewModel field appears
   upstream that an alphanomy override should consume).
5. Commit with a message like `sync(upstream): port <commit-range> —
   <subject>` so future maintainers can trace.

## Long-term: rebuild as a real fork

The clean fix is to rebuild this repo as a proper git clone of upstream:

1. Save the variant deltas to a tarball: `designs/alphanomy/`,
   `designs/alphanomy/assets/`, the `designs/registry.js` patch lines,
   the native shell files (Android `mipmap-*`, `colors-icon.xml`,
   iOS `AppIcon.appiconset`, `applicationId` / `versionCode` lines from
   `build.gradle`, iOS `Info.plist` display name + bundle id), `.env`,
   this `SYNC.md`.
2. `rm -rf .git` and back up the working tree.
3. `git clone https://github.com/.../Alphab2bapp .` to seed a real fork
   with shared history.
4. Re-apply the saved deltas on top.
5. `git remote set-url origin https://github.com/pkc144/Alphanomy.git`,
   `git push --force-with-lease origin feature/prince` (destructive —
   overwrites the existing remote history; coordinate with anyone who
   has the repo cloned).

After the rebuild, the canonical `git fetch upstream && git merge` flow
from `WHITELABEL_RECIPE.md` works as designed. The 2-line conflict on
`designs/registry.js` becomes the only expected conflict per upstream
merge.

## Sync history

### 2026-06-10 — Full src/ + new-features sync from feature/sdk-plus-config_forkv2 (content port)

Largest sync since the fork's seed. Both sides had diverged since the
2026-05-13 byte-identical baseline (`10e39c9`): upstream gained ~50 commits
(Courses/Webinars, Cashfree, coupon/RIA-billing, plan/draft fixes, two new
brokers, the recent `fix(plans|courses|payment|rebalance|auth)` series) while
Alphanomy gained its own `src/` edits (iOS shadows, HomeScreen ANR fix,
backend-version UpdateAppModal, reanimated downgrade, branding). So this was a
true 3-way reconciliation, not a copy.

**Method.** Classified every differing `src/` file via
`git diff --name-only 10e39c9..HEAD -- src/`:

- **32 "take-upstream" files** (Alphanomy never touched since baseline) →
  copied verbatim from upstream.
- **24 "both-changed" files** → `git merge-file` 3-way merge with
  base = `10e39c9:<path>`, ours = Alphanomy HEAD, theirs = upstream HEAD.
  **All 24 merged conflict-free** (Alphanomy edits and upstream edits hit
  disjoint line regions). Verified each merged output kept the Alphanomy
  edit (vs upstream) AND pulled the upstream delta (vs current Alphanomy).
- **28 new files** copied verbatim (Courses/Webinars screens + services +
  `utils/nba/*` + Arihant/DefinEdge brokers + new shared utils). The
  new Courses/Webinar routes arrived wired through the `Navigation.js`
  merge (drawer items + Stack screens).

**Files deliberately KEPT as Alphanomy's (upstream NOT applied):**

| File | Why kept |
|---|---|
| `App.js` | Module-hoisted `SdkOn`/`CustomStatusBar` + `MarketDataProvider` + inline `sdkOn` JSX — the documented fix for upstream's inline-`SdkRootWrapper` remount bug (wiped TextInput state). Upstream had nothing Alphanomy lacked. |
| `index.js` | Classic-bridge setup; New Arch is off here, so the RCTEventEmitter no-op shim (and its `receiveTouches` tap-swallowing bug) stays removed. |
| `package.json` | `react-native-reanimated@3.19.5` (intentional downgrade vs upstream `4.1.0`); upstream's `react-native-worklets` NOT added (reanimated-4 only). New feature files introduced no new direct deps (`lodash.debounce` already transitively installed, as upstream). |
| `metro.config.js` | SDK path `../alphaquark-mobile-sdk` (parent uses `../../` — different repo depth). |
| `app.json` | Alphanomy brand `name`/`displayName`. |
| `.env` | No new vars — new features read config from backend `appadvisors` + `serverConfig`. |
| `designs/`, native shell, brand assets | Out of sync scope by contract. |

**Docs.** 13 architecture docs 3-way-merged (clean); `CHANGELOG.md` kept
Alphanomy's with a new 2026-06-10 entry prepended; brought
`COURSES_WEBINARS_MOBILE_PORTING.md` + `LIVE_CLASS_INTEGRATION.md`;
`TENANT_TAGLINES.md` (Alphanomy-only) preserved; upstream's gitignored
`CLAUDE_NAV.md` and scratch `SCOPE_*`/spike docs intentionally skipped.

**Post-sync `src/` state:** the only files differing from upstream are the
24 carrying intentional Alphanomy edits. No stray conflict markers anywhere.

### 2026-05-13 — Full src/ sync from feature/ios2.6 (content port)

Brought `src/` to byte-identical parity with upstream `feature/ios2.6`.
Two files were missed by the earlier 20260513 sync run:

- **`src/components/Navigation.js`** — upstream commit `6a13ab8`
  ("navigation to home page after login fixed"). Fix was committed at
  18:59 IST but the Alphanomy sync at 20:22 only pulled `HomeScreen.js`,
  leaving Navigation.js behind.
- **`src/hooks/useKitePublisherPolling.js`** (NEW) — Zerodha Kite Publisher
  order-book polling fallback hook. Extracted from the inline implementation
  in `RebalanceModal.js`/`MPReviewTradeModal.js` so any modal hosting a Kite
  Publisher WebView shares the same recovery logic. Added upstream in commit
  `9b84f6b`.

No other `src/` differences remain. `designs/default/` and `App.js` were
NOT touched — Alphanomy's versions are ahead of source on those files
(`MPPerformanceScreen.js` has an alphanomy-specific `overflow: 'hidden'` fix;
`App.js` has `MarketDataProvider` + component-identity stability hoisting).

### 2026-05-09 — Whitelabel cleanup pass (content port, not git merge)

Brought over upstream Phases 1-3 of the whitelabel-sync work (commits
`6ddf946`, `66a3fa3`, `987f2b7`):

- **Phase 1 (Navigation.js wrapper hoist)** — already locally applied via
  this fork's commit `f30695a`. No change needed.
- **Phase 2 (logo asset-token slot)** — ported by content port:
  - `src/theme/assets.js` (new file, copied verbatim from upstream).
  - `src/theme/useTokens.js` — added `buildAssets` import + bundle entry +
    memo dep on `config.assetTokens`.
  - `designs/default/tokens/index.js` — re-export `DEFAULT_ASSETS` +
    `buildAssets`.
  - `designs/default/screens/{Login,Signup,ResetPassword}.js` — `renderLogo`
    refactor to take `defaultLogo` as a third arg, fed by
    `tokens.assets.logoPng`. Module-scope require removed.
  - `designs/default/screens/ChangeAdvisor.js` — `useTokens` import added,
    reads `tokens.assets.logoFadedPng`. Module-scope require removed.
  - `designs/default/composites/BasketCard.js` — same pattern.
- **Phase 3 (variant-overlay model)** — `docs/WHITELABEL_RECIPE.md`
  copied verbatim from upstream. `CLAUDE.md` got a pointer added to the
  doc table mentioning that this repo IS a whitelabel fork.
- **Asset revert** — Alphanomy's previous overwrites of
  `src/assets/AppLogo/logo.png`, `src/assets/logo.png`, and
  `src/assets/fadedlogo.png` reverted to upstream values. The original
  alphanomy-branded versions were preserved at
  `designs/alphanomy/assets/{logo,fadedlogo}.png` (md5 verified).
- **Variant tokens** — `designs/alphanomy/tokens/assets.js` (NEW) added
  re-exporting `DEFAULT_ASSETS` pointing at the variant-local PNGs.
  Re-exported from `designs/alphanomy/tokens/index.js`.

Outcome:
- Default-variant builds (`DESIGN_VARIANT=default`) now show AlphaQuark
  branding correctly (the leak is closed).
- Alphanomy-variant builds (`DESIGN_VARIANT=alphanomy`) show alphanomy
  branding for variant-overridden screens, AlphaQuark branding for
  default-fall-through composites and `src/`-side consumers (see § Known
  gap above). This regression vs the pre-cleanup state is intentional —
  the proper fix is upstream's `useTokens()` becoming variant-aware.

NOT done in this pass (deferred):
- Long-term repo rebuild (force-push of corrected git history).
- Upstream's `useTokens()` variant-awareness fix.
- Porting upstream's other ~47 commits between this fork's seed snapshot
  and current upstream HEAD.
