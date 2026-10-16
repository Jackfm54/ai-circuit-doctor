"""Run locally: pip install ultralytics==8.4.178 onnx onnxscript
python export_yolo26.py --weights path/to/best.pt --data pcb.yaml --output-dir exported
Without custom weights this exports COCO general objects, NOT PCB faults.
"""
import argparse
import json
import shutil
from pathlib import Path
from ultralytics import YOLO

parser = argparse.ArgumentParser()
parser.add_argument("--weights", default="yolo26n.pt")
parser.add_argument("--data", help="Optional labeled dataset YAML for validation, e.g. pcb.yaml or coco.yaml")
parser.add_argument("--image", help="Optional real image for inference")
parser.add_argument("--output-dir", default="exported")
args = parser.parse_args()
model = YOLO(args.weights)
if args.image:
    model.predict(args.image, nms=False, imgsz=640, save=True)
if args.data:
    metrics = model.val(data=args.data, nms=False, imgsz=640)
    print("mAP50-95:", metrics.box.map)
exported = Path(model.export(format="onnx", nms=False, imgsz=640, dynamic=False, simplify=False, opset=17))
output = Path(args.output_dir)
output.mkdir(parents=True, exist_ok=True)
destination = output / "model.onnx"
if exported.resolve() != destination.resolve():
    shutil.copy2(exported, destination)
names = model.names
labels = [names[i] for i in range(len(names))]
(output / "labels.json").write_text(json.dumps(labels, ensure_ascii=False), encoding="utf-8")
print("Exported:", destination, output / "labels.json")
print("Detection scores are not probabilities of an electrical fault.")