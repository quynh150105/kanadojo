import assert from "node:assert/strict";
import test from "node:test";
import { createSession, rateSession } from "../src/study.js";
import { PROGRESS_KEY, createProgressStorage } from "../src/progressStorage.js";

test("absent progress starts empty; saved progress survives a new storage instance", async () => {
  let stored = null;
  const adapter = {
    async getItem(key) { assert.equal(key, PROGRESS_KEY); return stored; },
    async setItem(key, value) { assert.equal(key, PROGRESS_KEY); stored = value; },
  };
  const progress = createProgressStorage(adapter);
  assert.equal(await progress.load(), null);
  const session = rateSession(createSession("forward"), false);
  await progress.save(session);
  assert.deepEqual(await createProgressStorage(adapter).load(), session);
});

test("writes are serialized and snapshot state before waiting for older writes", async () => {
  let releaseFirst;
  let stored = null;
  const calls = [];
  const progress = createProgressStorage({
    async getItem() { return stored; },
    async setItem(key, value) {
      calls.push(JSON.parse(value).position);
      if (calls.length === 1) await new Promise((resolve) => { releaseFirst = resolve; });
      stored = value;
    },
  });
  const first = createSession("forward");
  const latest = rateSession(first, true);
  const writingFirst = progress.save(first);
  const writingLatest = progress.save(latest);
  first.position = 10;
  await new Promise(setImmediate);
  assert.deepEqual(calls, [0]);
  releaseFirst();
  await Promise.all([writingFirst, writingLatest]);
  assert.deepEqual(calls, [0, 1]);
  assert.deepEqual(await progress.load(), latest);
});

test("a failed write rejects its caller without blocking later saves", async () => {
  let attempts = 0;
  let stored = null;
  const progress = createProgressStorage({
    async getItem() { return stored; },
    async setItem(key, value) {
      attempts++;
      if (attempts === 1) throw new Error("storage unavailable");
      stored = value;
    },
  });
  const session = createSession("reverse");
  const failed = progress.save(session);
  const latest = rateSession(session, false);
  const saved = progress.save(latest);
  await assert.rejects(failed, /storage unavailable/);
  await saved;
  assert.equal(attempts, 2);
  assert.deepEqual(await progress.load(), latest);
});

test("read failures and corrupt data are surfaced without overwriting storage", async () => {
  let writes = 0;
  const corrupt = createProgressStorage({
    async getItem() { return "broken"; },
    async setItem() { writes++; },
  });
  await assert.rejects(corrupt.load());
  const unavailable = createProgressStorage({
    async getItem() { throw new Error("cannot read"); },
    async setItem() { writes++; },
  });
  await assert.rejects(unavailable.load(), /cannot read/);
  assert.equal(writes, 0);
});
