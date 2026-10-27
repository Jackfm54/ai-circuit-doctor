import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseMeasurement } from "../src/lib/serialMeasurement";

test("Nano 115200 CSV protocol accepts a real CH1 voltage", () => {
  const reading = parseMeasurement("VOLTAGE,1,3.000,V,ok\r");
  assert.equal(reading?.channel, 1);
  assert.equal(reading?.value, 3);
  assert.equal(reading?.type, "voltage");
});
test("invalid numeric serial readings cannot reach analysis", () => {
  for (const line of ["VOLTAGE,1,NaN,V,ok", "VOLTAGE,0,3,V,ok", "VOLTAGE,1,,V,ok", "VOLTAGE,1,3,V,bad", "READY"]) {
    assert.equal(parseMeasurement(line), null);
  }
});
const firmware = readFileSync(new URL("../public/firmware/circuit_diagnostic.ino", import.meta.url), "utf8");
test("classic Nano starts with only wired A0 enabled", () => {
  assert.match(firmware, /CHANNEL_ENABLED\[\] = \{true, false, false, false, false, false, false, false\}/);
  assert.match(firmware, /Serial.begin\(115200\)/);
});
test("Nano transmits voltages without driving digital continuity pins or inventing voltage faults", () => {
  const executable = firmware.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  assert.doesNotMatch(executable, /INPUT_PULLUP|CONTINUITY|WARNING_LOW|ERROR_LOW/);
  assert.match(executable, /Serial.println\(",V,ok"\)/);
});