// プレイヤー管理
const players = ["おがわ", "すずき", "たなか"];
let currentPlayer = null;

// 初期ステータス
const defaultStatus = {
  run: 1,
  chest: 1,
  back: 1,
  leg: 1
};
let status = { ...defaultStatus };

// ===== トレーニング定義 =====
const trainingInfo = {
  run: {
    label: "体力",
    image: "images/run.png"
  },
  chest: {
    label: "胸筋",
    image: "images/chest.png"
  },
  back: {
    label: "背筋",
    image: "images/back.png"
  },
  leg: {
    label: "脚力",
    image: "images/leg.png"
  }
};

// ===== モンスター一覧 =====
const monsterList = [
  { name: "スライム", level: 3, image: "images/monster/slime.png" },
  { name: "がいこつ戦士", level: 6, image: "images/monster/skeleton.png" },
  { name: "ドラゴン", level: 12, image: "images/monster/dragon.png" },
  { name: "魔王", level: 20, image: "images/monster/maou.png" }
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


// ===== DOM =====
const playerSelectScreen = document.getElementById("playerSelectScreen");
const mainScreen = document.getElementById("main-screen");
const playerSelect = document.getElementById("playerSelect");
const playerNameText = document.getElementById("playerNameText");
const startBtn = document.getElementById("startBtn");
const HPLv = document.getElementById("HPLv");
const chestLv = document.getElementById("chestLv");
const backLv = document.getElementById("backLv");
const legLv = document.getElementById("legLv");
const avatarImage = document.getElementById("avatarImage");

const resultText = document.getElementById("resultText");
const monsterName = document.getElementById("monsterName");
const monsterImage = document.getElementById("monsterImage");

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

// ===== プレイヤー選択 =====
startBtn.addEventListener("click", () => {
  if (!playerSelect.value) {
    alert("プレイヤーを選択してください");
    return;
  }
  currentPlayer = playerSelect.value;
  loadStatus();
  updateStatusView();
  updateAvatarByTopStatus();
  playerNameText.textContent = `トレーニー：${currentPlayer}`;
  playerSelectScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
});

// ===== 保存 =====
function saveStatus() {
  const saveData = {
    status: status,
    monsterIndex: currentMonsterIndex
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
  } else {
    status = { ...defaultStatus };
    currentMonsterIndex = 0;
  }
}

// ===== ステータスの更新 =====
function updateStatusView() {
  HPLv.textContent = status.run;
  chestLv.textContent = status.chest;
  backLv.textContent = status.back;
  legLv.textContent = status.leg;
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
    avatarImage.src = "images/player/${chosen}_LvMAX.png`";
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
  if (!(trainType in status)) return;
  // レベルアップ処理
  status[trainType]++;
  saveStatus();
  updateStatusView();
  updateAvatarByTopStatus(); 
  
  // 表示用データ取得
  const info = trainingInfo[trainType];
  // テキスト
  resultText.textContent = `今日もお疲れ様！\n${info.label} がパンプアップした！`;
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
    if (currentMonsterIndex < monsterList.length - 1) {
      currentMonsterIndex++;
    }
    saveStatus();
    showResult(`やったー！🎉 ${monster.name}を倒した！`);
  } else {
    showResult("負けてしまった…😵 ちょっとパンプアップが足りないみたいだ！");
  }
}

// ===== UI =====
function showResult(text) {
  resultText.textContent = text;
  switchScreen("result-screen");
}

function backToMain() {
  document.getElementById("resultImage").classList.add("hidden");
  switchScreen("main-screen"); 
}

function switchScreen(id) {
  ["main-screen", "quest-screen", "result-screen"].forEach(s =>
    document.getElementById(s).classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
}

function backToPlayerSelect() {
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("quest-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("playerSelectScreen").classList.remove("hidden");
  playerNameText.textContent = ""; // 表示クリア
  currentPlayer = null;
}





















