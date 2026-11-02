// 챕터 데이터. 새 챕터는 chapters 배열에 항목을 추가하면 됩니다. (규칙은 document/game-ch.md 참고)
//
// [적 enemies]
//   move  sine   좌우로 흔들며 내려옴 (amp: 흔들림 폭)
//         zig    좌우로 지그재그
//         chase  내려오며 플레이어 쪽으로 따라붙음 (steer: 추적 속도)
//         strafe 옆에서 들어와 가로질러 감 (pattern: 'side'와 함께 사용)
//         fall   곧게 빠르게 떨어짐 (drift: 비스듬한 정도)
//         hop    개구리처럼 뛰듯이 내려옴
//         bounce 벽에 튕기며 내려옴
//         shoot  내려오며 플레이어를 향해 발사
//         hover  일정 위치에 멈춰서 발사하다가 떠남
//   fireEvery(발사 간격) fan(동시 발사 수) bspeed(탄 속도) bullet(탄 이모지) spin(회전)
//
// [등장 패턴 spawns.pattern]  single / line(V자 5마리) / column(세로 3마리) / pair(좌우 2마리) / side(옆에서 진입)
//
// [보스 patterns]
//   spread 부채꼴 / ring 원형 / aimed 연발 조준 / charge 돌진 / summon 부하 소환
//   wall 틈이 있는 탄막 벽 / wind 옆에서 불어오는 탄막 / rain 탄막 비 / bubbles 터지는 거품
//   tentacle 사방에서 조준 / lava 용암 바닥 / teleport 순간이동 / magic 마법진 / slow 시간 감속 / lightning 번개
window.GAME_DATA = {
  enemies: {
    // ----- 챕터 1: 앞마당 -----
    bee:  { emoji: '🐝', size: 34, r: 14, hp: 1, move: 'sine',   speed: 110, score: 100, drop: 1 },
    bird: { emoji: '🐦', size: 38, r: 16, hp: 2, move: 'shoot',  speed: 90,  score: 200, drop: 1.4, fireEvery: 1.8 },
    ball: { emoji: '⚽', size: 42, r: 19, hp: 4, move: 'bounce', speed: 80,  score: 300, drop: 2, spin: 2 },

    // ----- 챕터 2: 안개 낀 숲 -----
    wisp:   { emoji: '💫', size: 34, r: 14, hp: 1, move: 'zig',    speed: 125, score: 100, drop: 1 },
    bat:    { emoji: '🦇', size: 36, r: 14, hp: 1, move: 'strafe', speed: 150, score: 150, drop: 1 },
    owl:    { emoji: '🦉', size: 40, r: 17, hp: 2, move: 'shoot',  speed: 85,  score: 200, drop: 1.4, fireEvery: 1.8 },
    treant: { emoji: '🌳', size: 54, r: 24, hp: 5, move: 'bounce', speed: 65,  score: 400, drop: 2.5 },

    // ----- 챕터 3: 시장 -----
    rat:    { emoji: '🐀', size: 34, r: 14, hp: 1, move: 'chase',  speed: 120, steer: 80, score: 100, drop: 1 },
    mouse:  { emoji: '🐁', size: 30, r: 12, hp: 1, move: 'zig',    speed: 135, score: 100, drop: 1 },
    pot:    { emoji: '🏺', size: 38, r: 16, hp: 2, move: 'fall',   speed: 200, drift: 0, score: 150, drop: 1.2, spin: 3 },
    pigeon: { emoji: '🕊️', size: 38, r: 16, hp: 2, move: 'shoot',  speed: 90,  score: 200, drop: 1.4, fireEvery: 1.7, bullet: '🍎' },
    cart:   { emoji: '🛒', size: 46, r: 21, hp: 5, move: 'bounce', speed: 70,  score: 400, drop: 2.5 },

    // ----- 챕터 4: 밀밭과 풍차 마을 -----
    goose:   { emoji: '🦆', size: 38, r: 16, hp: 1, move: 'sine',   speed: 115, amp: 80, score: 100, drop: 1 },
    boarlet: { emoji: '🐗', size: 40, r: 17, hp: 2, move: 'chase',  speed: 130, steer: 95, score: 200, drop: 1.4 },
    rooster: { emoji: '🐓', size: 40, r: 17, hp: 2, move: 'shoot',  speed: 85,  score: 250, drop: 1.4, fireEvery: 2.0, fan: 3, bullet: '🌽' },
    pumpkin: { emoji: '🎃', size: 46, r: 21, hp: 5, move: 'bounce', speed: 75,  score: 400, drop: 2.5, spin: 1.5 },

    // ----- 챕터 5: 늪지대 -----
    mosquito: { emoji: '🦟', size: 28, r: 11, hp: 1, move: 'zig',   speed: 155, score: 100, drop: 1 },
    frog:     { emoji: '🐸', size: 38, r: 16, hp: 2, move: 'hop',   speed: 150, score: 200, drop: 1.4 },
    snake:    { emoji: '🐍', size: 38, r: 16, hp: 2, move: 'sine',  speed: 100, amp: 105, score: 200, drop: 1.4 },
    shroom:   { emoji: '🍄', size: 44, r: 19, hp: 4, move: 'hover', speed: 90,  score: 350, drop: 2.2, fireEvery: 2.2, fan: 5, bspeed: 140, bullet: '🟣' },

    // ----- 챕터 6: 바다 -----
    fish:   { emoji: '🐟', size: 34, r: 14, hp: 1, move: 'sine',   speed: 135, amp: 70, score: 100, drop: 1 },
    crab:   { emoji: '🦀', size: 36, r: 15, hp: 2, move: 'strafe', speed: 125, score: 200, drop: 1.4 },
    puffer: { emoji: '🐡', size: 44, r: 20, hp: 4, move: 'bounce', speed: 75,  score: 350, drop: 2.2 },
    squid:  { emoji: '🦑', size: 42, r: 18, hp: 3, move: 'hover',  speed: 90,  score: 300, drop: 2, fireEvery: 2.0, fan: 3, bullet: '💦' },
    shark:  { emoji: '🦈', size: 46, r: 20, hp: 3, move: 'chase',  speed: 150, steer: 115, score: 300, drop: 2 },

    // ----- 챕터 7: 화산 협곡 -----
    meteor:   { emoji: '☄️', size: 38, r: 15, hp: 2, move: 'fall',   speed: 235, drift: 70, score: 150, drop: 1.2 },
    lizard:   { emoji: '🦎', size: 36, r: 15, hp: 2, move: 'zig',    speed: 140, score: 200, drop: 1.4 },
    lavaball: { emoji: '🔥', size: 34, r: 14, hp: 1, move: 'strafe', speed: 175, score: 150, drop: 1 },
    imp:      { emoji: '😈', size: 40, r: 17, hp: 3, move: 'hover',  speed: 90,  score: 300, drop: 2, fireEvery: 1.9, fan: 3, bullet: '🔥' },
    rock:     { emoji: '🪨', size: 50, r: 22, hp: 6, move: 'bounce', speed: 70,  score: 450, drop: 2.5, spin: 1 },

    // ----- 챕터 8: 어둠의 성 -----
    ghost:  { emoji: '👻', size: 40, r: 17, hp: 2, move: 'sine',   speed: 95,  amp: 95, score: 200, drop: 1.4 },
    skull:  { emoji: '💀', size: 38, r: 16, hp: 3, move: 'shoot',  speed: 85,  score: 300, drop: 1.8, fireEvery: 1.9, fan: 3, bullet: '🦴' },
    spider: { emoji: '🕷️', size: 34, r: 14, hp: 2, move: 'chase',  speed: 145, steer: 105, score: 200, drop: 1.4 },
    orb:    { emoji: '🔮', size: 40, r: 17, hp: 4, move: 'hover',  speed: 90,  score: 350, drop: 2.2, fireEvery: 2.3, fan: 5, bspeed: 150, bullet: '✨' },
    statue: { emoji: '🗿', size: 50, r: 22, hp: 7, move: 'bounce', speed: 65,  score: 500, drop: 2.8 },

    // ----- 챕터 9: 시간의 탑 -----
    gear:      { emoji: '⚙️', size: 44, r: 19, hp: 4, move: 'bounce', speed: 80,  score: 350, drop: 2.2, spin: 3 },
    hourglass: { emoji: '⏳', size: 38, r: 16, hp: 3, move: 'hover',  speed: 90,  score: 300, drop: 2, fireEvery: 1.9, fan: 3, bullet: '✨' },
    alarm:     { emoji: '⏰', size: 36, r: 15, hp: 2, move: 'chase',  speed: 170, steer: 120, score: 250, drop: 1.6 },
    star:      { emoji: '⭐', size: 34, r: 14, hp: 1, move: 'sine',   speed: 130, amp: 115, score: 150, drop: 1, spin: 2 },

    // ----- 챕터 10: 비 오는 동네 -----
    drop:      { emoji: '💧', size: 28, r: 11, hp: 1, move: 'fall',   speed: 265, drift: 0, score: 100, drop: 0.8 },
    leaf:      { emoji: '🍂', size: 32, r: 13, hp: 1, move: 'zig',    speed: 125, score: 100, drop: 1, spin: 2 },
    bolt:      { emoji: '⚡', size: 34, r: 13, hp: 1, move: 'strafe', speed: 270, score: 200, drop: 1.2 },
    umbrella:  { emoji: '☂️', size: 44, r: 19, hp: 3, move: 'sine',   speed: 105, amp: 90, score: 250, drop: 1.8 },
    raincloud: { emoji: '🌧️', size: 46, r: 20, hp: 4, move: 'hover',  speed: 90,  score: 350, drop: 2.2, fireEvery: 1.8, fan: 3, bullet: '💧' },
    tornado:   { emoji: '🌪️', size: 52, r: 22, hp: 6, move: 'bounce', speed: 95,  score: 450, drop: 2.5, spin: 4 },
  },

  chapters: [
    // ================= 챕터 1 =================
    {
      id: 1,
      name: '집 앞마당',
      intro: [
        '챕터 1', '집 앞마당', '',
        '주인님이 나를 잃어버렸다냥...',
        '어서 주인님에게 돌아가자!', '',
        '방해하는 녀석들은 미사일로 물리치자!',
      ],
      outro: [
        '챕터 1 클리어!', '',
        '마지막 힘을 다해 앞마당 끝까지 왔다.',
        '하지만 주인님은 어디에도 보이지 않는다...', '',
        '그때, 알 수 없는 빛이 고양이를 감쌌다!', '',
        '눈을 떠 보니 중세 시대?!',
      ],
      bg: {
        top: '#9bdcff', bottom: '#79c95f',
        path: 'rgba(217,196,160,0.55)', dash: true,
        decor: ['🌼', '🌷', '🌱', '🍀', '🌻'], edge: '🌳', weather: 'clouds',
      },
      duration: 30,
      interval: [1.5, 0.8],
      spawns: [
        { type: 'bee',  pattern: 'line',   weight: 4 },
        { type: 'bee',  pattern: 'single', weight: 4 },
        { type: 'bird', pattern: 'single', weight: 3, from: 0.15 },
        { type: 'ball', pattern: 'single', weight: 2, from: 0.35 },
      ],
      boss: {
        name: '이웃집 개 멍멍이 대장', art: 'dog', bullet: '🦴',
        size: 120, r: 50, hp: 90, score: 5000,
        patterns: ['spread', 'ring', 'spread', 'charge'],
      },
    },

    // ================= 챕터 2 =================
    {
      id: 2,
      name: '안개 낀 숲',
      intro: [
        '챕터 2', '달빛 아래 안개 낀 숲', '',
        '낯선 숲에서 눈을 떴다냥...',
        '숲의 수호자가 갑옷과 검을 건넨다.',
        '"이제 너는 고양이 기사다."', '',
        '길을 막는 늑대 대장을 물리치자!',
      ],
      outro: [
        '챕터 2 클리어!', '',
        '늑대 대장이 쓰러지고',
        '숲을 빠져나갈 길이 열렸다.', '',
        '저 멀리 성 아래 마을의',
        '불빛이 보인다!',
      ],
      bg: {
        top: '#0b1530', bottom: '#1d4a3a', path: 'rgba(120,150,110,0.28)',
        decor: ['🍄', '🌿', '🌲', '🪵'], edge: '🌲', weather: 'fog',
      },
      duration: 30,
      interval: [1.4, 0.75],
      spawns: [
        { type: 'wisp',   pattern: 'line',   weight: 4 },
        { type: 'wisp',   pattern: 'single', weight: 3 },
        { type: 'bat',    pattern: 'side',   weight: 3, from: 0.1 },
        { type: 'owl',    pattern: 'single', weight: 3, from: 0.2 },
        { type: 'treant', pattern: 'single', weight: 2, from: 0.4 },
      ],
      boss: {
        name: '늑대 대장 그레이팽', art: 'wolf', bullet: '🌙', minion: 'wisp',
        size: 120, r: 48, hp: 100, score: 6000, dashSpeed: 1050, tele: 0.55, idleT: 1.0,
        patterns: ['aimed', 'charge', 'spread', 'summon', 'charge'],
      },
    },

    // ================= 챕터 3 =================
    {
      id: 3,
      name: '성 아래 시장',
      intro: [
        '챕터 3', '북적이는 성 아래 시장', '',
        '시장이 쥐 떼 때문에',
        '난장판이 되어 버렸다!', '',
        '쥐들이 훔쳐 가기 전에',
        '곡식을 지켜 주자냥!',
      ],
      outro: [
        '챕터 3 클리어!', '',
        '쥐 왕을 물리치자',
        '마을 사람들이 환호했다.', '',
        '"현실로 돌아가려면',
        '시간의 탑을 찾아가시오!"',
      ],
      bg: {
        top: '#fcd9a8', bottom: '#d9a86c', path: 'rgba(120,90,70,0.45)',
        decor: ['🍎', '🥖', '🧺', '🌽', '🧀'], edge: '🏠',
      },
      duration: 30,
      interval: [1.35, 0.7],
      spawns: [
        { type: 'rat',    pattern: 'line',   weight: 4 },
        { type: 'rat',    pattern: 'column', weight: 3 },
        { type: 'mouse',  pattern: 'single', weight: 3 },
        { type: 'pot',    pattern: 'pair',   weight: 3, from: 0.1 },
        { type: 'pigeon', pattern: 'single', weight: 3, from: 0.2 },
        { type: 'cart',   pattern: 'single', weight: 2, from: 0.4 },
      ],
      boss: {
        name: '쥐 왕 래트킹', art: 'rat', bullet: '🧀', minion: 'rat',
        size: 124, r: 50, hp: 110, score: 6500, idleT: 1.0,
        patterns: ['summon', 'aimed', 'summon', 'ring', 'spread'],
      },
    },

    // ================= 챕터 4 =================
    {
      id: 4,
      name: '밀밭과 풍차 마을',
      intro: [
        '챕터 4', '황금빛 밀밭과 풍차 마을', '',
        '농부들이 멧돼지 무리에게',
        '밭을 빼앗겨 울고 있다.', '',
        '풍차 날개가 돌 때는 공격이 안 통해!',
        '날개가 멈추는 순간이 기회다!',
      ],
      outro: [
        '챕터 4 클리어!', '',
        '멧돼지 장군이 물러났다.',
        '농부들이 수확한 곡식을',
        '한가득 나눠 주었다.', '',
        '이제 독안개 늪으로!',
      ],
      bg: {
        top: '#fda65a', bottom: '#e6c15a', path: 'rgba(150,100,50,0.45)',
        decor: ['🌾', '🌻', '🥕', '🌽'], edge: '🌾', weather: 'clouds',
      },
      duration: 30,
      interval: [1.3, 0.7],
      spawns: [
        { type: 'goose',   pattern: 'line',   weight: 3 },
        { type: 'boarlet', pattern: 'single', weight: 3 },
        { type: 'boarlet', pattern: 'column', weight: 2, from: 0.1 },
        { type: 'rooster', pattern: 'single', weight: 3, from: 0.15 },
        { type: 'goose',   pattern: 'pair',   weight: 2 },
        { type: 'pumpkin', pattern: 'single', weight: 2, from: 0.35 },
      ],
      boss: {
        name: '멧돼지 장군 아이언 터스크', art: 'boar', bullet: '🌾', guard: [3.2, 3.0],
        size: 128, r: 54, hp: 125, score: 7000, dashSpeed: 1000, tele: 0.6, idleT: 0.9,
        patterns: ['wall', 'charge', 'spread', 'wall', 'charge'],
      },
    },

    // ================= 챕터 5 =================
    {
      id: 5,
      name: '독안개 늪지대',
      intro: [
        '챕터 5', '독안개 늪지대', '',
        '보랏빛 독안개가 피어오른다.',
        '이 늪을 건너지 않으면',
        '탑으로 갈 수 없다.', '',
        '터지는 독 거품을 조심하자!',
      ],
      outro: [
        '챕터 5 클리어!', '',
        '늪의 주인 두꺼비가 쓰러지고',
        '독안개가 서서히 걷힌다.', '',
        '늪 건너 항구에서',
        '해적선이 기다린다.',
      ],
      bg: {
        top: '#3b2a55', bottom: '#4d6b3a',
        decor: ['🪷', '🌿', '🍄', '🪵'], edge: '🌿', weather: 'fog',
      },
      duration: 30,
      interval: [1.3, 0.7],
      spawns: [
        { type: 'mosquito', pattern: 'line',   weight: 4 },
        { type: 'mosquito', pattern: 'column', weight: 2 },
        { type: 'frog',     pattern: 'single', weight: 3, from: 0.05 },
        { type: 'snake',    pattern: 'single', weight: 3, from: 0.15 },
        { type: 'frog',     pattern: 'pair',   weight: 2, from: 0.3 },
        { type: 'shroom',   pattern: 'single', weight: 2, from: 0.3 },
      ],
      boss: {
        name: '늪의 주인 거대 두꺼비 보그', art: 'toad', bullet: '🟢', bubble: '🟣',
        size: 140, r: 58, hp: 135, score: 7500, idleT: 1.0,
        patterns: ['bubbles', 'rain', 'bubbles', 'spread'],
      },
    },

    // ================= 챕터 6 =================
    {
      id: 6,
      name: '폭풍 치는 바다',
      intro: [
        '챕터 6', '폭풍 치는 바다 위 해적선', '',
        '해적선에 올라타 바다를 건넌다.',
        '거센 파도와 번개가 몰아친다!', '',
        '문어 선장의 여덟 다리가',
        '사방에서 날아온다!',
      ],
      outro: [
        '챕터 6 클리어!', '',
        '문어 선장을 물리쳤다.',
        '폭풍이 잦아들었다.', '',
        '저 멀리 붉게 타오르는',
        '화산이 보인다!',
      ],
      bg: {
        top: '#1e3a5f', bottom: '#2e6aa0', waves: true,
        decor: ['🐚', '⚓', '🌊', '🐠'], edge: null, weather: 'rain',
      },
      duration: 30,
      interval: [1.3, 0.68],
      spawns: [
        { type: 'fish',   pattern: 'line',   weight: 4 },
        { type: 'crab',   pattern: 'side',   weight: 3 },
        { type: 'fish',   pattern: 'pair',   weight: 2 },
        { type: 'puffer', pattern: 'single', weight: 2, from: 0.1 },
        { type: 'squid',  pattern: 'single', weight: 3, from: 0.2 },
        { type: 'shark',  pattern: 'single', weight: 2, from: 0.35 },
      ],
      boss: {
        name: '문어 선장 옥토 블랙비어드', art: 'octo', bullet: '💦', minion: 'fish',
        size: 140, r: 56, hp: 150, score: 8000, idleT: 1.0,
        patterns: ['tentacle', 'ring', 'tentacle', 'summon', 'spread'],
      },
    },

    // ================= 챕터 7 =================
    {
      id: 7,
      name: '용암 화산 협곡',
      intro: [
        '챕터 7', '용암이 흐르는 화산 협곡', '',
        '탑으로 가는 유일한 길은',
        '화산 협곡을 지나간다.', '',
        '바닥에 용암이 차오르면',
        '안전한 곳으로 피하자!',
      ],
      outro: [
        '챕터 7 클리어!', '',
        '불꽃 전갈이 쓰러지고',
        '용암이 식어 간다.', '',
        '협곡 끝에 어둠에 잠긴',
        '성이 우뚝 서 있다.',
      ],
      bg: {
        top: '#3a0d0d', bottom: '#b8400f', path: 'rgba(255,120,30,0.22)',
        decor: ['🪨', '🔥', '🌋'], edge: '🌋', weather: 'embers',
      },
      duration: 30,
      interval: [1.25, 0.65],
      spawns: [
        { type: 'meteor',   pattern: 'column', weight: 3 },
        { type: 'meteor',   pattern: 'single', weight: 3 },
        { type: 'lizard',   pattern: 'line',   weight: 3 },
        { type: 'lavaball', pattern: 'side',   weight: 3, from: 0.1 },
        { type: 'imp',      pattern: 'single', weight: 3, from: 0.15 },
        { type: 'rock',     pattern: 'single', weight: 2, from: 0.3 },
      ],
      boss: {
        name: '불꽃 전갈 스콜치', art: 'scorpion', bullet: '🔥',
        size: 130, r: 52, hp: 140, score: 8500, dashSpeed: 1000, tele: 0.6, idleT: 0.9,
        patterns: ['lava', 'spread', 'charge', 'lava', 'aimed'],
      },
    },

    // ================= 챕터 8 =================
    {
      id: 8,
      name: '어둠의 성',
      intro: [
        '챕터 8', '어둠에 잠긴 마법의 성', '',
        '탑 앞을 가로막은 어둠의 성.',
        '마법에 홀린 병사와 유령이 가득하다.', '',
        '까마귀 마법사가 나타났다 사라지며',
        '마법진을 펼친다!',
      ],
      outro: [
        '챕터 8 클리어!', '',
        '까마귀 마법사가 쓰러졌다.',
        '어둠이 걷히고',
        '구름 위로 솟은 시간의 탑이',
        '모습을 드러낸다!',
      ],
      bg: {
        top: '#14061f', bottom: '#3b1d5c', path: 'rgba(170,60,200,0.28)',
        decor: ['🕯️', '🦇', '⚜️', '🔮'], edge: '🏛️', weather: 'sparkle',
      },
      duration: 30,
      interval: [1.25, 0.65],
      spawns: [
        { type: 'ghost',  pattern: 'line',   weight: 3 },
        { type: 'spider', pattern: 'column', weight: 3 },
        { type: 'bat',    pattern: 'side',   weight: 3 },
        { type: 'skull',  pattern: 'single', weight: 3, from: 0.1 },
        { type: 'orb',    pattern: 'single', weight: 3, from: 0.2 },
        { type: 'statue', pattern: 'single', weight: 2, from: 0.35 },
      ],
      boss: {
        name: '까마귀 마법사 레이븐', art: 'raven', bullet: '🔮',
        size: 120, r: 44, hp: 170, score: 9000, idleT: 0.9,
        patterns: ['teleport', 'magic', 'ring', 'magic', 'teleport', 'spread'],
      },
    },

    // ================= 챕터 9 =================
    {
      id: 9,
      name: '시간의 탑',
      intro: [
        '챕터 9', '구름 위로 솟은 시간의 탑', '',
        '탑 꼭대기에는 현실로 통하는',
        '시간의 문이 있다.', '',
        '문지기 용이 시간을',
        '느리게 만든다!',
      ],
      outro: [
        '챕터 9 클리어!', '',
        '늙은 용 크로노스가 말했다.',
        '"그대의 용기를 확인했노라."', '',
        '시간의 문이 열리고',
        '눈부신 빛이 고양이를 감싼다!',
      ],
      bg: {
        top: '#fde68a', bottom: '#93c5fd',
        decor: ['⭐', '⏳', '⚙️', '🕰️'], edge: null, weather: 'clouds',
      },
      duration: 30,
      interval: [1.2, 0.62],
      spawns: [
        { type: 'star',      pattern: 'line',   weight: 3 },
        { type: 'alarm',     pattern: 'column', weight: 3 },
        { type: 'gear',      pattern: 'single', weight: 2 },
        { type: 'hourglass', pattern: 'single', weight: 3, from: 0.1 },
        { type: 'star',      pattern: 'pair',   weight: 2 },
        { type: 'alarm',     pattern: 'pair',   weight: 2, from: 0.3 },
      ],
      boss: {
        name: '늙은 용 크로노스', art: 'dragon', bullet: '⏳',
        size: 150, r: 60, hp: 185, score: 10000, idleT: 0.9,
        patterns: ['slow', 'wall', 'ring', 'slow', 'aimed', 'wall'],
      },
    },

    // ================= 챕터 10 =================
    {
      id: 10,
      name: '비 오는 동네',
      intro: [
        '챕터 10', '비 오는 동네, 주인과의 재회', '',
        '현실로 돌아왔다냥!',
        '비 오는 거리에서 주인님이',
        '나를 애타게 찾고 있다.', '',
        '폭풍을 뚫고 주인님께 가자!',
      ],
      outro: [
        '주인님을 만났다!', '',
        '"여기 있었구나... 미안해!"',
        '주인님이 고양이를 꼭 껴안았다.', '',
        '구름이 걷히고',
        '따뜻한 햇살이 비친다.',
      ],
      bg: {
        top: '#3f4a63', bottom: '#5c6577', path: 'rgba(40,45,60,0.5)', dash: true,
        decor: ['🍂', '💧', '☔'], edge: '🌳', weather: 'rain',
      },
      duration: 30,
      interval: [1.15, 0.58],
      spawns: [
        { type: 'drop',      pattern: 'column', weight: 3 },
        { type: 'leaf',      pattern: 'line',   weight: 3 },
        { type: 'bolt',      pattern: 'side',   weight: 3 },
        { type: 'umbrella',  pattern: 'pair',   weight: 2, from: 0.05 },
        { type: 'raincloud', pattern: 'single', weight: 3, from: 0.15 },
        { type: 'tornado',   pattern: 'single', weight: 2, from: 0.3 },
      ],
      boss: {
        name: '폭풍 구름 스톰', art: 'storm', bullet: '💧',
        size: 160, r: 62, hp: 180, score: 15000, idleT: 0.85,
        patterns: ['rain', 'lightning', 'wind', 'spread', 'lightning', 'aimed'],
      },
    },
  ],
};
