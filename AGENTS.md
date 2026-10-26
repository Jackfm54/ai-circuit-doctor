 # Project rules
 
- Handle expected AI HTTP failures through the shared aiResponseError helper as recoverable UI states, so exhausted credits never become runtime errors.

- Independent local exports are assembled outside the live project, with API keys confined to the local API process and all detector resources packaged locally, so the backup and preview remain unchanged.

- Keep photo validation and diagnostic normalization in the analyze-circuit function's pure validation module so the same rules can be tested without calling AI.
- Solder findings use existing report entries without generated joint boxes, and measurement-only results omit visual solder assessments, because the component detector and voltage inputs cannot establish joint localization or quality.
- Preserve uploaded image MIME types in diagnostic requests so the model sees the correct image encoding.
- Preserve the language context identity across Vite hot updates so mounted providers and refreshed consumers do not become disconnected.
- Position component overlays as percentages of the rendered image and use diagnostic component indices for labels, so resizing and sparse localization keep labels aligned with their reports.
- Component localization comes from the browser-run trained YOLO model (src/lib/yoloDetector.ts); analyze-circuit must copy detection coordinates exactly and the AI only assigns each component's condition — never let the AI move or regenerate YOLO boxes.
- Large binary assets (ONNX model, ONNX Runtime wasm/.mjs loader) are externalized with the lovable-assets CLI as .asset.json pointers in src/assets; committing them to public/ or src/ exceeds the 10 MB repo limit, and importing .wasm from source breaks the deploy. The .mjs loader must be uploaded with `--content-type text/javascript` — the inferred text/plain makes browsers refuse the dynamic module import.
- When diagnostic detections were used, the response carries detectionSource "yolo" and the UI shows the trained-model wording instead of the estimated-boxes wording.- YOLO runs on the whole photo plus overlapping zoomed tiles (merged with NMS) so micro SMD parts are found, and analyze-circuit appends any detection the AI omitted (addMissingDetections) so every trained-model box reaches the user.
- The classroom demo uses a captured real analyze-circuit response (src/data/demoDiagnostic.ts, FR/EN) with src/assets/demo-board.jpg so it works offline; regenerate it from the real function rather than hand-editing. PDF export uses window.print with @media print light tokens and .no-print.
- Board schematics come from generate-schematic in two modes, both normalized in schematic.ts: "detailed" (component netlist drawn KiCad-style by NetlistSchematic with standard symbols and orthogonal wires routed pin → inter-part gap → channel track under each row → left-margin spine, so wires never cross part bodies) and "blocks" (functional block diagram). Both render as self-contained SVG with a fixed drawing-sheet palette so downloads render anywhere.
