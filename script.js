// ===== モンスター一覧 =====
const monsterList = [
  { name: "スライム", level: 3, image: "images/monster/slime.png" },
  { name: "がいこつ戦士", level: 6, image: "images/monster/skeleton.png" },
  { name: "ドラゴン", level: 12, image: "images/monster/dragon.png" },
  { name: "魔王", level: 20, image: "images/monster/maou.png" }
];

// プレイヤー管理
const players = ["勇者", "戦士", "魔法使い"];
let currentPlayer = null;

// 初期ステータス
const defaultStatus = {
  status: {
    run: 1,
    chest: 1,
    back: 1,
    leg: 1
  },
  monsterIndex: 1
};

let currentMonsterIndex = 0;
let status = { ...defaultStatus };

// DOM取得（HTML構造に合わせる）
const playerSelectScreen = document.getElementById("playerSelectScreen");
const mainScreen = document.getElementById("main-screen");
const playerSelect = document.getElementById("playerSelect");
const startBtn = document.getElementById("startBtn");

const HPLv = document.getElementById("HPLv");
const chestLv = document.getElementById("chestLv");
const backLv = document.getElementById("backLv");
const legLv = document.getElementById("legLv");

const trainingSelect = document.getElementById("training");
const avatarImage = document.getElementById("avatarImage");
const resultText = document.getElementById("resultText");

// 初期処理
function initPlayerSelect() {
  players.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    playerSelect.appendChild(option);
  });
}

initPlayerSelect();

// プレイヤー開始
startBtn.addEventListener("click", () => {
  const selected = playerSelect.value;
  if (!selected) {
    alert("プレイヤーを選択してください");
    return;
  }

  currentPlayer = selected;
  loadStatus();
  updateStatusView();

  playerSelectScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
});

// ステータス、討伐モンスター情報の保存
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

// ステータス、討伐モンスター情報の読み込み
function loadStatus() {
  const data = localStorage.getItem(`muscleRPG_${currentPlayer}`);

  if (data) {
    const parsed = JSON.parse(data);
    status = parsed.status;
    currentMonsterIndex = parsed.monsterIndex ?? 0;
  } else {
    status = { ...defaultStatus };
    currentMonsterIndex = 0;
  }
}


// ===== 表示更新 =====
function updateStatusView() {
  document.getElementById("HPLv").textContent = status.status.run;
  document.getElementById("chestLv").textContent = status.status.chest;
  document.getElementById("backLv").textContent = status.status.back;
  document.getElementById("legLv").textContent = status.status.leg;
}

function backToPlayerSelect() {
  // メイン画面を隠す
  document.getElementById("main-screen").classList.add("hidden");

  // クエスト・リザルトも念のため隠す
  document.getElementById("quest-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.add("hidden");

  // プレイヤー選択画面を表示
  document.getElementById("playerSelectScreen").classList.remove("hidden");

  // 現在プレイヤーをリセット（任意）
  currentPlayer = null;
}


// ===== トレーニング =====
function runTraining() {
  const training = document.getElementById("training").value;
  const avatarImage = document.getElementById("avatarImage");

  if (!training) {
    alert("トレーニングを選択してください");
    return;
  }

  status[training]++;
  avatarImage.src = `images/${training}.png`;
  saveStatus();
  updateStatusView();

  showResult("レベルアップ！💪");
}

// ===== クエスト開始 =====
function startQuest() {
  currentMonster = monsterList[currentMonsterIndex];
  monsterName.textContent = `${currentMonster.name} Lv ${currentMonster.level}`;
  monsterImage.src = currentMonster.image;

  switchScreen("quest-screen");
}

// ===== バトル =====
function battle() {
  const heroLv = status.run + status.chest + status.back + status.leg;

  if (heroLv >= currentMonster.level) {
    showResult(`勝利！🎉 ${currentMonster.name}を倒した！`);
    if (currentMonsterIndex < monsterList.length - 1) {
      currentMonsterIndex++;
    }
    saveStatus();
  } else {
    showResult(`敗北…😵 もっと鍛えよう`);
  }
}

// ===== 共通UI =====
function showResult(text) {
  resultText.textContent = text;
  switchScreen("result-screen");
}

function backToMain() {
  switchScreen("main-screen");
}

function switchScreen(screenId) {
  ["main-screen", "quest-screen", "result-screen"].forEach(id =>
    document.getElementById(id).classList.add("hidden")
  );
  document.getElementById(screenId).classList.remove("hidden");
}

// 初期化
updateStatusView();











