# Slides Deck

Rute Cintra's presentation library, with stable links and a shared audience/speaker player.

## Presentations

1. **SIP AI workshop** — `decks/sip-ai-workshop/`: 29 approved audience slides, with the latest slide 20 examples and technical glossary in the speaker notes.
2. **Early childhood** — `decks/early-childhood/`: 27 slides, including two video discussion pauses, redesigned as a high-contrast typographic presentation, with chapter references and each group member's notes.

Open a presentation normally for audience view. Append `?mode=speaker` for the speaker workspace, then choose **Open audience window** and move it to the projector. Slides synchronize across same-origin windows in the same browser using BroadcastChannel. This is not remote-device synchronization. Each presentation is authored once in `deck.json`.

## Development

No runtime dependencies or framework installation are required. Use Node.js 22+.

```sh
npm run dev
npm test
npm run build
```

Open the local server address. Direct `file://` opening is unsupported because the player fetches JSON and CSS. There are no third-party runtime assets or analytics.

## Editing

- `index.html`, `assets/library.css`, `assets/library.js`: library catalog.
- `assets/player.js`, `assets/player.css`: shared player, synchronization, keyboard controls, and timer.
- `decks/<slug>/deck.json`: Portuguese slide content and notes, using English field names.
- `decks/<slug>/theme.css`: independent visual system for that deck.
- `decks/<slug>/index.html`: player entry point.

Slide canvases use 1600 × 900 and scale uniformly. Source HTML is rendered in a sandboxed same-origin iframe without scripts. The host handles navigation. Changes to a JSON file update both modes after publication and a page refresh. No service worker retains old decks.

To add a deck, copy an entry point, add its JSON/theme, add a catalog card, and extend `scripts/validate.mjs`. Keep URLs stable and all code/documentation in English. Presentation text and speaker notes remain in Portuguese.

## Deployment

The Pages workflow validates and builds the site on pushes to `main`, then publishes `dist/`. In repository **Settings → Pages**, select **GitHub Actions** as the source if automatic enablement is unavailable. No custom domain is required.

Expected project URL: https://rutecintra.github.io/slides-deck/

## Source provenance

The SIP import uses the corrected audience file from `oficina_ia_corrigida.zip` and the latest speaker guide `guia_apresentadora_slide20_exemplos.html`, including the additional slide 20 examples. Existing workshop claims and references are preserved as part of that presentation, not newly verified research.

The childhood presentation uses the chapter summaries and notes developed from *Infância(s) e Educação Infantil: pesquisas, docências e pedagogias* (Pedro & João Editores, 2022). The Ludibus photograph is reproduced with attribution to Ana Paula Cordeiro, printed page 249. The full source PDF is not included.

## Privacy

This is a public static website. Speaker notes are hidden from audience view but remain accessible in the public JSON. Do not use it for confidential material. There is no authentication, online editor, or automatic offline caching in this version.

Video slides load YouTube only after Play video is selected. Open on YouTube is available if embedding is restricted. Playback is local to the selected window; use the projected audience window to play audio and video. Closing the player or changing slides stops playback.
