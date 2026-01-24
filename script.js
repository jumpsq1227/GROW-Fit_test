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

// ===== 表示更新 =====
function updateStatusView() {
  HPLv.textContent = status.run;
  chestLv.textContent = status.chest;
  backLv.textContent = status.back;
  legLv.textContent = status.leg;
}

// ===== トレーニング =====
function runTraining() {
  const training = trainingSelect.value;
  if (!training) return alert("トレーニングを選択してください");

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
    showResult(`やったー！🎉 ${currentMonster.name}を倒した！`);
    if (currentMonsterIndex < monsterList.length - 1) {
      currentMonsterIndex++;
    }
  } else {
    showResult(`負けてしまった…😵 もっと鍛えよう`);
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

