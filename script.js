// ===== ステータス =====
const status = {
  run: 1,
  chest: 1,
  back: 1,
  leg: 1
};

// ===== モンスター一覧 =====
const monsterList = [
  { name: "スライム", level: 3, image: "images/monster/slime.png" },
  { name: "がいこつ戦士", level: 6, image: "images/monster/skeleton.png" },
  { name: "ドラゴン", level: 12, image: "images/monster/dragon.png" },
  { name: "魔王", level: 20, image: "images/monster/maou.png" }
];

let currentMonsterIndex = 0;
let currentMonster = monsterList[0];

// ===== 初期データ =====
const status = {
  "おがわ": { run: 1, chest: 1, back: 1, leg: 1 },
  "すずき": { run: 1, chest: 1, back: 1, leg: 1 },
};

// ===== localStorage 初期化 =====
if (!localStorage.getItem("players")) {
  localStorage.setItem("players", JSON.stringify(status));
}

// ===== DOM =====
const selectScreen = document.getElementById("playerSelectScreen");
const mainScreen = document.getElementById("mainScreen");
const playerSelect = document.getElementById("playerSelect");

const levelEl = document.getElementById("level");
const hpEl = document.getElementById("hp");
const atkEl = document.getElementById("atk");

// ===== プレイヤー一覧表示 =====
function loadPlayerList() {
  const players = JSON.parse(localStorage.getItem("players"));
  playerSelect.innerHTML = "";

  Object.keys(players).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    playerSelect.appendChild(option);
  });
}

// ===== ステータス反映 =====
function renderStatus(player) {
  levelEl.textContent = player.level;
  hpEl.textContent = player.hp;
  atkEl.textContent = player.atk;
}

// ===== 開始ボタン =====
document.getElementById("startBtn").addEventListener("click", () => {
  const selected = playerSelect.value;
  localStorage.setItem("currentPlayer", selected);

  const players = JSON.parse(localStorage.getItem("players"));
  renderStatus(players[selected]);

  selectScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
});

// ===== 表示更新 =====
function updateStatusView() {
  document.getElementById("HPLv").textContent = status.run;
  document.getElementById("chestLv").textContent = status.chest;
  document.getElementById("backLv").textContent = status.back;
  document.getElementById("legLv").textContent = status.leg;
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


