// ステータス
const status = {
  run: 1,
  chest: 1,
  back: 1,
  leg: 1
};

// モンスター一覧
const monsterList = [
  {
    name: "スライム",
    level: 3,
    image: "images/monster/slime.png"
  },
  {
    name: "がいこつ戦士",
    level: 6,
    image: "images/monster/skeleton.png"
  },
  {
    name: "ドラゴン",
    level: 12,
    image: "images/monster/dragon.png"
  },
  {
    name: "魔王",
    level: 20,
    image: "images/monster/maou.png"
  }
];

// 表示更新
function updateStatusView() {
  document.getElementById("HPLv").textContent = status.run;
  document.getElementById("chestLv").textContent = status.chest;
  document.getElementById("backLv").textContent = status.back;
  document.getElementById("legLv").textContent = status.leg;
}

// ボタン実行
function runTraining() {
  const training = document.getElementById("training").value;
  const avatar = document.getElementById("avatarImage");

  if (!training) {
    alert("筋トレ内容を選択してください");
    return;
  }

  // ステータス、アバター更新
  switch (training) {
    case "run":
      status.run += 1;
      break;
    case "chest":
      status.chest += 1;
      break;
    case "back":
      status.back += 1;
      break;
    case "leg":
      status.leg += 1;
      break;
  }
  updateStatusView();
  avatar.src = `images/${training}.png`;

    // 画面切り替え
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  // リザルト表示
  const textMap = {
    run: "持久力 Lv UP！",
    chest: "胸筋力 Lv UP！",
    back: "背筋力 Lv UP！",
    leg: "脚力 Lv UP！"
  };

  const resultText = document.getElementById("resultText");
  resultText.textContent = textMap[training];
  resultText.className = "level-up";
  
}

function goToQuest() {
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("quest-screen").classList.remove("hidden");
}

function backToMain() {
  // リザルト画面、クエスト画面を非表示
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById("quest-screen").classList.add("hidden");
  // メイン画面を表示
  document.getElementById("main-screen").classList.remove('hidden');
}




















