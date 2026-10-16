 # Project rules

- Keep photo validation and diagnostic normalization in the analyze-circuit function's pure validation module so the same rules can be tested without calling AI.
- Preserve uploaded image MIME types in diagnostic requests so the model sees the correct image encoding.
- Preserve the language context identity across Vite hot updates so mounted providers and refreshed consumers do not become disconnected.