// プレイヤー管理
const players = ["おがわ", "すずき", "たなか"];
let currentPlayer = null;

// 初期ステータス（プレイヤー、ジム）
const defaultStatus = {
  run: 1,
  chest: 1,
  back: 1,
  leg: 1
};
let status = { ...defaultStatus };
let worldRecovery = 0;     // 0〜100
let streakDays = 0;        // 連続継続日数
let lastTrainingDate = null; // "YYYY-MM-DD" 形式

// ===== マッスル定義 =====
const muscleLabel = {
  run: "体力",
  chest: "胸筋",
  back: "背筋",
  leg: "脚力"
};

// ===== トレーニング定義 =====
const trainingInfo = {
  run: { label: "体力", image: "images/run.png" },
  chest:{ label: "胸筋", image: "images/chest.png" },
  back: { label: "背筋", image: "images/back.png" },
  leg:  { label: "脚力", image: "images/leg.png" },
  walk: { label: "ウォーキング", image: "images/walk.png" }
};

// ===== モンスター一覧 =====
const monsterList = [
  { name: "スライム", level: 5, image: "images/monster/slime.png" },
  { name: "がいこつ戦士", level: 10, image: "images/monster/skeleton.png" },
  { name: "ハンバーガーゴーレム", level: 15, image: "images/monster/golem.png" },
  { name: "ぽっちゃりドラゴン", level: 20, image: "images/monster/dragon.png" },
  { name: "魔王", level: 28, image: "images/monster/maou.png" },
  { name: "ボディービルダー", level: 35, image: "images/monster/bodybilder.png" },
];
let currentMonsterIndex = 0;

// ===== SE =====
const seLevelUp = new Audio("sounds/levelup.mp3");
const seWin = new Audio("sounds/win.mp3");
const seLose = new Audio("sounds/lose.mp3");

// 連続再生対策
function playSE(se) {
  se.currentTime = 0;
  se.play();
}

