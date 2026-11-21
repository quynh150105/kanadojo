const chars = [
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
const $ = (x) => document.getElementById(x);
const ratings = new Map();
let deck = [],
  pos = 0,
  flipped = false,
  swipeStart = null,
  suppressCardClick = false;
function shuffle(a) {
  let copy = [...a];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function start(mode = $("mode").value) {
  let pool =
    mode === "vowels"
      ? chars.slice(0, 20)
      : mode === "middle"
        ? chars.slice(20, 38)
        : mode === "last"
          ? chars.slice(38)
          : mode === "missed"
            ? chars.filter((c) => ratings.get(c[0]) === false)
            : chars;
  if (!pool.length) {
    alert("Chưa có chữ sai để ôn. Hãy luyện một lượt trước!");
    $("mode").value = "all";
    pool = chars;
  }
  const ordered = mode === "forward" || mode === "reverse";
  deck = ordered ? [...pool] : shuffle(pool);
  if (mode === "reverse") deck.reverse();
  $("restart").textContent = ordered ? "↻ Bắt đầu lại" : "🔀 Xáo trộn lại";
  pos = 0;
  suppressCardClick = false;
  $("practice").classList.remove("hidden");
  $("complete").classList.add("hidden");
  render();
}
function render() {
  swipeStart = null;
  const good = deck.filter((c) => ratings.get(c[0]) === true).length;
  const bad = deck.filter((c) => ratings.get(c[0]) === false).length;
  $("right").textContent = good;
  $("wrong").textContent = bad;
  $("previous").disabled = pos === 0;
  if (pos >= deck.length) {
    $("practice").classList.add("hidden");
    $("complete").classList.remove("hidden");
    $("result").textContent =
      `Trong bộ này: Đã nhớ ${good}/${deck.length} · Cần ôn ${bad} chữ · Chưa đánh dấu ${deck.length - good - bad} chữ. ${good === deck.length ? "Xuất sắc, bạn đã đánh dấu nhớ toàn bộ chữ trong bộ này!" : "Làm lại hoặc ôn những chữ sai để luyện thêm."}`;
    $("retryMissed").disabled = ![...ratings.values()].includes(false);
    return;
  }
  flipped = false;
  $("card").classList.remove("flipped");
  $("card").setAttribute("aria-pressed", "false");
  $("front").textContent = deck[pos][0];
  $("backKana").textContent = deck[pos][0];
  $("backRoman").textContent = deck[pos][1];
  const rating = ratings.get(deck[pos][0]);
  $("cardStatus").textContent = `HIRAGANA · ${rating === undefined ? "Chưa đánh dấu" : rating ? "Đã nhớ" : "Chưa nhớ"}`;
  $("progressText").textContent = `${pos + 1}/${deck.length}`;
  $("progressBar").style.width = `${(pos / deck.length) * 100}%`;
  $("tip").textContent = "Thử đọc thành tiếng trước khi lật thẻ.";
}
function flip() {
  if (pos >= deck.length) return;
  flipped = !flipped;
  $("card").classList.toggle("flipped", flipped);
  $("card").setAttribute("aria-pressed", flipped ? "true" : "false");
  $("tip").textContent = flipped
    ? "Đọc đúng ngay không cần nhẩm? Chọn “Đã nhớ”."
    : "Thử đọc thành tiếng trước khi lật thẻ.";
}
function nextCard() {
  if (pos >= deck.length) return;
  pos++;
  render();
}
function previousCard() {
  if (pos <= 0 || pos >= deck.length) return;
  pos--;
  render();
}
function answer(ok) {
  if (pos >= deck.length) return;
  ratings.set(deck[pos][0], ok);
  nextCard();
}
$("card").addEventListener("click", (e) => {
  if (suppressCardClick && e.detail !== 0) {
    suppressCardClick = false;
    return;
  }
  flip();
});
$("card").addEventListener("pointerdown", (e) => {
  if (!e.isPrimary || e.button !== 0 || pos >= deck.length) return;
  suppressCardClick = false;
  swipeStart = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
  $("card").setPointerCapture(e.pointerId);
});
$("card").addEventListener("pointerup", (e) => {
  if (!swipeStart || swipeStart.pointerId !== e.pointerId) return;
  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
    suppressCardClick = true;
    if (dx < 0) previousCard();
    else nextCard();
  }
});
function cancelSwipe(e) {
  if (swipeStart?.pointerId === e.pointerId) swipeStart = null;
}
$("card").addEventListener("pointercancel", cancelSwipe);
$("card").addEventListener("lostpointercapture", cancelSwipe);
$("correct").addEventListener("click", () => answer(true));
$("incorrect").addEventListener("click", () => answer(false));
$("previous").addEventListener("click", previousCard);
$("next").addEventListener("click", nextCard);
$("restart").addEventListener("click", () => start());
$("mode").addEventListener("change", () => start());
$("retryMissed").addEventListener("click", () => {
  $("mode").value = "missed";
  start("missed");
});
$("retryAll").addEventListener("click", () => {
  $("mode").value = "all";
  start("all");
});
document.addEventListener("keydown", (e) => {
  if (
    e.target.tagName === "SELECT" ||
    (e.target.tagName === "BUTTON" && e.key === " ")
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    flip();
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    answer(false);
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    answer(true);
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    nextCard();
  }
});
start();
