const KEY = "pixel_clicker_v2_ach";
const $ = (id) => document.getElementById(id);
// UI
const scoreEl = $("score");
const perClickEl = $("perClick");
const perSecEl = $("perSec");
const pixelBtn = $("pixelBtn");
const resetBtn = $("resetBtn");
const clickUpgPriceEl = $("clickUpgPrice");
const clickUpgCountEl = $("clickUpgCount");
const buyClickUpgBtn = $("buyClickUpg");
const autoPriceEl = $("autoPrice");
const autoCountEl = $("autoCount");
const buyAutoBtn = $("buyAuto");
const achListEl = $("achList");
const achProgressEl = $("achProgress");
const toastEl = $("toast");
// ---- Достижения (список правил)
const ACHIEVEMENTS = [
  { id: "click_1",    title: "Первый клик",        desc: "Сделайте 1 клик.",                 check: (s) => s.totalClicks >= 1 },
  { id: "click_50",   title: "Разогнался",         desc: "Сделайте 50 кликов.",              check: (s) => s.totalClicks >= 50 },
  { id: "score_100",  title: "Сотка",             desc: "Наберите 100 очков.",               check: (s) => s.totalEarned >= 100 },
  { id: "score_1000", title: "Тысяча",            desc: "Наберите 1 000 очков.",             check: (s) => s.totalEarned >= 1000 },
  { id: "buy_1",      title: "Первая покупка",    desc: "Купите любое улучшение 1 раз.",     check: (s) => s.totalBuys >= 1 },
  { id: "auto_1",     title: "Пассивный доход",   desc: "Купите 1 автокликер.",              check: (s) => s.autoCount >= 1 },
  { id: "perclick_10",title: "Сильный палец",     desc: "Доведите “за клик” до 10.",         check: (s) => s.perClick >= 10 },
  { id: "persec_5",   title: "Мини-ферма",        desc: "Доведите автоклик до 5/сек.",       check: (s) => s.perSec >= 5 },
];
function defaultState(){
  return {
    score: 0,
    perClick: 1,
    perSec: 0,
    clickUpgCount: 0,
    autoCount: 0,
    clickUpgPrice: 10,
    autoPrice: 25,
    totalClicks: 0,     // всего кликов по кнопке
    totalEarned: 0,     // всего заработано очков (за всё время)
    totalBuys: 0,       // всего покупок
    unlocked: {},       // { achievementId: true }
    lastTick: Date.now()
  };
}
let state = defaultState();
function fmt(n){
  return Math.floor(n).toLocaleString("ru-RU");
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return;
    const data = JSON.parse(raw);
    if(!data || typeof data !== "object") return;
    state = { ...defaultState(), ...data };
    if(typeof state.lastTick !== "number") state.lastTick = Date.now();
    if(!state.unlocked || typeof state.unlocked !== "object") state.unlocked = {};
  } catch {}
}
function save(){
  localStorage.setItem(KEY, JSON.stringify(state));
}
function addScore(amount){
  state.score += amount;
  if(state.score < 0) state.score = 0;
  // totalEarned считаем только когда прибавляем (а не тратим)
  if(amount > 0) state.totalEarned += amount;
}
function showToast(text){
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1400);
}
function renderShopAndStats(){
  scoreEl.textContent = fmt(state.score);
  perClickEl.textContent = fmt(state.perClick);
  perSecEl.textContent = fmt(state.perSec);
  clickUpgPriceEl.textContent = fmt(state.clickUpgPrice);
  clickUpgCountEl.textContent = fmt(state.clickUpgCount);
  autoPriceEl.textContent = fmt(state.autoPrice);
  autoCountEl.textContent = fmt(state.autoCount);
  buyClickUpgBtn.disabled = state.score < state.clickUpgPrice;
  buyAutoBtn.disabled = state.score < state.autoPrice;
}
function renderAchievements(){
  const total = ACHIEVEMENTS.length;
  const unlockedCount = ACHIEVEMENTS.reduce((acc, a) => acc + (state.unlocked[a.id] ? 1 : 0), 0);
  achProgressEl.textContent = `${unlockedCount}/${total}`;
  achListEl.innerHTML = ACHIEVEMENTS.map(a => {
    const isUnlocked = !!state.unlocked[a.id];
    return `
      <div class="ach">
        <div class="achLeft">
          <strong>${a.title}</strong>
          <div class="desc">${a.desc}</div>
        </div>
        <div class="badge ${isUnlocked ? "unlocked" : "locked"}">
          ${isUnlocked ? "Открыто" : "Закрыто"}
        </div>
      </div>
    `;
  }).join("");
}
function checkAchievements(){
  let unlockedNow = 0;
  for(const a of ACHIEVEMENTS){
    if(state.unlocked[a.id]) continue;
    if(a.check(state)){
      state.unlocked[a.id] = true;
      unlockedNow++;
      showToast(`Достижение: ${a.title}`);
    }
  }
  if(unlockedNow > 0){
    renderAchievements();
    save();
  }
}
function clickOnce(){
  state.totalClicks += 1;
  addScore(state.perClick);
  renderShopAndStats();
  save();
  checkAchievements();
}
function buyClickUpgrade(){
  if(state.score < state.clickUpgPrice) return;
  addScore(-state.clickUpgPrice);
  state.perClick += 1;
  state.clickUpgCount += 1;
  state.totalBuys += 1;
  state.clickUpgPrice = Math.ceil(state.clickUpgPrice * 1.35 + 1);
  renderShopAndStats();
  save();
  checkAchievements();
}
function buyAuto(){
  if(state.score < state.autoPrice) return;
  addScore(-state.autoPrice);
  state.perSec += 1;
  state.autoCount += 1;
  state.totalBuys += 1;
  state.autoPrice = Math.ceil(state.autoPrice * 1.45 + 2);
  renderShopAndStats();
  save();
  checkAchievements();
}
function tick(){
  const now = Date.now();
  const dt = (now - state.lastTick) / 1000;
  state.lastTick = now;
  if(state.perSec > 0 && dt > 0){
    addScore(state.perSec * dt);
    renderShopAndStats();
    save();
    checkAchievements();
  }
}
// events
pixelBtn.addEventListener("click", clickOnce);
buyClickUpgBtn.addEventListener("click", buyClickUpgrade);
buyAutoBtn.addEventListener("click", buyAuto);
window.addEventListener("keydown", (e) => {
  if(e.code === "Space"){
    e.preventDefault();
    clickOnce();
  }
});
resetBtn.addEventListener("click", () => {
  if(!confirm("Сбросить прогресс (очки, магазин, достижения)?")) return;
  localStorage.removeItem(KEY);
  state = defaultState();
  renderShopAndStats();
  renderAchievements();
  save();
});
// init + offline gain (max 6 hours)
load();
const now = Date.now();
const offlineSec = Math.min(6 * 3600, Math.max(0, (now - state.lastTick) / 1000));
if(state.perSec > 0 && offlineSec > 0){
  addScore(state.perSec * offlineSec);
}
state.lastTick = now;
renderShopAndStats();
renderAchievements();
save();
checkAchievements();
setInterval(tick, 200);