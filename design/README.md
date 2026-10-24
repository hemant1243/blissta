# design/: free wireframes and code-set type for statics

Implements Design System v3 (`brand/STATIC_DESIGN_SYSTEM_v3.md`), pass 6 (free wireframe) and the code-type route.

```
node design/typeset.js design/examples/ultrablue-s1-1x1.json design/examples/out
```

- **Spec (JSON):** `canvas`, `mode` (`wireframe` = grey product box on the ground; `overlay` = transparent PNG to lay over an AI plate), optional `plate` (scene image drawn underneath for a finished preview), `colors` (ground/text/accent/hair), `elements`.
  - `text`: x, y, w, size, weight, align, maxLines, role (`qualifier`/`offer`, which are excluded from the hierarchy ratio), `to: [x, y]` for a hairline. `*word*` = accent.
  - `box`: the product area.
  - `pill`: price pill.
- **Output:** `<name>.png`, `<name>-feed.png` (100% plus feed size on light and dark feeds), and a list of number checks:
  - text wider than its box, or more lines than allowed
  - text under the 44 px floor
  - text in the margins
  - text overlapping the product or other text
  - contrast under 4.5:1 (7:1 under 64 px)
  - headline under 2.5x the facts
- If it measured fewer text blocks than the spec has, it stops with an error instead of reporting a false pass.
- **Font:** Montserrat 600/700/800 (OFL), in `design/fonts/`. Swap the files to change the brand font.
