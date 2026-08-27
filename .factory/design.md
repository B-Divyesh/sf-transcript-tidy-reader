# Transcript Tidy — visual thesis

## Direction

**Surreal editorial scenery: the quiet reading garden.** Fragmented captions arrive as loose paper slips; Transcript Tidy gathers them into one calm, continuous reading path. The visual metaphor is an impossible paper landscape: cream pages rise like terraces, punctuation becomes small sculptural stones, and a single coral bookmark threads through the scene. It is editorial rather than technological, and it explains the product without implying transcription or AI generation.

The interface uses the illustration only in the landing-page story. Extension surfaces recede into a typographic reading room, so the transcript—not chrome—is dominant.

## Palette

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `paper` | `#F3ECDD` | `#181B1A` | page/background |
| `sheet` | `#FFFDF6` | `#232725` | elevated reading surface |
| `ink` | `#202724` | `#F7F1E3` | primary text |
| `muted` | `#5D655F` | `#BCC4BE` | secondary text |
| `moss` | `#315E4A` | `#8EC6A5` | actions, focus, links |
| `coral` | `#A23D31` | `#FF8C77` | bookmark/accent |
| `ochre` | `#9A6819` | `#E9B65A` | warning |
| `danger` | `#9B302B` | `#FF8F86` | errors |

Ink/paper and muted/paper combinations are chosen for WCAG AA body-text contrast. Coral is a narrative accent, never the only status cue. The extension follows system light/dark preference; the marketing cover is intentionally ink-dark to feel like a book jacket.

## Type

- **Display:** Georgia, `Times New Roman`, serif. Literary, familiar, locally available, and reserved for the brand, title, and editorial pull-quotes.
- **UI and reader:** system sans stack (`Inter`-like platform faces) for controls; the transcript itself can switch locally among serif, sans, and mono system stacks.
- Scale: 12 / 14 / 16 / 20 / 28 / fluid 48–76 px. Reader copy is 18 px by default with 1.72 leading and a 68ch measure.
- No remote or bundled font files: this keeps the extension fast, private, and visually native where reading happens.

## Spacing and shape

An 8 px base rhythm with 4 px micro-spacing; primary gaps are 16, 24, 32, 48, 72, and 96 px. Surfaces use asymmetric editorial corners (usually `20px 20px 20px 6px`) and 1 px moss-tinted rules. Shadows are soft and short, suggesting layered paper instead of floating glass. Controls are at least 44 px.

## Interaction grammar

- The primary flow reads left-to-right: detect → tidy → read → return to timestamp.
- Timestamp pills are visible marginalia. Search matches are warm ochre annotations rather than fluorescent highlights.
- Settings unfold from the edge of the document; no modal interrupts reading.
- Feedback is stated in plain language in live regions. Empty, unavailable, offline, and malformed-caption states each offer a next step.

## Motion

Document transitions use 180–240 ms opacity and small vertical transforms; the hero's coral thread settles once on load in 600 ms. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are immediate.

## Asset plan and provenance

- `assets/src/reading-garden.png`: source illustration generated with the factory image model on 2026-08-27.
- `site/public/assets/reading-garden-960.webp` and `reading-garden-1440.webp`: optimized derivatives for the landing page, both targeted below 300 KB.
- Product mark and extension icons: original hand-authored SVG/CSS geometry derived from a folded page and bookmark; no stock icon set.

### Prompt sheet

Use case: `stylized-concept`. Asset type: wide landing-page editorial hero. Primary request: a surreal quiet reading garden made of layered cream paper pages, fragmented caption strips gently converging into one continuous path, with a slim coral bookmark ribbon guiding through it. World: miniature architectural paper landscape, bookish and contemplative. Materials: tactile uncoated paper, subtle deckled edges, tiny moss-green punctuation stones. Light: soft raking dawn studio light, long gentle shadows. Lens/composition: wide 3:2 editorial still life, path entering lower left and opening toward upper right, useful negative space, no people. Palette: warm parchment, near-black ink, deep moss, restrained coral, muted ochre. Avoid: text, letters, readable glyphs, logos, watermarks, screens, laptops, microphones, play buttons, neon gradients, glossy 3D plastic, photoreal people, brands, copyrighted characters.

The generated image is original to Transcript Tidy and used under the product's MIT-distributed asset terms. The footer discloses AI-assisted image generation.
