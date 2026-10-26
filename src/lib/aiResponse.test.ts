import { test } from "node:test";
import assert from "node:assert/strict";
import { aiResponseError } from "./aiResponse";

test("402 is returned as a recoverable credit error rather than thrown", async () => {
  const result = await aiResponseError(new Response('{"error":"Not enough credits"}', { status: 402 }), "en", "Unavailable");
  assert.ok(result?.includes("Insufficient AI credits"));
});

test("successful responses remain readable by the caller", async () => {
  const response = new Response('{"components":[]}');
  assert.equal(await aiResponseError(response, "fr", "Unavailable"), null);
  assert.deepEqual(await response.json(), { components: [] });
});

test("non-JSON service errors use the fallback without throwing", async () => {
  assert.equal(await aiResponseError(new Response("Unavailable", { status: 503 }), "fr", "Retry"), "Retry");
});