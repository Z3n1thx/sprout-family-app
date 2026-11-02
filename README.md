# Sprout

A money management app for children aged 4–10 with full parent oversight. Teaches financial responsibility through tasks, rewards, and age-appropriate interfaces scaled across three developmental stages.

## What it is

Sprout gives children a virtual currency earned through parent-approved tasks and redeemable for rewards parents select. All money is play money — no connection to real bank accounts. The design scales deliberately across early elementary (4–6), mid-elementary (7–8), and upper elementary (9–10) age groups.

## Key features

- **Child interface**: Large readable numbers, visual goal progress, playful rewards, transaction history with icons, simplified spending requests
- **Parent interface**: Complete account oversight, task/chore management, spending approval workflow with rejection reasons, activity monitoring, per-child limits
- **Rewards system**: Physical items, screen-time privileges, outings, digital badges — all redeemable through virtual currency only
- **Task system**: Parents create tasks with point values; children complete; currency awarded on approval; disputes can be messaged back
- **Multi-device**: Family syncs across devices via a join code; no server, no cloud backup — the family ledger stays on parents' phones only

## Privacy & security

- **Zero permissions**: No INTERNET permission — the app cannot send data off the device even if compromised
- **Local-only storage**: Entire family ledger encrypted in browser localStorage with AES-GCM-256
- **No cloud backup**: `allowBackup="false"` prevents Google Drive sync; device-to-device transfer stays on for phone upgrades
- **Join codes**: PBKDF2-derived family snapshot encoded as shareable text — works via any channel parents trust

## Design principles

Bright primary colors, rounded shapes, large simple text, liberal icons. Minimal cognitive load, no financial jargon, intuitive tap/swipe. Sounds and animations celebrate completion sparingly. High contrast and clear tap targets for accessibility across ages.

## Tech stack

- **Frontend**: React 19, TypeScript strict, Vite 6, react-router-dom 7
- **Mobile**: Capacitor 8.5, Android SDK 36, portrait-locked
- **Crypto**: Web Crypto API (PBKDF2 120k iterations, AES-GCM-256)
- **Fonts**: Baloo 2 (headings), Nunito (body), Andika (tier 1), JetBrains Mono (codes) — all bundled, no CDN
- **State**: localStorage only, no server

## Building

### Web

```bash
npm install
npm run build
```

Output: `dist/` — 0.92 kB HTML, 31 kB CSS (gzipped 5.4 kB), 402 kB JS (gzipped 119 kB).

### Android APK (portable toolchain, zero system footprint)

Unpack JDK 21 and Android SDK command-line tools into `.tools/` as zips, no installers:

```bash
# Run once (downloads ~900 MB, extracts to ~1.3 GB)
source .tools/env.sh
# Subsequent builds
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease --no-daemon
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (~3.4 MB), signed with `sprout-release.jks`.

**Keep the keystore**: `sprout-release.jks` and `keystore.properties` are the app's signing identity. Lose them and you cannot update an existing install without uninstalling (which deletes the family). Back them up off this machine.

The toolchain occupies ~2.3 GB across `.tools/`, `android/`, and `C:/private/sprout-gradle-home`. Delete `.tools/dl/` (344 MB of zips) after first build to reclaim space; it only costs a re-download if the toolchain needs rebuilding.

## Project structure

```
src/
├── parent/         Parent dashboard, tasks, approvals, devices
├── child/          Child dashboard, rewards, goals, transactions
├── screens/        Login, join, role-picker
├── ui/             Sprig mascot, buttons, panels, layout primitives
├── lib/            Crypto (pair.ts), ledger (state.ts), storage
└── styles/         Design tokens, tier system, base styles

android/
├── app/src/main/
│   ├── AndroidManifest.xml    Zero permissions, portrait lock, backup policy
│   ├── res/drawable/           Vector icon (Sprig), splash
│   └── res/values/             Colors mirrored from CSS tokens
└── app/build.gradle            Release signing, versionName
```

## Design system

Five tokens (`--paper`, `--ink`, `--sun`, `--sprout`, `--sky`) plus semantic aliases (`--danger`, `--caution`, `--slate`). Four tiers via `[data-tier="1|2|3|p"]` scale font size, tap targets, spacing. Ink rule: `#2E2A22` on bright fills = 4.6–9.1:1 contrast (AA). No dark mode — algorithmic inversion disabled via `forceDarkAllowed="false"` to preserve measured contrasts.

## License

MIT

---

**Built with Claude Code** — conceptualized as a UX/finance app for children, implemented as a production-grade React/Capacitor app with zero-permission native shell and AES-encrypted local-only storage.
