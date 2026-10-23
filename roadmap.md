# Tasks

- [x] Integrate a trained YOLO component model (10 classes, pcb-component-detection-dataset-yolo, CC BY 4.0): browser-side ONNX detection (src/lib/yoloDetector.ts) feeds analyze-circuit, which copies detection boxes exactly and only assigns condition; verified end-to-end with a real PCB photo (12 localized components) and a direct function check (detectionSource "yolo", box copied verbatim). Twelve validation tests pass.
- [x] Fix the Colab training notebook: the FICS-PCB download link was dead (404) and a cell referenced an undefined variable; now clones the real dataset repo with a pretrained checkpoint and a fast export mode (entrenar_yolo_pcb.ipynb in Files).
- [x] Prioritize individual small SMD diodes, capacitors, resistors, and chips. Real close-up verification returned LEDs, a probable resistor network, chips and a capacitor; coverage and exact references remain unreliable, not guaranteed. Nine validation tests pass.
- [x] Show identified components with named boxes automatically; verified a real uploaded PCB photo with seven localized components, selection, and hiding. On small screens, use numbered boxes with full names below.
- [x] Repair and verify real photo analysis and input validation without simulated diagnoses; keep localization uncertainty visible because live photo testing revealed localization errors.
- [x] Review the existing physical measurement support and identify safety limitations.
- [x] Recommend an initial shopping kit for Canada for computer and phone boards, for a user with no equipment.
- [ ] Specify final wiring and compatible measurement firmware. Blocked: the exact board and safe test points must be identified; direct Arduino connections are not suitable for unknown computer or phone rails.- [x] Detect micro SMD components (tiled YOLO + keep every detection)
- [x] Professional redesign: hero, how-it-works, report header, PDF export, demo mode
