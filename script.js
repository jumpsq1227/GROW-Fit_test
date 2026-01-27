(() => {
  /**********************
   * 1) 定数（ゲーム定義）
   **********************/
  const PLAYERS = ["おがわ", "すずき", "たなか"];

  const DEFAULT = {
    status: { run: 1, chest: 1, back: 1, leg: 1 },
    monsterIndex: 0,
    worldRecovery: 0,
    streakDays: 0,
    lastTrainingDate: null,

    // アイテム
    superDrinkCount: 0,         // 新規プレイだけ 1 にしたい場合は loadで制御
    doubleNextTraining: false,

    // プロテインスライム
    proteinSlimeReady: false,
    lastSlimeRollDate: null,
    slimeCooldownUntil: null,
  };

  const TRAINING = {
    run:  { label: "体力", image: "images/run.png" },
    chest:{ label: "胸筋", image: "images/chest.png" },
    back: { label: "背筋", image: "images/back.png" },
    leg:  { label: "脚力", image: "images/leg.png" },
    walk: { label: "ウォーキング", image: "images/walk.png" },
  };

  const MUSCLE_LABEL = { run: "体力", chest: "胸筋", back: "背筋", leg: "脚力" };

  const MONSTERS = [
    { name: "スライム", level: 5,  image: "images/monster/slime.png" },
    { name: "ゴースト", level: 9,  image: "images/monster/ghost.png" },
    { name: "ハンバーガーゴーレム", level: 12, image: "images/monster/golem.png" },
    { name: "がいこつ戦士", level: 16, image: "images/monster/skeleton.png" },
    { name: "ぽっちゃりドラゴン", level: 20, image: "images/monster/dragon.png" },
    { name: "魔王", level: 28, image: "images/monster/maou.png" },
    { name: "ボディービルダー", level: 35, image: "images/monster/bodybuilder.png" },
    { name: "ボディービルダー【強】", level: 42, image: "images/monster/bodybuilder2.png" },
  ];

  const PROTEIN_SLIME = {
    name: "プロテインスライム",
    level: 1,
    image: "images/monster/proteinslime.png",
    special: "protein",
  };

  const SLIME = {
    pMin: 0.08,
    pMax: 0.45,
    kRisk: 0.55,
    kStreak: 0.25,
    cooldownDays: 2,
  };

  const seLevelUp = new Audio("sounds/levelup.mp3");
  const seWin = new Audio("sounds/win.mp3");
  const seLose = new Audio("sounds/lose.mp3");

  /**********************
   * 2) state（実行時の状態）
   **********************/
  const state = {
    currentPlayer: null,
    ...structuredClone(DEFAULT),
  };

  /**********************
   * 3) DOM（参照はまとめる）
   **********************/
  const el = {
    playerSelectScreen: document.getElementById("playerSelectScreen"),
    resetAllBtn: document.getElementById("resetAllBtn"),

    mainScreen: document.getElementById("main-screen"),
    playerSelect: document.getElementById("playerSelect"),
    playerNameText: document.getElementById("playerNameText"),
    startBtn: document.getElementById("startBtn"),

    HPLv: document.getElementById("HPLv"),
    chestLv: document.getElementById("chestLv"),
    backLv: document.getElementById("backLv"),
    legLv: document.getElementById("legLv"),
    avatarImage: document.getElementById("avatarImage"),

    worldRecoveryText: document.getElementById("worldRecoveryText"),
    worldRecoveryFill: document.getElementById("worldRecoveryFill"),
    streakDaysText: document.getElementById("streakDaysText"),

    resultText: document.getElementById("resultText"),
    monsterName: document.getElementById("monsterName"),
    monsterImage: document.getElementById("monsterImage"),

    gymScreen: document.getElementById("gym-screen"),
    gymImage: document.getElementById("gym-Image"),
    gymComment: document.getElementById("gymComment"),

    // アイテム（チップ＋ポップ）
    itemToggleBtn: document.getElementById("itemToggleBtn"),
    itemMenu: document.getElementById("itemMenu"),
    drinkCountText: document.getElementById("drinkCountText"),
    useDrinkBtn: document.getElementById("useDrinkBtn"),
    itemHintText: document.getElementById("itemHintText"),

    // 近況
    newsBanner: document.getElementById("newsBanner"),

    // training menu
    trainingToggleBtn: document.getElementById("trainingToggleBtn"),
    trainingMenu: document.getElementById("trainingMenu"),

    resultImage: document.getElementById("resultImage"),
  };

  /**********************
   * 4) 共通ユーティリティ
   **********************/
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  function playSE(se) {
    try { se.currentTime = 0; se.play(); } catch {}
  }

  // Tokyoの日付キー
  function getTodayKeyTokyo() {
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === "year").value;
    const m = parts.find(p => p.type === "month").value;
    const d = parts.find(p => p.type === "day").value;
    return `${y}-${m}-${d}`;
  }

  function diffDaysTokyo(fromKey, toKey) {
    const toDate = (key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m - 1, d);
    };
    return Math.round((toDate(toKey) - toDate(fromKey)) / (1000 * 60 * 60 * 24));
  }

  function isYesterdayTokyo(lastKey, todayKey) {
    return diffDaysTokyo(lastKey, todayKey) === 1;
  }

  /**********************
   * 5) セーブ/ロード（1本化）
   **********************/
  const storageKey = (name) => `muscleRPG_${name}`;

  function save() {
    if (!state.currentPlayer) return;
    localStorage.setItem(storageKey(state.currentPlayer), JSON.stringify({
      status: state.status,
      monsterIndex: state.monsterIndex,
      worldRecovery: state.worldRecovery,
      streakDays: state.streakDays,
      lastTrainingDate: state.lastTrainingDate,

      superDrinkCount: state.superDrinkCount,
      doubleNextTraining: state.doubleNextTraining,

      proteinSlimeReady: state.proteinSlimeReady,
      lastSlimeRollDate: state.lastSlimeRollDate,
      slimeCooldownUntil: state.slimeCooldownUntil,
    }));
  }

  function load() {
    const raw = localStorage.getItem(storageKey(state.currentPlayer));
    if (!raw) {
      // ★新規プレイ限定：初期スポドリ1個（ここだけでOK）
      Object.assign(state, structuredClone(DEFAULT));
      state.superDrinkCount = 1;
      return;
    }
    const parsed = JSON.parse(raw);

    // defaultを土台にして上書き → elseブロック不要で短い
    const merged = { ...structuredClone(DEFAULT), ...parsed };
    state.status = merged.status;
    state.monsterIndex = merged.monsterIndex;
    state.worldRecovery = merged.worldRecovery;
    state.streakDays = merged.streakDays;
    state.lastTrainingDate = merged.lastTrainingDate;

    state.superDrinkCount = merged.superDrinkCount;
    state.doubleNextTraining = merged.doubleNextTraining;

    state.proteinSlimeReady = merged.proteinSlimeReady;
    state.lastSlimeRollDate = merged.lastSlimeRollDate;
    state.slimeCooldownUntil = merged.slimeCooldownUntil;
  }

  /**********************
   * 6) 信頼性モデル（離脱リスク）
   *    stateっぽい構造なら何でも評価できるようにする
   **********************/
  function calcDropoutRisk(s) {
    const todayKey = getTodayKeyTokyo();
    const last = s.lastTrainingDate;
    const gapDays = last ? Math.max(0, diffDaysTokyo(last, todayKey)) : 0;

    const st = s.status ?? DEFAULT.status;
    const heroLv = (st.run ?? 1) + (st.chest ?? 1) + (st.back ?? 1) + (st.leg ?? 1);

    const idx = s.monsterIndex ?? 0;
    const nextMonster = MONSTERS[Math.min(idx, MONSTERS.length - 1)];
    const ratio = (nextMonster.level + 1) / (heroLv + 1);
    const deltaD = Math.max(0, Math.log(ratio));

    const wr = s.worldRecovery ?? 0;
    const streak = s.streakDays ?? 0;
    const supportB = wr + 2.0 * streak;

    const x = -2.2 + 1.3 * deltaD + 0.25 * gapDays - 0.03 * supportB;
    return clamp(sigmoid(x), 0, 1);
  }

  /**********************
   * 7) プロテインスライム抽選（1日1回）
   **********************/
  function rollProteinSlimeIfNeeded() {
    const todayKey = getTodayKeyTokyo();
    if (state.lastSlimeRollDate === todayKey) return;
    if (state.proteinSlimeReady) { state.lastSlimeRollDate = todayKey; return; }

    const t = Date.now();
    if (state.slimeCooldownUntil && t < state.slimeCooldownUntil) {
      state.lastSlimeRollDate = todayKey;
      return;
    }

    const risk = calcDropoutRisk(state);
    const streakTerm = clamp(state.streakDays / 30, 0, 1);
    const p = clamp(SLIME.pMin + SLIME.kRisk * risk + SLIME.kStreak * streakTerm, SLIME.pMin, SLIME.pMax);

    if (Math.random() < p) {
      state.proteinSlimeReady = true;
      state.slimeCooldownUntil = t + SLIME.cooldownDays * 24 * 60 * 60 * 1000;
    }

    state.lastSlimeRollDate = todayKey;
    save();
  }

  /**********************
   * 8) UI描画（まとめて呼べる形に）
   **********************/
  function getTopMuscle(preferType = null) {
    const types = ["run", "chest", "back", "leg"];
    let maxLv = -Infinity;
    for (const t of types) maxLv = Math.max(maxLv, state.status[t]);
    const topTypes = types.filter(t => state.status[t] === maxLv);
    if (preferType && topTypes.includes(preferType)) return preferType;
    return topTypes[0];
  }

  function renderStatus() {
    el.HPLv.textContent = state.status.run;
    el.chestLv.textContent = state.status.chest;
    el.backLv.textContent = state.status.back;
    el.legLv.textContent = state.status.leg;
  }

  function renderWorld() {
    const v = clamp(state.worldRecovery, 0, 100);
    el.worldRecoveryText.textContent = `${v}%`;
    el.worldRecoveryFill.style.width = `${v}%`;
    el.streakDaysText.textContent = String(state.streakDays);
  }

  function renderAvatar(preferType = null) {
    const chosen = getTopMuscle(preferType);
    const lv = state.status[chosen];
    el.avatarImage.src = `images/player/${chosen}_Lv${lv}.png`;
    el.avatarImage.onerror = () => {
      el.avatarImage.onerror = null;
      el.avatarImage.src = `images/player/${chosen}_LvMAX.png`;
    };
  }

  function renderItem() {
    if (!el.itemToggleBtn || !el.drinkCountText || !el.useDrinkBtn || !el.itemHintText) return;

    el.drinkCountText.textContent = String(state.superDrinkCount);
    el.itemToggleBtn.textContent = `🥤×${state.superDrinkCount}`;

    if (state.doubleNextTraining) el.itemToggleBtn.classList.add("on");
    else el.itemToggleBtn.classList.remove("on");

    const disabled = (state.superDrinkCount <= 0) || state.doubleNextTraining;
    el.useDrinkBtn.disabled = disabled;

    if (state.doubleNextTraining) el.itemHintText.textContent = "【発動中】次回トレーニングの効果が2倍！";
    else if (state.superDrinkCount > 0) el.itemHintText.textContent = "使うと、トレーニング後の復興度が2倍。";
    else el.itemHintText.textContent = "プロテインスライムを倒すと入手できます。";
  }

  function renderAll(preferType = null) {
    renderStatus();
    renderWorld();
    renderAvatar(preferType);
    renderItem();
  }

  /**********************
   * 9) 近況バナー（フェイク）
   **********************/
  function loadPlayerData(name) {
    const raw = localStorage.getItem(storageKey(name));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function makeFakeActivityText(name) {
    const actions = ["胸トレ", "背中トレ", "脚トレ", "ランニング", "ウォーキング"];
    const when = ["先ほど", "さっき", "今日", "少し前に"][Math.floor(Math.random() * 4)];
    const a = actions[Math.floor(Math.random() * actions.length)];
    return `トレーニー${name}は${when}${a}を実行したようだ。`;
  }

  function setBanner(text) {
    if (!el.newsBanner) return;
    el.newsBanner.textContent = text;
    el.newsBanner.classList.remove("hidden");
    setTimeout(() => el.newsBanner.classList.add("hidden"), 8000);
  }

  function maybeShowNewsBanner() {
    if (!el.newsBanner) return;
    if (Math.random() > 0.55) return;

    const others = PLAYERS.filter(n => n !== state.currentPlayer);
    const candidates = [];

    for (const n of others) {
      const data = loadPlayerData(n);
      if (!data) continue;
      const risk = calcDropoutRisk(data);
      if (risk >= 0.45) candidates.push({ name: n, risk });
    }
    if (candidates.length === 0) return;

    candidates.sort((a, b) => b.risk - a.risk);
    setBanner(makeFakeActivityText(candidates[0].name));
  }

  /**********************
   * 10) 画面遷移
   **********************/
  function switchScreen(id) {
    ["main-screen", "quest-screen", "result-screen", "gym-screen"].forEach(s =>
      document.getElementById(s)?.classList.add("hidden")
    );
    document.getElementById(id)?.classList.remove("hidden");
  }

  function showResult(html) {
    el.resultText.innerHTML = html;
    switchScreen("result-screen");
  }

  /**********************
   * 11) ゲーム操作（トレ・クエスト・戦闘）
   **********************/
  function executeTraining(trainType) {
    const isWalk = (trainType === "walk");
    if (!isWalk && !(trainType in state.status)) return;

    // (1) 成長：walk以外はLv+1
    if (!isWalk) state.status[trainType]++;

    // (2) ストリーク更新（1日1回増）
    const todayKey = getTodayKeyTokyo();
    if (!state.lastTrainingDate) {
      state.streakDays = 1;
      state.lastTrainingDate = todayKey;
    } else if (state.lastTrainingDate === todayKey) {
      // 同日複数回は増えない
    } else if (isYesterdayTokyo(state.lastTrainingDate, todayKey)) {
      state.streakDays += 1;
      state.lastTrainingDate = todayKey;
    } else {
      state.streakDays = 1;
      state.lastTrainingDate = todayKey;
    }

    // (3) プロテインスライム抽選（1日1回）
    rollProteinSlimeIfNeeded();

    // (4) 復興度加算（スポドリなら次回だけ2倍）
    const before = state.worldRecovery;
    let inc = isWalk ? 1 : 2;
    if (state.doubleNextTraining) {
      inc *= 2;
      state.doubleNextTraining = false;
    }
    state.worldRecovery = Math.min(100, state.worldRecovery + inc);
    const gained = state.worldRecovery - before;

    // (5) 保存と描画
    save();
    renderAll(!isWalk ? trainType : null);

    // (6) 結果表示
    const info = TRAINING[trainType];
    if (!isWalk) {
      el.resultText.innerHTML =
        `今日もお疲れ様！\n${info.label} がパンプアップ！<br>
         <span class="heal">自販機からプロテイン2本を購入\nジムが${gained}%復興した</span>`;
      playSE(seLevelUp);
    } else {
      el.resultText.innerHTML =
        `今日もお疲れ様！<br>
         <span class="heal">マッスリーナ姫からプロテイン1本をもらった！\nジムが${gained}%復興した</span>`;
    }

    el.resultImage.src = info.image;
    el.resultImage.classList.remove("hidden");
    switchScreen("result-screen");

    // (7) 行動後に近況バナー
    maybeShowNewsBanner();
  }

  // クエスト開始：プロテインスライムが予約されていれば優先
  window.startQuest = function () {
    const monster = state.proteinSlimeReady ? PROTEIN_SLIME : MONSTERS[state.monsterIndex];
    el.monsterName.textContent = `${monster.name} Lv ${monster.level}`;
    el.monsterImage.src = monster.image;
    switchScreen("quest-screen");
  };

  // バトル：勝ったら通常は復興+3、プロテインスライムならアイテム付与
  window.battle = function () {
    const heroLv = state.status.run + state.status.chest + state.status.back + state.status.leg;
    const monster = state.proteinSlimeReady ? PROTEIN_SLIME : MONSTERS[state.monsterIndex];

    if (heroLv < monster.level) {
      playSE(seLose);
      showResult("負けてしまった…😵<br> パンプアップが足りないみたいだ！");
      return;
    }

    // プロテインスライム勝利：復興度は増やさずスポドリ付与
    if (monster.special === "protein") {
      state.proteinSlimeReady = false;
      state.superDrinkCount += 1;
      save();
      renderItem();
      playSE(seWin);
      showResult(
        `やったー！<br>
         <span class="heal">プロテインスライム</span>を倒した！<br>
         <span class="heal">超回復スポドリ</span>を手に入れた！<br>
         <span class="heal">（使用：次回トレのジム復興2倍）</span>`
      );
      return;
    }

    // 通常勝利：復興+3、敵を進める
    state.worldRecovery = Math.min(100, state.worldRecovery + 3);
    const top = getTopMuscle();
    const muscleName = MUSCLE_LABEL[top];
    if (state.monsterIndex < MONSTERS.length - 1) state.monsterIndex++;

    save();
    renderWorld();
    playSE(seWin);
    showResult(
      `やったー！<br>
       ${monster.name}を<span class="heal">${muscleName}</span>で倒した！<br>
       <span class="heal">プロテイン3本をドロップ\nジムが3%復興した</span>`
    );
  };

  /**********************
   * 12) イベント配線（起動時）
   **********************/
  function initPlayerSelect() {
    PLAYERS.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      el.playerSelect.appendChild(option);
    });
  }

  function bindEvents() {
    // プレイヤー開始
    el.startBtn.addEventListener("click", () => {
      if (!el.playerSelect.value) return alert("プレイヤーを選択してください");
      state.currentPlayer = el.playerSelect.value;

      load();
      renderAll();

      el.playerNameText.textContent = `トレーニー：${state.currentPlayer}`;
      el.playerSelectScreen.classList.add("hidden");
      el.mainScreen.classList.remove("hidden");

      maybeShowNewsBanner();
    });

    // トレーニングメニュー
    el.trainingToggleBtn.addEventListener("click", () => {
      el.trainingMenu.classList.toggle("hidden");
    });

    el.trainingMenu.addEventListener("click", (e) => {
      const t = e.target.dataset.train;
      if (!t) return;
      executeTraining(t);
      el.trainingMenu.classList.add("hidden");
    });

    // アイテム（チップ＋ポップ）
    if (el.itemToggleBtn && el.itemMenu) {
      el.itemToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        el.itemMenu.classList.toggle("hidden");
      });
      el.itemMenu.addEventListener("click", (e) => e.stopPropagation());
      document.addEventListener("click", () => el.itemMenu.classList.add("hidden"));
    }

    if (el.useDrinkBtn) {
      el.useDrinkBtn.addEventListener("click", () => {
        if (state.superDrinkCount <= 0) return;
        if (state.doubleNextTraining) return;
        state.superDrinkCount -= 1;
        state.doubleNextTraining = true;
        save();
        renderItem();
      });
    }

    // 全プレイヤー初期化（※あなたの要望通り、新規だけ1個なのでここは0のまま）
    el.resetAllBtn.addEventListener("click", () => {
      const ok = confirm("全プレイヤーのステータスと進行状況を初期化します。よろしいですか？");
      if (!ok) return;
      PLAYERS.forEach(name => localStorage.removeItem(storageKey(name)));
      alert("全プレイヤーを初期化しました。");
      location.reload();
    });
  }

  // 起動
  initPlayerSelect();
  bindEvents();
})();
