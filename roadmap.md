# Tasks

- [x] Deliver CircuitDiagIA independent Vercel source ZIP with OpenAI, external Supabase login, professional profiles, private diagnostic records and setup SQL; preserve original application. Copy compiles, types and 31 tests pass; SQL privacy/quota tested in isolated PostgreSQL. Login screen and packaged resources checked. External account configuration, OpenAI and real hosted save/read remain unverified until the user configures their services.

- [x] Align Nano DC firmware and French/English guide with one shared downloadable code, only A0 enabled initially, no pseudo-continuity or universal fault thresholds; validate serial CSV and scan-command success. Seven tests pass; guide/download verified in browser. Firmware upload and physical measurements are not verified without the user's Nano.

- [x] Strengthen defective/burned solder inspection. Deployed; 16 validation tests pass; fresh real-photo upload returned HTTP 200 and solder assessment with macro-photo limitations. This AI-fallback check did not use YOLO and does not validate accuracy on known defective joints.
- [x] Independent archive request superseded by CircuitDiagIA export with user login and professional profiles, per the user's updated requirements.

- [x] Strengthen real-photo inspection of visible traces, component bodies and resistors. Deployed and checked through a fresh photo upload (HTTP 200, 11 components, trace assessment and macro-photo limitations); 14 validation tests pass. This check used AI fallback, not YOLO, and does not establish defect-detection accuracy or electrical functionality.

- [x] Integrate a trained YOLO component model (10 classes, pcb-component-detection-dataset-yolo, CC BY 4.0): browser-side ONNX detection (src/lib/yoloDetector.ts) feeds analyze-circuit, which copies detection boxes exactly and only assigns condition; verified end-to-end with a real PCB photo (12 localized components) and a direct function check (detectionSource "yolo", box copied verbatim). Twelve validation tests pass.
- [x] Fix the Colab training notebook: the FICS-PCB download link was dead (404) and a cell referenced an undefined variable; now clones the real dataset repo with a pretrained checkpoint and a fast export mode (entrenar_yolo_pcb.ipynb in Files).
- [x] Prioritize individual small SMD diodes, capacitors, resistors, and chips. Real close-up verification returned LEDs, a probable resistor network, chips and a capacitor; coverage and exact references remain unreliable, not guaranteed. Nine validation tests pass.
- [x] Show identified components with named boxes automatically; verified a real uploaded PCB photo with seven localized components, selection, and hiding. On small screens, use numbered boxes with full names below.
- [x] Repair and verify real photo analysis and input validation without simulated diagnoses; keep localization uncertainty visible because live photo testing revealed localization errors.
- [x] Review the existing physical measurement support and identify safety limitations.
- [x] Recommend an initial shopping kit for Canada for computer and phone boards, for a user with no equipment.
- [ ] Specify final board wiring and verify physical Nano readings. Blocked: exact board, ground, safe test points and multimeter readings must be identified; unknown computer/phone rails cannot be connected directly. Nano-only DC firmware is ready for the two-AA check, not hardware-verified.
- [x] Detect micro SMD components (tiled YOLO + keep every detection)
- [x] Professional redesign: hero, how-it-works, report header, PDF export, demo mode
- [x] Professional block schematic generated from the analyzed board (SVG download, demo copy)
- [x] Component-level schematic (symbols + net labels) from the board
- [x] Wired KiCad-style schematic (zigzag resistors, numbered pins, green wires)