// ===== ジム城ビジュアル定義 =====
const gymStages = [
  { min: 0,   max: 24,  image: "images/gym/gym_stage1.png",  comment: "ジムはまだ復興が始まったばかりだ！" }, // 荒廃
  { min: 25,  max: 49,  image: "images/gym/gym_stage2.png",  comment: "あれ、筋肉の妖精が現れたようだ..." }, // 再建
  { min: 50,  max: 74,  image: "images/gym/gym_stage3.png",  comment: "あなたの頑張りでジムの復興が進み、\n筋肉の妖精が増えたようだ" }, // 活気
  { min: 75,  max: 99,  image: "images/gym/gym_stage4.png",  comment: "ジムは復興間近のようだ！\n筋肉の妖精が入会が増えてきた" }, // 豪華
  { min: 100, max: 100, image: "images/gym/gym_stage5.png",  comment: "ジムは完全に復興した！\n豪華絢爛なジムには筋肉の妖精でにぎわっている\nマッスリーヌ姫：「ありがとう…ジムが息を吹き返しました！」" } // 100%専用
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
const gymImage  = document.getElementById("gym-Image");
const gymComment = document.getElementById("gymComment");

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

// ===== 日付取得 =====
function getTodayKeyTokyo() {
  const parts = new Intl.DateTimeFormat("ja-JP", {timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(new Date());
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}
function isYesterdayTokyo(lastKey, todayKey){
  const toDate = (key) => {
    const [y,m,d] = key.split("-").map(Number);
    return new Date(y, m-1, d);
  };
  const last = toDate(lastKey);
  const today = toDate(todayKey);
  const diffDays = Math.round((today - last) / (1000*60*60*24));
  return diffDays === 1;
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
  playerNameText.textContent = `トレーニー：${currentPlayer}`;
  playerSelectScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
});

// ===== ステータス保存 =====
function saveStatus() {
  const saveData = {
    status: status,
    monsterIndex: currentMonsterIndex,
    worldRecovery: worldRecovery,
    streakDays: streakDays,
    lastTrainingDate: lastTrainingDate,
  };
  localStorage.setItem(
    `muscleRPG_${currentPlayer}`,
    JSON.stringify(saveData)
  );
}

// ===== プレイヤー情報の読み込み =====
function loadStatus() {
  const data = localStorage.getItem(`muscleRPG_${currentPlayer}`);
  if (data) {
    const parsed = JSON.parse(data);
    status = parsed.status ?? { ...defaultStatus };
    currentMonsterIndex = parsed.monsterIndex ?? 0;

    worldRecovery = parsed.worldRecovery ?? 0;
    streakDays = parsed.streakDays ?? 0;
    lastTrainingDate = parsed.lastTrainingDate ?? null;
  } else {
    status = { ...defaultStatus };
    currentMonsterIndex = 0;
    worldRecovery = 0;
    streakDays = 0;
    lastTrainingDate = null;
  }
}

// ===== 最も育っている筋肉の読み込み =====
function getTopMuscle(preferType = null) {
  const types = ["run", "chest", "back", "leg"];

  // 最大レベルを取得
  let maxLv = -Infinity;
  for (const t of types) {
    if (status[t] > maxLv) maxLv = status[t];
  }

  // 同率トップを列挙
  const topTypes = types.filter(t => status[t] === maxLv);

  // 優先指定があればそれを採用
  if (preferType && topTypes.includes(preferType)) {
    return preferType;
  }
  return topTypes[0];
}


// ===== ステータスの更新 =====
function updateStatusView() {
  HPLv.textContent = status.run;
  chestLv.textContent = status.chest;
  backLv.textContent = status.back;
  legLv.textContent = status.leg;
}

function updateWorldView(){
  const v = Math.max(0, Math.min(100, worldRecovery));
  worldRecoveryText.textContent = `${v}%`;
  worldRecoveryFill.style.width = `${v}%`;
  streakDaysText.textContent = String(streakDays);
}

// ===== アバター画像変更 =====
function updateAvatarByTopStatus(preferType = null) {
  const types = ["run", "chest", "back", "leg"];

  // まず最大レベルを求める
  let maxLv = -Infinity;
  for (const t of types) {
    if (status[t] > maxLv) maxLv = status[t];
  }

  // 最大レベルの候補を集める（同率トップ）
  const topTypes = types.filter(t => status[t] === maxLv);

  // preferType が同率トップに含まれていれば優先
  let chosen = topTypes[0];
  if (preferType && topTypes.includes(preferType)) {
    chosen = preferType;
  }

  const lv = status[chosen];
  avatarImage.src = `images/player/${chosen}_Lv${lv}.png`;

  // 保険（画像がないとき）
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
  // ★ walk は status に無いので先に分岐
  const isWalk = (trainType === "walk");
  // walk以外は従来通りステータスがある前提
  if (!isWalk && !(trainType in status)) return;
  // ===== ステータス更新（walkはしない）=====
  if (!isWalk) {
    status[trainType]++;
  }
  
  // ===== ストリーク更新（1日1回カウント）=====
  const todayKey = getTodayKeyTokyo();
  if (!lastTrainingDate) {
    streakDays = 1;
    lastTrainingDate = todayKey;
  } else if (lastTrainingDate === todayKey) {
    // 同じ日に2回以上トレしてもストリークは増やさない（仕様）
  } else if (isYesterdayTokyo(lastTrainingDate, todayKey)) {
    streakDays += 1;
    lastTrainingDate = todayKey;
  } else {
    streakDays = 1;
    lastTrainingDate = todayKey;
  }
  
  // ===== ジム城回復率：walkは+1、他は+2 =====
  const before = worldRecovery;
  const inc = isWalk ? 1 : 2;
  worldRecovery = Math.min(100, worldRecovery + inc);
  const gained = worldRecovery - before;
  
  saveStatus();
  updateStatusView();
  updateWorldView();

  // 表示用データ取得
  const info = trainingInfo[trainType];
  
  if (!isWalk) {
    updateAvatarByTopStatus(trainType);
    resultText.innerHTML =
      `今日もお疲れ様！\n${info.label} がパンプアップ！<br>
       <span class="heal">自販機からプロテイン2本を購入\nジムが2%復興した</span>`;
  } else {
    resultText.innerHTML =
      `今日もお疲れ様！<br>
       <span class="heal">マッスリーナ姫からプロテイン1本をもらった！\nジムが1%復興した</span>`;
  }
  
  // 画像
  const resultImage = document.getElementById("resultImage");
  resultImage.src = info.image;
  resultImage.classList.remove("hidden");
  // リザルト画面へ
  switchScreen("result-screen");
}

// ===== クエスト =====
function startQuest() {
  const monster = monsterList[currentMonsterIndex];
  monsterName.textContent = `${monster.name} Lv ${monster.level}`;
  monsterImage.src = monster.image;
  switchScreen("quest-screen");
}

// ===== バトル =====
function battle() {
  const heroLv = status.run + status.chest + status.back + status.leg;
  const monster = monsterList[currentMonsterIndex];
  if (heroLv >= monster.level) {
    worldRecovery = Math.min(100, worldRecovery + 3); // 勝利報酬：回復率 +2%
    updateWorldView();
    
    // 最強筋力を取得
    const topMuscle = getTopMuscle();
    const muscleName = muscleLabel[topMuscle];
    
    if (currentMonsterIndex < monsterList.length - 1) {
      currentMonsterIndex++;
    }
    saveStatus();
    showResult(
      `やったー！<br>
       ${monster.name}を<span class="heal">${muscleName}</span>で倒した！<br>
       <span class="heal">プロテイン3本をドロップ\nジムが3%復興した</span>`
    );
  } else {
    showResult("負けてしまった…😵<br> パンプアップが足りないみたいだ！");
  }
}

function getGymStageByRecovery(recovery) {
  return gymStages.find(stage => recovery >= stage.min && recovery <= stage.max);
}

// ===== ジムの見学 =====
function visitGym() {
  const v = Math.max(0, Math.min(100, worldRecovery));
  // バー表示
  document.querySelectorAll("#gym-screen #worldRecoveryText")
    .forEach(el => el.textContent = `${v}%`);
  document.querySelectorAll("#gym-screen #worldRecoveryFill")
    .forEach(el => el.style.width = `${v}%`);
  // ステージ取得
  const stage = getGymStageByRecovery(v);
  // 画像
  gymImage.src = stage.image;
  gymImage.classList.remove("hidden");
  // コメント
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
  playerNameText.textContent = ""; // 表示クリア
  currentPlayer = null;
}


// ===== 全プレイヤーステータスの初期化 =====
resetAllBtn.addEventListener("click", () => {
  const ok = confirm("全プレイヤーのステータスと進行状況を初期化します。よろしいですか？");
  if (!ok) return;

  // 全プレイヤーのセーブデータを削除
  players.forEach(name => {
    localStorage.removeItem(`muscleRPG_${name}`);
  });

  // 画面上の状態も初期化（念のため）
  currentPlayer = null;
  status = { ...defaultStatus };
  currentMonsterIndex = 0;
  worldRecovery = 0;
  streakDays = 0;
  lastTrainingDate = null;

  // 画面に反映（メイン側にいた場合でも整合が取れるように）
  updateStatusView();
  updateWorldView();
  updateAvatarByTopStatus();
  playerNameText.textContent = "";

  alert("全プレイヤーを初期化しました。");
});















































