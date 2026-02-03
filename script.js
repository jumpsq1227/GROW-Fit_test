/* =========================================================
   1) 定数・設定
========================================================= */
// プレイヤー管理
const players = ["おがわ", "いまえだ", "わたなべ"];

// 初期ステータス
const defaultStatus = { run: 1, chest: 1, back: 1, leg: 1 };

// 週4回ベース（安定ゾーン）
const WEEK_TARGET = 4;
// ===== 週4達成ボーナス =====
let weeklyBonusGranted = false; // その週で既に付与したか

// プロテインスライム（特別遭遇）
const proteinSlime = {
  name: "プロテインスライム",
  level: 1,
  image: "images/monster/proteinslime.png",
  special: "protein"
};

// 出現率パラメータ（公平性 + 必要性）
const SLIME = {
  pMin: 0.08,     // 最低保証
  pMax: 0.45,     // 出過ぎ防止
  kRisk: 0.55,    // 離脱リスク寄与
  kStreak: 0.25,  // ←週4達成度に使う（名前は最小変更で据え置き）
  cooldownDays: 2 // 連日出現抑制
};

// 表示用ラベル
const muscleLabel = { run: "体力", chest: "胸筋", back: "背筋", leg: "脚力" };

// トレーニング定義
const trainingInfo = {
  run:   { label: "体力", image: "images/run.png" },
  chest: { label: "胸筋", image: "images/chest.png" },
  back:  { label: "背筋", image: "images/back.png" },
  leg:   { label: "脚力", image: "images/leg.png" }
};

// 技関係
const monsterHpText = document.getElementById("monsterHpText");
const monsterHpFill = document.getElementById("monsterHpFill");
const skillSelect = document.getElementById("skillSelect");
const skillUseBtn = document.getElementById("skillUseBtn");

const SKILLS = {
  run:  (lv) => ({ key:"run",  name: `剣技Lv${lv}`,  dmg: 30 + lv*2 }),
  chest:(lv) => ({ key:"chest",name:`拳技Lv${lv}`,    dmg: 30 + lv*2 }),
  back: (lv) => ({ key:"back", name:`背負投げLv${lv}`,  dmg: 30 + lv*2 }),
  leg:  (lv) => ({ key:"leg",  name:`蹴り技Lv${lv}`,dmg: 30 + lv*2 }),
};

// モンスター一覧（通常進行）
const monsterList = [
  { name: "スライム", level: 5, image: "images/monster/slime.png" },
  { name: "スライムちょい強", level: 7, image: "images/monster/slime.png" },
  { name: "ゴースト", level: 9, image: "images/monster/ghost.png" },
  { name: "ハンバーガーゴーレム", level: 12, image: "images/monster/golem.png" },
　{ name: "スライム強", level: 14, image: "images/monster/slime.png" },
  { name: "がいこつ戦士", level: 16, image: "images/monster/skeleton.png" },
  { name: "ぽっちゃりドラゴン", level: 20, image: "images/monster/dragon.png" },
  { name: "魔王", level: 28, image: "images/monster/maou.png" },
  { name: "ボディービルダー", level: 35, image: "images/monster/bodybuilder.png" },
  { name: "ボディービルダー【強】", level: 42, image: "images/monster/bodybuilder2.png" },
];

// SE
const seLevelUp = new Audio("sound/levelup.mp3");
const seWin     = new Audio("sound/win.mp3");
const seLose    = new Audio("sound/lose.mp3");
const seattack    = new Audio("sound/attack.mp3");
const setonext    = new Audio("sound/tonext.mp3");

// ジム城ビジュアル定義
const gymStages = [
  { min: 0, max: 24, image: "images/gym/gym_stage1.png", comment: "ジムはまだ復興が始まったばかりだ！" },
  { min: 25, max: 49, image: "images/gym/gym_stage2.png", comment: "あれ、筋肉の妖精が現れたようだ..." },
  { min: 50, max: 74, image: "images/gym/gym_stage3.png", comment: "あなたの頑張りでジムの復興が進み、\n筋肉の妖精が増えたようだ" },
  { min: 75, max: 99, image: "images/gym/gym_stage4.png", comment: "ジムは復興間近のようだ！\n筋肉の妖精が入会が増えてきた" },
  { min: 100, max: 100, image: "images/gym/gym_stage5.png", comment: "ジムは完全に復興した！\n豪華絢爛なジムには筋肉の妖精でにぎわっている\nマッスリーヌ姫：「ありがとう…ジムが息を吹き返しました！」" }
];

