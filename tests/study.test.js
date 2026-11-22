import assert from "node:assert/strict";
import test from "node:test";
import { chars, modes, createSession, moveSession, rateSession, getCounts, restoreSession } from "../src/study.js";

const kana = [..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"];

test("all 46 characters and seven modes retain their original content and pools", () => {
  assert.deepEqual(chars.map(([key]) => key), kana);
  assert.equal(modes.length, 7);
  assert.deepEqual(createSession("forward").deck, kana);
  assert.deepEqual(createSession("reverse").deck, [...kana].reverse());
  for (const [mode, expected] of [
    ["all", kana], ["vowels", kana.slice(0, 20)], ["middle", kana.slice(20, 38)], ["last", kana.slice(38)],
  ]) {
    const deck = createSession(mode).deck;
    assert.equal(new Set(deck).size, expected.length);
    assert.deepEqual([...deck].sort(), [...expected].sort());
  }
  assert.deepEqual(createSession("forward").deck, kana);
});

test("navigation preserves ratings, bounds and the saved order", () => {
  let session = createSession("forward");
  assert.equal(moveSession(session, -1), session);
  session = rateSession(session, true);
  assert.equal(session.position, 1);
  session = moveSession(session, -1);
  assert.equal(session.deck[session.position], "あ");
  assert.deepEqual(getCounts(session), { good: 1, bad: 0, unmarked: 45 });
  session = rateSession(session, true);
  assert.deepEqual(getCounts(session), { good: 1, bad: 0, unmarked: 45 });
  session = rateSession(moveSession(session, -1), false);
  assert.deepEqual(getCounts(session), { good: 0, bad: 1, unmarked: 45 });
  const complete = moveSession(session, 46);
  assert.equal(complete.position, 46);
  assert.equal(moveSession(complete, -1), complete);
  assert.equal(rateSession(complete, true), complete);
});

test("shuffle, mode changes and restarting retain each word's latest rating", () => {
  const ratings = { "あ": true, "い": false, "ん": true };
  for (const mode of modes.map(({ value }) => value)) {
    const session = createSession(mode, ratings);
    assert.deepEqual(session.ratings, ratings);
    assert.equal(session.position, 0);
  }
  assert.deepEqual(createSession("missed", ratings).deck, ["い"]);
  assert.equal(createSession("missed", { "あ": true }).mode, "all");
  assert.deepEqual(getCounts(createSession("vowels", ratings)), { good: 1, bad: 1, unmarked: 18 });
  assert.deepEqual(ratings, { "あ": true, "い": false, "ん": true });
});

test("storage roundtrip restores exact mode, shuffled order, position and marks", () => {
  let session = createSession("all");
  session = rateSession(session, false);
  session = rateSession(session, true);
  session = moveSession(session, -1);
  assert.deepEqual(restoreSession(JSON.stringify(session)), session);
  let missed = createSession("missed", session.ratings);
  missed = rateSession(missed, true);
  assert.deepEqual(restoreSession(JSON.stringify(missed)), missed);
  assert.deepEqual(getCounts(missed), { good: 1, bad: 0, unmarked: 0 });
});

test("corrupt, incompatible and impossible saved progress is rejected", () => {
  const valid = createSession("forward", { "あ": true });
  assert.throws(() => restoreSession("not json"));
  for (const invalid of [
    null, [], {}, { ...valid, version: 2 }, { ...valid, mode: "unknown" },
    { ...valid, ratings: null }, { ...valid, ratings: [] },
    { ...valid, ratings: { "あ": "true" } }, { ...valid, ratings: { unknown: true } },
    { ...valid, deck: [] }, { ...valid, deck: null }, { ...valid, deck: ["あ", "あ"] },
    { ...valid, deck: [...kana.slice(0, -1), "unknown"] },
    { ...valid, deck: [...kana].reverse() }, { ...valid, mode: "vowels" },
    { ...valid, position: -1 }, { ...valid, position: 47 }, { ...valid, position: 0.5 },
    { ...valid, mode: "missed", deck: ["い"] },
  ]) {
    assert.throws(() => restoreSession(JSON.stringify(invalid)));
  }
});
