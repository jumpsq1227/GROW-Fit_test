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
  const avatar = document.getElementById("avatarImage");

  if (!training) {
    alert("トレーニングを選択してください");
    return;
  }

  // Lvアップ
  status[training]++;
  updateStatusView();

  // アバター変更
  avatar.src = `images/${training}.png`;

  // リザルト表示
  const textMap = {
    run: "体力 Lv UP！",
    chest: "胸筋力 Lv UP！",
    back: "背筋力 Lv UP！",
    leg: "脚力 Lv UP！"
  };

  document.getElementById("resultText").textContent = textMap[training];

  switchScreen("result-screen");
}

// ===== クエスト =====
function startQuest() {
  const monster = monsterList[currentMonsterIndex];

  document.getElementById("monsterName").textContent =
    `${monster.name} Lv ${monster.level}`;
  document.getElementById("monsterImage").src = monster.image;

  switchScreen("quest-screen");
}

// ===== バトル =====
function battle() {
  const monster = monsterList[currentMonsterIndex];
  const heroLv =
    status.run + status.chest + status.back + status.leg;

  if (heroLv >= monster.level) {
    document.getElementById("resultText").textContent =
      `勝利！🎉 ${monster.name}を倒した！`;

    if (currentMonsterIndex < monsterList.length - 1) {
      currentMonsterIndex++;
    }
  } else {
    document.getElementById("resultText").textContent =
      "敗北…😵 もっと鍛えよう";
  }

  switchScreen("result-screen");
}

// ===== 画面切替 =====
function backToMain() {
  switchScreen("main-screen");
}

function switchScreen(screenId) {
  ["main-screen", "quest-screen", "result-screen"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });
  document.getElementById(screenId).classList.remove("hidden");
}

// 初期化
updateStatusView();