/* =========================================================
   2) 状態（プレイヤーごとのセーブ対象）
========================================================= */
let currentPlayer = null;

let status = { ...defaultStatus };
let worldRecovery = 0;           // 0〜100
let lastTrainingDate = null;     // "YYYY-MM-DD"

// 週4回カウント
let weekStartKey = null;         // その週の月曜キー
let weekTrainedDays = [];        // その週に実施した日付キー（重複なし）

// ストーリー
let storySeen = false;

// アイテム
let superDrinkCount = 0;
let doubleNextTraining = false;

// プロテインスライム抽選状態
let proteinSlimeReady = false;
let lastSlimeRollDate = null;
let slimeCooldownUntil = null;

// 進行
let currentMonsterIndex = 0;

/* =========================================================
   3) DOM
========================================================= */
// screens
const playerSelectScreen = document.getElementById("playerSelectScreen");
const mainScreen   = document.getElementById("main-screen");
const gymScreen    = document.getElementById("gym-screen");
const storyScreen  = document.getElementById("story-screen");

// player select
const playerSelect = document.getElementById("playerSelect");
const startBtn     = document.getElementById("startBtn");
const resetAllBtn  = document.getElementById("resetAllBtn");
const playerNameText = document.getElementById("playerNameText");
const storyNextBtn = document.getElementById("storyNextBtn");

// status/avatar
const HPLv    = document.getElementById("HPLv");
const chestLv = document.getElementById("chestLv");
const backLv  = document.getElementById("backLv");
const legLv   = document.getElementById("legLv");
const avatarImage = document.getElementById("avatarImage");

// world recovery (id重複対策で querySelectorAll を使う)
const weekCountText = document.getElementById("weekCountText");
const weekBarFill   = document.getElementById("weekBarFill");
const stabilityText = document.getElementById("stabilityText");
const reliabilityStars = document.getElementById("reliabilityStars");

// result/quest/gym
const resultText   = document.getElementById("resultText");
const monsterName  = document.getElementById("monsterName");
const monsterImage = document.getElementById("monsterImage");
const gymImage     = document.getElementById("gym-Image");
const gymComment   = document.getElementById("gymComment");

// items
const itemToggleBtn  = document.getElementById("itemToggleBtn");
const itemMenu       = document.getElementById("itemMenu");
const drinkCountText = document.getElementById("drinkCountText");
const useDrinkBtn    = document.getElementById("useDrinkBtn");
const itemHintText   = document.getElementById("itemHintText");

// banner
const newsBanner = document.getElementById("newsBanner");

// training menu
const toggleBtn = document.getElementById("trainingToggleBtn");
const menu      = document.getElementById("trainingMenu");

/* =========================================================
   4) 初期化
========================================================= */
initPlayerSelect();
bindEvents();

/* =========================================================
   5) ユーティリティ（日付・数学）
========================================================= */
function getTodayKeyTokyo() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

function getTokyoDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  return {
    y: Number(parts.find(p => p.type === "year").value),
    m: Number(parts.find(p => p.type === "month").value),
    d: Number(parts.find(p => p.type === "day").value),
  };
}

function toKey(y, m, d){
  const mm = String(m).padStart(2,"0");
  const dd = String(d).padStart(2,"0");
  return `${y}-${mm}-${dd}`;
}

// 月曜始まりの週開始キー
function getWeekStartKeyTokyo(date = new Date()){
  const {y,m,d} = getTokyoDateParts(date);
  const dt = new Date(y, m-1, d);
  const day = dt.getDay();        // 0:日 ... 6:土
  const shift = (day + 6) % 7;    // 月曜を0に揃える
  dt.setDate(dt.getDate() - shift);
  return toKey(dt.getFullYear(), dt.getMonth()+1, dt.getDate());
}

