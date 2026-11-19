# Working app frames and browser journeys

These checks run the actual Expo web export of `mobile/src/App.tsx`. The PNGs
are labelled **phone web preview** and **tablet web preview**. They are useful
for reviewing layout and navigation; they are not Android/iOS device screenshots
and must not be submitted as native App Store screenshots.

The fixture is India Gully's public catalogue fetched on 19 November 2026 at
07:51 UTC. It contains only public listing, product, practice and Perspective
information. No customer data, authenticated session or private room content is
included. Images use their published first-party URLs. The app content is not
an invented demonstration catalogue.

From the repository root, after installing root and mobile dependencies and
exporting the mobile app:

```sh
npx playwright install chromium
npx playwright test --config mobile/qa/playwright.config.mjs
```

The frame manifest records the source catalogue date, viewport and Git commit.
Website transitions are checked without registering, signing in, sending email
or changing any remote data. Any captured sign-in/Gullu pages are labelled
website frames rather than native app screens.

The iOS CI job additionally boots an available iPhone simulator, installs the
compiled Release simulator application and captures the native Home screen.
That artifact is explicitly labelled iOS simulator. Physical-device acceptance
and signed store builds remain separate release requirements.
