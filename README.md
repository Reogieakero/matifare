# Tripede

Tripede is a fare estimator for tricycle rides: know the price before you hop in.
Built with Expo and React Native, and shipped to iOS, Android and the web from a
single codebase.

## Highlights

- **Cinematic launch splash** — animated mascot, wordmark and loading state.
- **Three-step onboarding** — upfront pricing, comparison and offline confidence,
  remembered on-device so it only appears once.
- **Fare dashboard** — quick distance chips, bike/car/XL comparison, live estimate
  and an empty state ready for saved trips.
- **Offline live map** — a real street map of Mati City bundled inside the app,
  with a live GPS pin. No tile server, API key or internet connection is used.
- **Blue, yellow and white palette** — crisp white surfaces, electric-blue actions
  and mascot-yellow accents pulled straight from the Tripede tricycle.

## Getting started

```bash
npm install
npx expo start
```

Then open the app in Expo Go, an emulator/simulator, or the browser.

```bash
npx expo start --web     # web
npx expo lint            # lint
npx tsc --noEmit         # typecheck
```

## Project structure

```text
src/
  app/                  Expo Router routes
    index.tsx           Animated launch splash
    onboarding.tsx      Three-slide welcome flow
    map.tsx             Full-screen offline map
    home.tsx            Fare estimator dashboard
  components/
    brand-logo.tsx      Mascot + wordmark lockup
    offline-map-card.tsx  Offline "You are here" map + live GPS pin
    map/
      offline-map-canvas.tsx  Shared map renderer + gestures
    onboarding/         Slide illustrations
    ui/                 AppText, AppButton, Icon, AmbientBackground
  constants/
    app.ts              Brand config, vehicles, fares, storage keys
    theme.ts            Colors, gradients, spacing, radii, shadows
  hooks/
    use-user-location.ts  Foreground GPS + permission states
  lib/
    offline-map.ts      Local projection + SVG path helpers
    onboarding.ts       First-run persistence
    storage.ts          expo-sqlite/kv-store (native)
    storage.web.ts      localStorage (web)
assets/
  maps/mati-map.json    Bundled OSM extract rendered offline
scripts/
  build-offline-map.py  Rebuilds the bundled Mati City map data
  generate-brand-assets.ps1   Regenerates icons from the mascot
  brand-mascot-panel.ps1      Repaints the mascot sidecar label
```

## Brand assets

- `assets/images/mascot.png` — transparent Tripede mascot used in the app.
- `assets/images/icon.png`, `brand-mark.png`, `favicon.png`,
  `android-icon-*.png` — generated from the mascot.
- The original artwork is kept untouched at
  `assets/images/Fare Calculator Tricycle Mascot.png`.

To regenerate the icon set after replacing `mascot.png`:

```powershell
pwsh ./scripts/generate-brand-assets.ps1
```

## Fares

Vehicle base fares and per-kilometre rates live in `src/constants/app.ts`.
Estimates are indicative and exclude tolls and waiting time.

## Offline map

The home screen asks for foreground location permission and places your GPS
position on a map of Mati City. Tap the expand button on the map card to open
the full-screen map, which keeps the same offline data and live pin. Map data is
shipped in `assets/maps/mati-map.json`
and rendered with `react-native-svg`, so there are no tile requests and no API
keys. Airplane mode does not affect the map or the GPS fix.

Map data © OpenStreetMap contributors, available under the ODbL. Regenerate the
bundle after changing the coverage area:

```bash
python scripts/build-offline-map.py
```

Location permission text is configured through the `expo-location` plugin in
`app.json`. Because the plugin touches native configuration, permission strings
on iOS only take effect in a development/production build, not Expo Go.
