// プレイヤー管理
const players = ["おがわ", "すずき", "たなか"];
let currentPlayer = null;

// 初期ステータス（プレイヤー、ジム）
const defaultStatus = { run: 1, chest: 1, back: 1, leg: 1 };
let status = { ...defaultStatus };
let worldRecovery = 0;       // 0〜100
let streakDays = 0;          // 連続継続日数
let lastTrainingDate = null; // "YYYY-MM-DD"

// ===== アイテム =====
let superDrinkCount = 1;        // 超回復スポドリ所持数
let doubleNextTraining = false; // 次回トレ復興2倍フラグ（1回消費）

// ===== プロテインスライム（特別遭遇）=====
const proteinSlime = {
  name: "プロテインスライム",
  level: 1,
  image: "images/monster/proteinslime.png",
  special: "protein"
};

let proteinSlimeReady = false;  // 次のクエストがプロテインスライムになる
let lastSlimeRollDate = null;   // 1日1回抽選（YYYY-MM-DD）
let slimeCooldownUntil = null;  // epoch ms（連続出現抑制）

// ===== 信頼性・公平性ベースの出現率パラメータ =====
const SLIME = {
  pMin: 0.08,      // 継続者の最低保証（毎日8%程度）
  pMax: 0.45,      // 出過ぎ防止
  kRisk: 0.55,     // 離脱リスク寄与
  kStreak: 0.25,   // 継続寄与（streak/30）
  cooldownDays: 2  // 連日で出ないようにする
};

// ===== マッスル定義 =====
const muscleLabel = { run: "体力", chest: "胸筋", back: "背筋", leg: "脚力" };

// ===== トレーニング定義 =====
const trainingInfo = {
  run: { label: "体力", image: "images/run.png" },
  chest: { label: "胸筋", image: "images/chest.png" },
  back: { label: "背筋", image: "images/back.png" },
  leg: { label: "脚力", image: "images/leg.png" },
  walk: { label: "ウォーキング", image: "images/walk.png" }
};

// ===== モンスター一覧（通常進行）=====
const monsterList = [
  { name: "スライム", level: 5, image: "images/monster/slime.png" },
  { name: "ゴースト", level: 9, image: "images/monster/ghost.png" },
  { name: "ハンバーガーゴーレム", level: 12, image: "images/monster/golem.png" },
  { name: "がいこつ戦士", level: 16, image: "images/monster/skeleton.png" },
  { name: "ぽっちゃりドラゴン", level: 20, image: "images/monster/dragon.png" },
  { name: "魔王", level: 28, image: "images/monster/maou.png" },
  { name: "ボディービルダー", level: 35, image: "images/monster/bodybuilder.png" },
  { name: "ボディービルダー【強】", level: 42, image: "images/monster/bodybuilder2.png" },
];
let currentMonsterIndex = 0;

// ===== SE =====
const seLevelUp = new Audio("sounds/levelup.mp3");
const seWin = new Audio("sounds/win.mp3");
const seLose = new Audio("sounds/lose.mp3");

// 連続再生対策
function playSE(se) {
  try {
    se.currentTime = 0;
    se.play();
  } catch (e) {
    // 自動再生制限がある環境では無視
  }
}

// ===== ジム城ビジュアル定義 =====
const gymStages = [
  { min: 0, max: 24, image: "images/gym/gym_stage1.png", comment: "ジムはまだ復興が始まったばかりだ！" },
  { min: 25, max: 49, image: "images/gym/gym_stage2.png", comment: "あれ、筋肉の妖精が現れたようだ..." },
  { min: 50, max: 74, image: "images/gym/gym_stage3.png", comment: "あなたの頑張りでジムの復興が進み、\n筋肉の妖精が増えたようだ" },
  { min: 75, max: 99, image: "images/gym/gym_stage4.png", comment: "ジムは復興間近のようだ！\n筋肉の妖精が入会が増えてきた" },
  { min: 100, max: 100, image: "images/gym/gym_stage5.png", comment: "ジムは完全に復興した！\n豪華絢爛なジムには筋肉の妖精でにぎわっている\nマッスリーヌ姫：「ありがとう…ジムが息を吹き返しました！」" }
];

// ===== DOM =====
const playerSelectScreen = document.getElementById("playerSelectScreen");
const resetAllBtn = document.getElementById("resetAllBtn");

const mainScreen = document.getElementById("main-screen");
const playerSelect = document.getElementById("playerSelect");
const playerNameText = document.getElementById("playerNameText");
const startBtn = document.getElementById("startBtn");

