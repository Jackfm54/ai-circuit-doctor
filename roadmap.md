# Tasks

- [x] Add YOLO26 ONNX inference and a Python exporter; verify official weights with a real image in the browser and coordinate tests.
- [ ] Use YOLO26 for PCB fault detection. Blocked: a labeled PCB dataset and trained PCB-specific weights are not supplied; COCO weights do not detect electrical faults.
- [x] Repair and verify real photo analysis and input validation without simulated diagnoses; show estimated coordinates only on request because live photo testing revealed localization errors.
- [x] Review the existing physical measurement support and identify safety limitations.
- [x] Recommend an initial shopping kit for Canada for computer and phone boards, for a user with no equipment.
- [ ] Specify final wiring and compatible measurement firmware. Blocked: the exact board and safe test points must be identified; direct Arduino connections are not suitable for unknown computer or phone rails.