 # Project rules

- Keep photo validation and diagnostic normalization in the analyze-circuit function's pure validation module so the same rules can be tested without calling AI.
- Preserve uploaded image MIME types in diagnostic requests so the model sees the correct image encoding.
- Preserve the language context identity across Vite hot updates so mounted providers and refreshed consumers do not become disconnected.
- Position component overlays as percentages of the rendered image and use diagnostic component indices for labels, so resizing and sparse localization keep labels aligned with their reports.
- Component localization comes from the browser-run trained YOLO model (src/lib/yoloDetector.ts); analyze-circuit must copy detection coordinates exactly and the AI only assigns each component's condition — never let the AI move or regenerate YOLO boxes.
- The ONNX model is externalized with the lovable-assets CLI as a .asset.json pointer in src/assets (committing it exceeds the 10 MB repo limit). The ONNX Runtime wasm/.mjs loader files come from node_modules via `?url` imports instead: the asset CDN serves .mjs as text/plain, which browsers refuse to import as a module.
- When diagnostic detections were used, the response carries detectionSource "yolo" and the UI shows the trained-model wording instead of the estimated-boxes wording.