const HPLv = document.getElementById("HPLv");
const chestLv = document.getElementById("chestLv");
const backLv = document.getElementById("backLv");
const legLv = document.getElementById("legLv");
const avatarImage = document.getElementById("avatarImage");

const worldRecoveryText = document.getElementById("worldRecoveryText");
const worldRecoveryFill = document.getElementById("worldRecoveryFill");
const streakDaysText = document.getElementById("streakDaysText");

const resultText = document.getElementById("resultText");
const monsterName = document.getElementById("monsterName");
const monsterImage = document.getElementById("monsterImage");

const gymScreen = document.getElementById("gym-screen");
const gymImage = document.getElementById("gym-Image");
const gymComment = document.getElementById("gymComment");

const itemToggleBtn = document.getElementById("itemToggleBtn");
const itemMenu = document.getElementById("itemMenu");
const drinkCountText = document.getElementById("drinkCountText");
const useDrinkBtn = document.getElementById("useDrinkBtn");
const itemHintText = document.getElementById("itemHintText");

const newsBanner = document.getElementById("newsBanner");

// ===== 初期処理 =====
function initPlayerSelect() {
  players.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    playerSelect.appendChild(option);
  });
}
initPlayerSelect();

// ===== 日付 =====
function getTodayKeyTokyo() {
  const parts = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

function isYesterdayTokyo(lastKey, todayKey) {
  const toDate = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const last = toDate(lastKey);
  const today = toDate(todayKey);
  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
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

// ===== 数学ユーティリティ =====
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// ===== 信頼性工学（簡易）リスク推定 =====
function calcDropoutRiskApprox() {
  const todayKey = getTodayKeyTokyo();
  let gapDays = 0;
  if (lastTrainingDate) gapDays = Math.max(0, diffDaysTokyo(lastTrainingDate, todayKey));

  const heroLv = status.run + status.chest + status.back + status.leg;
  const nextMonster = monsterList[Math.min(currentMonsterIndex, monsterList.length - 1)];
  const ratio = (nextMonster.level + 1) / (heroLv + 1);
  const deltaD = Math.max(0, Math.log(ratio));

  const supportB = worldRecovery + 2.0 * streakDays;
  const x = -2.2 + 1.3 * deltaD + 0.25 * gapDays - 0.03 * supportB;
  return clamp(sigmoid(x), 0, 1);
}

// ===== プロテインスライム抽選（1日1回 / 公平+必要の混合モデル）=====
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
  const streakTerm = clamp(streakDays / 30, 0, 1);

  const p = clamp(SLIME.pMin + SLIME.kRisk * risk + SLIME.kStreak * streakTerm, SLIME.pMin, SLIME.pMax);

  if (Math.random() < p) {
    proteinSlimeReady = true;
    slimeCooldownUntil = t + SLIME.cooldownDays * 24 * 60 * 60 * 1000;
  }

  lastSlimeRollDate = todayKey;
  saveStatus();
}

// ===== 近況バナー（フェイク）=====
function makeFakeActivityText(name) {
  const actions = ["胸トレ", "背中トレ", "脚トレ", "ランニング", "ウォーキング"];
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

  const streak = p.streakDays ?? 0;
  const wr = p.worldRecovery ?? 0;

  const st = p.status ?? { run: 1, chest: 1, back: 1, leg: 1 };
  const heroLv = (st.run ?? 1) + (st.chest ?? 1) + (st.back ?? 1) + (st.leg ?? 1);

  const idx = p.monsterIndex ?? 0;
  const m = monsterList[Math.min(idx, monsterList.length - 1)];
  const ratio = (m.level + 1) / (heroLv + 1);
  const deltaD = Math.max(0, Math.log(ratio));

  const supportB = wr + 2.0 * streak;
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

// ===== アイテムUI =====
function updateItemView() {
  if (!drinkCountText || !useDrinkBtn || !itemHintText) return;

  drinkCountText.textContent = String(superDrinkCount);

  const disabled = (superDrinkCount <= 0) || doubleNextTraining;
  useDrinkBtn.disabled = disabled;
  useDrinkBtn.style.opacity = disabled ? 0.6 : 1.0;

  if (doubleNextTraining) {
    itemHintText.textContent = "【発動中】次回トレーニングのジム復興が2倍！";
  } else {
    itemHintText.textContent = "プロテインスライムを倒すとスポドリを入手できます。";
  }
}

if (itemToggleBtn && itemMenu) {
  itemToggleBtn.addEventListener("click", () => {
    itemMenu.classList.toggle("hidden");
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

// ===== プレイヤー選択 =====
startBtn.addEventListener("click", () => {
  if (!playerSelect.value) {
    alert("プレイヤーを選択してください");
    return;
  }
  currentPlayer = playerSelect.value;

  loadStatus();
  updateStatusView();
  updateWorldView();
  updateAvatarByTopStatus();
  updateItemView();

  playerNameText.textContent = `トレーニー：${currentPlayer}`;
  playerSelectScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");

  maybeShowNewsBanner();
});

// ===== 保存 =====
function saveStatus() {
  const saveData = {
    status: status,
    monsterIndex: currentMonsterIndex,
    worldRecovery: worldRecovery,
    streakDays: streakDays,
    lastTrainingDate: lastTrainingDate,

    superDrinkCount: superDrinkCount,
    doubleNextTraining: doubleNextTraining,

    proteinSlimeReady: proteinSlimeReady,
    lastSlimeRollDate: lastSlimeRollDate,
    slimeCooldownUntil: slimeCooldownUntil,
  };
  localStorage.setItem(`muscleRPG_${currentPlayer}`, JSON.stringify(saveData));
}

// ===== 読み込み =====
function loadStatus() {
  const data = localStorage.getItem(`muscleRPG_${currentPlayer}`);
  if (data) {
    const parsed = JSON.parse(data);

    status = parsed.status ?? { ...defaultStatus };
    currentMonsterIndex = parsed.monsterIndex ?? 0;
    worldRecovery = parsed.worldRecovery ?? 0;
    streakDays = parsed.streakDays ?? 0;
    lastTrainingDate = parsed.lastTrainingDate ?? null;

    superDrinkCount = parsed.superDrinkCount ?? 0;
    doubleNextTraining = parsed.doubleNextTraining ?? false;

    proteinSlimeReady = parsed.proteinSlimeReady ?? false;
    lastSlimeRollDate = parsed.lastSlimeRollDate ?? null;
    slimeCooldownUntil = parsed.slimeCooldownUntil ?? null;
  } else {
    status = { ...defaultStatus };
    currentMonsterIndex = 0;
    worldRecovery = 0;
    streakDays = 0;
    lastTrainingDate = null;

    superDrinkCount = 0;
    doubleNextTraining = false;

    proteinSlimeReady = false;
    lastSlimeRollDate = null;
    slimeCooldownUntil = null;
  }
}

// ===== 最も育っている筋肉 =====
function getTopMuscle(preferType = null) {
  const types = ["run", "chest", "back", "leg"];
  let maxLv = -Infinity;
  for (const t of types) if (status[t] > maxLv) maxLv = status[t];
  const topTypes = types.filter(t => status[t] === maxLv);
  if (preferType && topTypes.includes(preferType)) return preferType;
  return topTypes[0];
}

// ===== 表示更新 =====
function updateStatusView() {
  HPLv.textContent = status.run;
  chestLv.textContent = status.chest;
  backLv.textContent = status.back;
  legLv.textContent = status.leg;
}

function updateWorldView() {
  const v = Math.max(0, Math.min(100, worldRecovery));
  worldRecoveryText.textContent = `${v}%`;
  worldRecoveryFill.style.width = `${v}%`;
  streakDaysText.textContent = String(streakDays);
}

// ===== アバター更新 =====
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

// ===== トレーニング =====
const toggleBtn = document.getElementById("trainingToggleBtn");
const menu = document.getElementById("trainingMenu");

toggleBtn.addEventListener("click", () => {
  menu.classList.toggle("hidden");
});

menu.addEventListener("click", (e) => {
  if (!e.target.dataset.train) return;
  const trainType = e.target.dataset.train;
  executeTraining(trainType);
  menu.classList.add("hidden");
});

function executeTraining(trainType) {
  const isWalk = (trainType === "walk");
  if (!isWalk && !(trainType in status)) return;

  // ステータス更新（walkはしない）
  if (!isWalk) status[trainType]++;

  // ストリーク更新
  const todayKey = getTodayKeyTokyo();
  if (!lastTrainingDate) {
    streakDays = 1;
    lastTrainingDate = todayKey;
  } else if (lastTrainingDate === todayKey) {
    // 同日複数回は増えない
  } else if (isYesterdayTokyo(lastTrainingDate, todayKey)) {
    streakDays += 1;
    lastTrainingDate = todayKey;
  } else {
    streakDays = 1;
    lastTrainingDate = todayKey;
  }

  // プロテインスライム抽選（今日1回）
  rollProteinSlimeIfNeeded();

  // ジム復興度：walkは+1、他は+2（スポドリで2倍）
  const before = worldRecovery;
  let inc = isWalk ? 1 : 2;

  if (doubleNextTraining) {
    inc *= 2;
    doubleNextTraining = false; // 1回で消費
  }

  worldRecovery = Math.min(100, worldRecovery + inc);
  const gained = worldRecovery - before;

  saveStatus();
  updateStatusView();
  updateWorldView();
  updateItemView();

  const info = trainingInfo[trainType];

  // ★表示の「2%/1%固定」をやめて gained を表示
  if (!isWalk) {
    updateAvatarByTopStatus(trainType);
    resultText.innerHTML =
      `今日もお疲れ様！\n${info.label} がパンプアップ！<br>
       <span class="heal">自販機からプロテイン2本を購入\nジムが${gained}%復興した</span>`;
    playSE(seLevelUp);
  } else {
    resultText.innerHTML =
      `今日もお疲れ様！<br>
       <span class="heal">マッスリーナ姫からプロテイン1本をもらった！\nジムが${gained}%復興した</span>`;
  }

  const resultImage = document.getElementById("resultImage");
  resultImage.src = info.image;
  resultImage.classList.remove("hidden");

  switchScreen("result-screen");

  // 行動後にバナー
  maybeShowNewsBanner();
}

// ===== クエスト =====
function startQuest() {
  // ★ここを修正：proteinSlimeReadyならプロテインスライム
  const monster = proteinSlimeReady ? proteinSlime : monsterList[currentMonsterIndex];
  monsterName.textContent = `${monster.name} Lv ${monster.level}`;
  monsterImage.src = monster.image;
  switchScreen("quest-screen");
}

// ===== バトル =====
function battle() {
  const heroLv = status.run + status.chest + status.back + status.leg;
  const monster = proteinSlimeReady ? proteinSlime : monsterList[currentMonsterIndex];

  if (heroLv >= monster.level) {

    // プロテインスライム：復興度増なし、アイテム付与
    if (monster.special === "protein") {
      proteinSlimeReady = false;
      superDrinkCount += 1;

      saveStatus();
      updateItemView();
      playSE(seWin);

      showResult(
        `やったー！<br>
         <span class="heal">プロテインスライム</span>を倒した！<br>
         <span class="heal">超回復スポドリ</span>を手に入れた！<br>
         <span class="heal">（使用：次回トレのジム復興2倍）</span>`
      );
      return;
    }

    // 通常勝利：従来通り
    worldRecovery = Math.min(100, worldRecovery + 3);
    updateWorldView();

    const topMuscle = getTopMuscle();
    const muscleName = muscleLabel[topMuscle];

    if (currentMonsterIndex < monsterList.length - 1) currentMonsterIndex++;

    saveStatus();
    playSE(seWin);

    showResult(
      `やったー！<br>
       ${monster.name}を<span class="heal">${muscleName}</span>で倒した！<br>
       <span class="heal">プロテイン3本をドロップ\nジムが3%復興した</span>`
    );

  } else {
    playSE(seLose);
    showResult("負けてしまった…😵<br> パンプアップが足りないみたいだ！");
  }
}

function getGymStageByRecovery(recovery) {
  return gymStages.find(stage => recovery >= stage.min && recovery <= stage.max);
}

// ===== ジムの見学 =====
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

// ===== UI =====
function showResult(html) {
  resultText.innerHTML = html;
  switchScreen("result-screen");
}

function backToMain() {
  document.getElementById("resultImage").classList.add("hidden");
  switchScreen("main-screen");
}

function switchScreen(id) {
  ["main-screen", "quest-screen", "result-screen", "gym-screen"].forEach(s =>
    document.getElementById(s).classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
}

function backToPlayerSelect() {
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("quest-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("gym-screen").classList.add("hidden");
  document.getElementById("playerSelectScreen").classList.remove("hidden");
  playerNameText.textContent = "";
  currentPlayer = null;
}

// ===== 全プレイヤーステータス初期化 =====
resetAllBtn.addEventListener("click", () => {
  const ok = confirm("全プレイヤーのステータスと進行状況を初期化します。よろしいですか？");
  if (!ok) return;

  players.forEach(name => localStorage.removeItem(`muscleRPG_${name}`));

  currentPlayer = null;
  status = { ...defaultStatus };
  currentMonsterIndex = 0;
  worldRecovery = 0;
  streakDays = 0;
  lastTrainingDate = null;

  superDrinkCount = 0;
  doubleNextTraining = false;

  proteinSlimeReady = false;
  lastSlimeRollDate = null;
  slimeCooldownUntil = null;

  updateStatusView();
  updateWorldView();
  updateAvatarByTopStatus();
  updateItemView();
  playerNameText.textContent = "";

  alert("全プレイヤーを初期化しました。");
});


