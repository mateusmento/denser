import assert from "node:assert/strict";
import { test } from "node:test";
import { messageFromApiBody } from "./api-error-message.ts";

test("reads Invalid stage transition from the API body", () => {
  assert.equal(
    messageFromApiBody({ error: "Invalid stage transition" }),
    "Invalid stage transition",
  );
});

test("falls back when the body has no error string", () => {
  assert.equal(messageFromApiBody(null), "Couldn’t update stage");
  assert.equal(messageFromApiBody({}), "Couldn’t update stage");
});