function diffDaysTokyo(fromKey, toKey) {
  const toDate = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const from = toDate(fromKey);
  const to = toDate(toKey);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

// 数学
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// SE
function playSE(se) {
  try {
    se.currentTime = 0;
    se.play();
  } catch (e) {}
}

/* =========================================================
   6) 週4カウント・表示系ヘルパ
========================================================= */
function updateWeeklyOnTraining(todayKey){
  const currentWeekStart = getWeekStartKeyTokyo();
  if (weekStartKey !== currentWeekStart) {
    weekStartKey = currentWeekStart;
    weekTrainedDays = [];
    weeklyBonusGranted = false;   // ★週ボーナスをリセット
  }
  if (!weekTrainedDays.includes(todayKey)) {
    weekTrainedDays.push(todayKey);
  }
}

function getStabilityLabel(count){
  if (count >= 6) return "状態：オーバーロード（やりすぎ注意）";
  if (count >= 4) return "状態：安定ゾーン";
  if (count >= 2) return "状態：回復中";
  return "状態：要支援";
}

function checkWeeklyBonus(){
  // 既に付与済みなら何もしない
  if (weeklyBonusGranted) return;

  // 週4達成した瞬間だけ
  if (weekTrainedDays.length >= WEEK_TARGET) {
    proteinSlimeReady = true;      // 次の討伐を確定スライムに
    weeklyBonusGranted = true;     // 今週はもう出さない
    saveStatus();

    // 演出（任意だが強くオススメ）
    setBanner("【週4達成】プロテインスライムが現れた！");
  }
}


function starsFromRisk(risk){
  const score = Math.round((1 - risk) * 5);
  const s = Math.max(1, Math.min(5, score));
  return "★".repeat(s) + "☆".repeat(5 - s);
}

/* =========================================================
   7) 信頼性工学（簡易）離脱リスク推定
========================================================= */
function calcDropoutRiskApprox() {
  const todayKey = getTodayKeyTokyo();

  // 離脱し始め（gapDays）が大きいほどリスク増
  let gapDays = 0;
  if (lastTrainingDate) gapDays = Math.max(0, diffDaysTokyo(lastTrainingDate, todayKey));

  // 次の敵が強いほどリスク増（詰み感）
  const heroLv = status.run + status.chest + status.back + status.leg;
  const nextMonster = monsterList[Math.min(currentMonsterIndex, monsterList.length - 1)];
  const ratio = (nextMonster.level + 1) / (heroLv + 1);
  const deltaD = Math.max(0, Math.log(ratio));

  // 支援要因：復興度 + 週4達成度（頭打ち）
  const weekCount = weekTrainedDays.length;
  const supportB = worldRecovery + 2.0 * Math.min(weekCount, WEEK_TARGET);

  // ロジスティックで0〜1へ
  const x = -2.2 + 1.3 * deltaD + 0.25 * gapDays - 0.03 * supportB;
  return clamp(sigmoid(x), 0, 1);
}

/* =========================================================
   8) プロテインスライム抽選（1日1回）
========================================================= */
function rollProteinSlimeIfNeeded() {
  const todayKey = getTodayKeyTokyo();
  if (lastSlimeRollDate === todayKey) return;
  if (proteinSlimeReady) { lastSlimeRollDate = todayKey; return; }

  const t = Date.now();
  if (slimeCooldownUntil && t < slimeCooldownUntil) {
    lastSlimeRollDate = todayKey;
    return;
  }

  const risk = calcDropoutRiskApprox();
  const weekTerm = clamp(Math.min(weekTrainedDays.length, WEEK_TARGET) / WEEK_TARGET, 0, 1);

  const p = clamp(
    SLIME.pMin + SLIME.kRisk * risk + SLIME.kStreak * weekTerm,
    SLIME.pMin,
    SLIME.pMax
  );

  if (Math.random() < p) {
    proteinSlimeReady = true;
    slimeCooldownUntil = t + SLIME.cooldownDays * 24 * 60 * 60 * 1000;
  }

  lastSlimeRollDate = todayKey;
  saveStatus();
}

/* =========================================================
   9) バナー（フェイク）
========================================================= */
function makeFakeActivityText() {
  const actions = ["胸トレ", "背中トレ", "脚トレ", "ランニング"]; // walk削除
  const when = ["先ほど", "さっき", "今日", "少し前に"][Math.floor(Math.random() * 4)];
  const a = actions[Math.floor(Math.random() * actions.length)];
  return `トレーニーおがわは${when}${a}を実行したようだ。`;
}

function setBanner(text) {
  if (!newsBanner) return;
  newsBanner.textContent = text;
  newsBanner.classList.remove("hidden");
  setTimeout(() => newsBanner.classList.add("hidden"), 8000);
}

function loadPlayerData(name) {
  const raw = localStorage.getItem(`muscleRPG_${name}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function calcDropoutRiskForPlayerData(p) {
  const todayKey = getTodayKeyTokyo();
  let gapDays = 0;
  if (p.lastTrainingDate) gapDays = Math.max(0, diffDaysTokyo(p.lastTrainingDate, todayKey));

  const st = p.status ?? { ...defaultStatus };
  const heroLv = (st.run ?? 1) + (st.chest ?? 1) + (st.back ?? 1) + (st.leg ?? 1);

  const idx = p.monsterIndex ?? 0;
  const m = monsterList[Math.min(idx, monsterList.length - 1)];
  const ratio = (m.level + 1) / (heroLv + 1);
  const deltaD = Math.max(0, Math.log(ratio));

  const wr = p.worldRecovery ?? 0;
  const wk = (p.weekTrainedDays ?? []).length;
  const supportB = wr + 2.0 * Math.min(wk, WEEK_TARGET);

  const x = -2.2 + 1.3 * deltaD + 0.25 * gapDays - 0.03 * supportB;
  return clamp(sigmoid(x), 0, 1);
}

function maybeShowNewsBanner() {
  if (!newsBanner) return;
  if (Math.random() > 0.55) return;

  const others = players.filter(n => n !== currentPlayer);
  const candidates = [];

  for (const n of others) {
    const data = loadPlayerData(n);
    if (!data) continue;
    const risk = calcDropoutRiskForPlayerData(data);
    if (risk >= 0.45) candidates.push({ name: n, risk });
  }
  if (candidates.length === 0) return;

  candidates.sort((a, b) => b.risk - a.risk);
  setBanner(makeFakeActivityText(candidates[0].name));
}

/* =========================================================
   10) 保存 / 読み込み
========================================================= */
function saveStatus() {
  const saveData = {
    status,
    monsterIndex: currentMonsterIndex,
    weeklyBonusGranted: weeklyBonusGranted,
    worldRecovery,
    lastTrainingDate,

    superDrinkCount,
    doubleNextTraining,

    proteinSlimeReady,
    lastSlimeRollDate,
    slimeCooldownUntil,

    weekStartKey,
    weekTrainedDays,
    storySeen,
  };
  localStorage.setItem(`muscleRPG_${currentPlayer}`, JSON.stringify(saveData));
}

function loadStatus() {
  const data = localStorage.getItem(`muscleRPG_${currentPlayer}`);
  if (data) {
    const parsed = JSON.parse(data);

    status = parsed.status ?? { ...defaultStatus };
    currentMonsterIndex = parsed.monsterIndex ?? 0;
    worldRecovery = parsed.worldRecovery ?? 0;
    lastTrainingDate = parsed.lastTrainingDate ?? null;
    weeklyBonusGranted = parsed.weeklyBonusGranted ?? false;
    superDrinkCount = parsed.superDrinkCount ?? 0;
    doubleNextTraining = parsed.doubleNextTraining ?? false;

    proteinSlimeReady = parsed.proteinSlimeReady ?? false;
    lastSlimeRollDate = parsed.lastSlimeRollDate ?? null;
    slimeCooldownUntil = parsed.slimeCooldownUntil ?? null;

    weekStartKey = parsed.weekStartKey ?? getWeekStartKeyTokyo();
    weekTrainedDays = parsed.weekTrainedDays ?? [];
    storySeen = parsed.storySeen ?? false;
  } else {
    status = { ...defaultStatus };
    currentMonsterIndex = 0;
    worldRecovery = 0;
    lastTrainingDate = null;

    superDrinkCount = 1;
    doubleNextTraining = false;

    proteinSlimeReady = false;
    lastSlimeRollDate = null;
    slimeCooldownUntil = null;

    weekStartKey = getWeekStartKeyTokyo();
    weekTrainedDays = [];
    storySeen = false;
  }
}

/* =========================================================
   11) UI更新
========================================================= */
function updateStatusView() {
  HPLv.textContent = status.run;
  chestLv.textContent = status.chest;
  backLv.textContent = status.back;
  legLv.textContent = status.leg;
}

function updateWorldView() {
  const v = Math.max(0, Math.min(100, worldRecovery));

  // id重複対策：main/gym 両方更新
  document.querySelectorAll("#worldRecoveryText")
    .forEach(el => el.textContent = `${v}%`);
  document.querySelectorAll("#worldRecoveryFill")
    .forEach(el => el.style.width = `${v}%`);

  const weekCount = weekTrainedDays.length;

  if (weekCountText) weekCountText.textContent = String(Math.min(weekCount, WEEK_TARGET));
  if (weekBarFill) {
    const ratio = Math.min(weekCount, WEEK_TARGET) / WEEK_TARGET;
    weekBarFill.style.width = `${Math.round(ratio * 100)}%`;
  }
  if (stabilityText) stabilityText.textContent = getStabilityLabel(weekCount);

  const risk = calcDropoutRiskApprox();
  if (reliabilityStars) reliabilityStars.textContent = starsFromRisk(risk);
}

function updateAvatarByTopStatus(preferType = null) {
  const types = ["run", "chest", "back", "leg"];
  let maxLv = -Infinity;
  for (const t of types) if (status[t] > maxLv) maxLv = status[t];
  const topTypes = types.filter(t => status[t] === maxLv);

  let chosen = topTypes[0];
  if (preferType && topTypes.includes(preferType)) chosen = preferType;

  const lv = status[chosen];
  avatarImage.src = `images/player/${chosen}_Lv${lv}.png`;
  avatarImage.onerror = () => {
    avatarImage.onerror = null;
    avatarImage.src = `images/player/${chosen}_LvMAX.png`;
  };
}

// アイテムUI
function updateItemView() {
  if (!drinkCountText || !useDrinkBtn || !itemHintText || !itemToggleBtn) return;

  drinkCountText.textContent = String(superDrinkCount);
  itemToggleBtn.textContent = `🥤×${superDrinkCount}`;

  if (doubleNextTraining) itemToggleBtn.classList.add("on");
  else itemToggleBtn.classList.remove("on");

  useDrinkBtn.disabled = (superDrinkCount <= 0) || doubleNextTraining;

  if (doubleNextTraining) {
    itemHintText.textContent = "【発動中】トレーニング後の復興度2倍！";
  } else if (superDrinkCount > 0) {
    itemHintText.textContent = "使うと、トレーニング後の復興度が2倍。";
  } else {
    itemHintText.textContent = "プロテインスライムを倒すと入手できます。";
  }
}

/* =========================================================
   12) ゲームロジック
========================================================= */
function getTopMuscle(preferType = null) {
  const types = ["run", "chest", "back", "leg"];
  let maxLv = -Infinity;
  for (const t of types) if (status[t] > maxLv) maxLv = status[t];
  const topTypes = types.filter(t => status[t] === maxLv);
  if (preferType && topTypes.includes(preferType)) return preferType;
  return topTypes[0];
}

// 新規判定：全Lv1 & story未閲覧
function isNewGame(){
  const allLv1 = status.run === 1 && status.chest === 1 && status.back === 1 && status.leg === 1;
  return allLv1 && !storySeen;
}

// トレーニング実行（walk削除でシンプル化）
function executeTraining(trainType) {
  if (!(trainType in status)) return;

  // ステータス成長
  status[trainType]++;

  // 週4カウント更新（同日複数回は1回）
  const todayKey = getTodayKeyTokyo();
  updateWeeklyOnTraining(todayKey);

  // ★ここでチェック
  checkWeeklyBonus();

  // 最終実施日（離脱リスク gapDays に使用）
  if (lastTrainingDate !== todayKey) lastTrainingDate = todayKey;

  // 今日1回だけ抽選
  rollProteinSlimeIfNeeded();

  // ジム復興（基本+2、スポドリで2倍）
  const before = worldRecovery;
  let inc = 2;

  if (doubleNextTraining) {
    inc *= 2;
    doubleNextTraining = false;
  }

  worldRecovery = Math.min(100, worldRecovery + inc);
  const gained = worldRecovery - before;

  // 保存＆表示更新
  saveStatus();
  updateStatusView();
  updateWorldView();
  updateItemView();

  const info = trainingInfo[trainType];
  updateAvatarByTopStatus(trainType);

  resultText.innerHTML =
    `今日もお疲れ様！\n${info.label} がレベルアップ！<br>
    自販機からプロテイン2本を購入<br>
     <span class="heal">ジムが${gained}%復興した</span>`;

  playSE(seLevelUp);

  const resultImage = document.getElementById("resultImage");
  resultImage.src = info.image;
  resultImage.classList.remove("hidden");

  switchScreen("result-screen");
  maybeShowNewsBanner();
}

function updateSkillSelect(){
  if (!skillSelect) return;
  skillSelect.innerHTML = "";

  const types = ["run","chest","back","leg"];
  for (const t of types){
    const lv = status[t];
    const s = SKILLS[t](lv);

    const opt = document.createElement("option");
    opt.value = t;                 // 属性キー
    opt.textContent = s.name;      // 表示名
    skillSelect.appendChild(opt);
  }
}

let monsterHp = 100; // 0〜100（割合管理でOK）

function setMonsterHp(pct){
  monsterHp = Math.max(0, Math.min(100, pct));
  if (monsterHpText) monsterHpText.textContent = `${monsterHp}%`;
  if (monsterHpFill) monsterHpFill.style.width = `${monsterHp}%`;
}

function startQuest() {
  const monster = proteinSlimeReady ? proteinSlime : monsterList[currentMonsterIndex];
  monsterName.textContent = `${monster.name} Lv ${monster.level}`;
  monsterImage.src = monster.image;
  setMonsterHp(100);
  updateSkillSelect();
  switchScreen("quest-screen");
}

function getMaxStatTypes(){
  const types = ["run","chest","back","leg"];
  let maxLv = -Infinity;
  for (const t of types) maxLv = Math.max(maxLv, status[t]);
  return types.filter(t => status[t] === maxLv);
}

function battle(){
  if (!skillSelect) return;

  const chosenType = skillSelect.value; // "run/chest/back/leg"
  const lv = status[chosenType];
  const skill = SKILLS[chosenType](lv);

  // まず“ダメージ演出”としてHPを減らす（勝ちでも負けでも）
  const afterHp = Math.max(0, monsterHp - Math.min(100, Math.round(skill.dmg)));
  setMonsterHp(afterHp);

  const maxTypes = getMaxStatTypes();
  const isBestSkill = maxTypes.includes(chosenType);

  // ちょい演出のため遅延（HP減ったのが見える）
  setTimeout(() => {
    if (isBestSkill) {
      // 一撃勝利（HPを0にして勝利リザルトへ）
      setMonsterHp(0);
      playSE(seWin);

      // プロテインスライム勝利処理も既存を活かすならここで分岐
      const monster = proteinSlimeReady ? proteinSlime : monsterList[currentMonsterIndex];
      if (monster.special === "protein") {
        proteinSlimeReady = false;
        superDrinkCount += 1;
        saveStatus();
        updateItemView();
        showResult(
          `一撃必殺！<br>
           <span class="heal">${skill.name}</span>！<br>
           <span class="heal">プロテインスライム</span>を倒した！<br>
           <span class="heal">超回復スポドリ</span>を手に入れた！`
        );
        return;
      }

      // 通常勝利（既存ロジック簡略）
      worldRecovery = Math.min(100, worldRecovery + 3);
      if (currentMonsterIndex < monsterList.length - 1) currentMonsterIndex++;
      saveStatus();
      updateWorldView();

      showResult(
        `一撃必殺！<br>
         <span class="heal">${skill.name}</span>！<br>
         モンスターを倒した！<br>
         <span class="heal">ジムが3%復興した</span>`
      );
    } else {
      // それ以外は即負け
      playSE(seLose);
      showResult(
        `あなたは<span class="heal">${skill.name}</span>を放った！<br>
         モンスターにダメージ！<br>
         …しかし隙を突かれた！<br>
         <span class="heal">一撃で倒されてしまった…</span>`
      );
    }
  }, 450);
}


function getGymStageByRecovery(recovery) {
  return gymStages.find(stage => recovery >= stage.min && recovery <= stage.max);
}

function visitGym() {
  const v = Math.max(0, Math.min(100, worldRecovery));
  document.querySelectorAll("#gym-screen #worldRecoveryText")
    .forEach(el => el.textContent = `${v}%`);
  document.querySelectorAll("#gym-screen #worldRecoveryFill")
    .forEach(el => el.style.width = `${v}%`);

  const stage = getGymStageByRecovery(v);
  gymImage.src = stage.image;
  gymImage.classList.remove("hidden");
  gymComment.textContent = stage.comment;

  switchScreen("gym-screen");
}

/* =========================================================
   13) 画面制御
========================================================= */
function showResult(html) {
  resultText.innerHTML = html;
  switchScreen("result-screen");
}

function backToMain() {
  document.getElementById("resultImage").classList.add("hidden");
  switchScreen("main-screen");
}

function switchScreen(id) {
  const screens = ["playerSelectScreen", "story-screen", "main-screen", "quest-screen", "result-screen", "gym-screen"];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.add("hidden");
  });
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
}

function backToPlayerSelect() {
  playerNameText.textContent = "";
  currentPlayer = null;
  switchScreen("playerSelectScreen");
}

/* =========================================================
   14) イベントバインド
========================================================= */
function initPlayerSelect() {
  players.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    playerSelect.appendChild(option);
  });
}

function bindEvents() {
  // item pop
  if (itemToggleBtn && itemMenu) {
    itemToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      itemMenu.classList.toggle("hidden");
    });
    itemMenu.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => {
      if (!itemMenu.classList.contains("hidden")) itemMenu.classList.add("hidden");
    });
  }

  if (useDrinkBtn) {
    useDrinkBtn.addEventListener("click", () => {
      if (superDrinkCount <= 0) {
        if (itemHintText) itemHintText.textContent = "超回復スポドリは持っていません！";
        return;
      }
      if (doubleNextTraining) {
        if (itemHintText) itemHintText.textContent = "すでに次回2倍が有効です。";
        return;
      }
      superDrinkCount -= 1;
      doubleNextTraining = true;
      saveStatus();
      updateItemView();
    });
  }

  // player start
  startBtn.addEventListener("click", () => {
    if (!playerSelect.value) {
      alert("プレイヤーを選択してください");
      return;
    }
    currentPlayer = playerSelect.value;
    
    playSE(setonext);

    loadStatus();
    updateStatusView();
    updateAvatarByTopStatus();
    updateItemView();
    updateWorldView();

  playerNameText.textContent = `トレーニー：${currentPlayer}`;

  // 新規開始のみストーリー
  if (isNewGame()) {
    switchScreen("story-screen");
    return;
  }
     
  // 通常はメイン
  switchScreen("main-screen");
  maybeShowNewsBanner();
});

  // story next
  if (storyNextBtn) {
    storyNextBtn.addEventListener("click", () => {
      storySeen = true;
      saveStatus();
      switchScreen("main-screen");
      maybeShowNewsBanner();
    });
  }

  // training menu
  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    playSE(setonext);
  });

  menu.addEventListener("click", (e) => {
    if (!e.target.dataset.train) return;
    const trainType = e.target.dataset.train;
    playSE(setonext);
    executeTraining(trainType);
    menu.classList.add("hidden");
  });

  // reset all
  resetAllBtn.addEventListener("click", () => {
    const ok = confirm("全プレイヤーのステータスと進行状況を初期化します。よろしいですか？");
    if (!ok) return;

    players.forEach(name => localStorage.removeItem(`muscleRPG_${name}`));

    currentPlayer = null;
    status = { ...defaultStatus };
    currentMonsterIndex = 0;
    worldRecovery = 0;
    lastTrainingDate = null;

    superDrinkCount = 0;
    doubleNextTraining = false;

    proteinSlimeReady = false;
    lastSlimeRollDate = null;
    slimeCooldownUntil = null;

    weekStartKey = getWeekStartKeyTokyo();
    weekTrainedDays = [];
    storySeen = false;

    updateStatusView();
    updateWorldView();
    updateAvatarByTopStatus();
    updateItemView();
    playerNameText.textContent = "";

    alert("全プレイヤーを初期化しました。");
  });
}









