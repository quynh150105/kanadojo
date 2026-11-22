export const chars = [
  ["あ", "a"],
  ["い", "i"],
  ["う", "u"],
  ["え", "e"],
  ["お", "o"],
  ["か", "ka"],
  ["き", "ki"],
  ["く", "ku"],
  ["け", "ke"],
  ["こ", "ko"],
  ["さ", "sa"],
  ["し", "shi"],
  ["す", "su"],
  ["せ", "se"],
  ["そ", "so"],
  ["た", "ta"],
  ["ち", "chi"],
  ["つ", "tsu"],
  ["て", "te"],
  ["と", "to"],
  ["な", "na"],
  ["に", "ni"],
  ["ぬ", "nu"],
  ["ね", "ne"],
  ["の", "no"],
  ["は", "ha"],
  ["ひ", "hi"],
  ["ふ", "fu"],
  ["へ", "he"],
  ["ほ", "ho"],
  ["ま", "ma"],
  ["み", "mi"],
  ["む", "mu"],
  ["め", "me"],
  ["も", "mo"],
  ["や", "ya"],
  ["ゆ", "yu"],
  ["よ", "yo"],
  ["ら", "ra"],
  ["り", "ri"],
  ["る", "ru"],
  ["れ", "re"],
  ["ろ", "ro"],
  ["わ", "wa"],
  ["を", "wo"],
  ["ん", "n"],
];

export const modes = [
  { value: "all", label: "Tất cả 46 chữ (xáo trộn)" },
  { value: "forward", label: "A → N (46 chữ theo thứ tự)" },
  { value: "reverse", label: "N → A (46 chữ theo thứ tự ngược)" },
  { value: "vowels", label: "A → T (20 chữ)" },
  { value: "middle", label: "N → Y (18 chữ)" },
  { value: "last", label: "R → N (8 chữ)" },
  { value: "missed", label: "Ôn chữ sai" },
];

const kana = chars.map(([character]) => character);
const pools = {
  all: kana,
  forward: kana,
  reverse: [...kana].reverse(),
  vowels: kana.slice(0, 20),
  middle: kana.slice(20, 38),
  last: kana.slice(38),
};

export function createSession(mode = "all", ratings = {}) {
  if (!modes.some((item) => item.value === mode)) {
    throw new Error("Chế độ học không hợp lệ.");
  }
  let pool = mode === "missed" ? kana.filter((key) => ratings[key] === false) : pools[mode];
  if (!pool.length) {
    mode = "all";
    pool = kana;
  }
  const deck = [...pool];
  if (mode !== "forward" && mode !== "reverse") {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  return { version: 1, mode, deck, position: 0, ratings: { ...ratings } };
}

export function moveSession(session, delta) {
  if (session.position >= session.deck.length) return session;
  const position = Math.max(0, Math.min(session.deck.length, session.position + delta));
  return position === session.position ? session : { ...session, position };
}

export function rateSession(session, remembered) {
  if (session.position >= session.deck.length) return session;
  const key = session.deck[session.position];
  return {
    ...session,
    position: session.position + 1,
    ratings: { ...session.ratings, [key]: remembered },
  };
}

export function getCounts(session) {
  const good = session.deck.filter((key) => session.ratings[key] === true).length;
  const bad = session.deck.filter((key) => session.ratings[key] === false).length;
  return { good, bad, unmarked: session.deck.length - good - bad };
}

export function restoreSession(raw) {
  const session = JSON.parse(raw);
  if (
    !session ||
    session.version !== 1 ||
    !modes.some((item) => item.value === session.mode) ||
    !session.ratings ||
    typeof session.ratings !== "object" ||
    Array.isArray(session.ratings) ||
    Object.entries(session.ratings).some(([key, value]) => !kana.includes(key) || typeof value !== "boolean") ||
    !Array.isArray(session.deck) ||
    session.deck.length === 0 ||
    new Set(session.deck).size !== session.deck.length ||
    !Number.isInteger(session.position) ||
    session.position < 0 ||
    session.position > session.deck.length
  ) {
    throw new Error("Tiến độ đã lưu không hợp lệ.");
  }
  const expected = session.mode === "missed" ? kana : pools[session.mode];
  if (
    session.deck.some((key) => !expected.includes(key)) ||
    (session.mode !== "missed" && session.deck.length !== expected.length) ||
    ((session.mode === "forward" || session.mode === "reverse") &&
      session.deck.some((key, index) => key !== expected[index])) ||
    (session.mode === "missed" && session.deck.some((key) => typeof session.ratings[key] !== "boolean"))
  ) {
    throw new Error("Bộ từ đã lưu không hợp lệ.");
  }
  return {
    version: 1,
    mode: session.mode,
    deck: [...session.deck],
    position: session.position,
    ratings: { ...session.ratings },
  };
}
