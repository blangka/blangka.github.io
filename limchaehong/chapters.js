// 챕터 데이터. 새 챕터는 chapters 배열에 항목을 추가하면 됩니다.
// 적 종류는 enemies에, 이동 방식(move)은 game.js의 MOVES에 정의되어 있습니다.
window.GAME_DATA = {
  enemies: {
    // move: sine = 좌우로 흔들리며 내려옴 / shoot = 내려오며 플레이어를 향해 발사 / bounce = 벽에 튕기며 내려옴
    bee:  { emoji: '🐝', size: 34, r: 14, hp: 1, move: 'sine',   speed: 110, score: 100, drop: 1 },
    bird: { emoji: '🐦', size: 38, r: 16, hp: 2, move: 'shoot',  speed: 90,  score: 200, drop: 1.4, fireEvery: 1.8 },
    ball: { emoji: '⚽', size: 42, r: 19, hp: 4, move: 'bounce', speed: 80,  score: 300, drop: 2 },
  },

  chapters: [
    {
      id: 1,
      name: '집 앞마당',
      intro: [
        '챕터 1',
        '집 앞마당',
        '',
        '주인님이 나를 잃어버렸다냥...',
        '어서 주인님에게 돌아가자!',
        '',
        '방해하는 녀석들은 미사일로 물리치자!',
      ],
      outro: [
        '챕터 1 클리어!',
        '',
        '마지막 힘을 다해 앞마당 끝까지 왔다.',
        '하지만 주인님은 어디에도 보이지 않는다...',
        '',
        '그때, 알 수 없는 빛이 고양이를 감쌌다!',
        '',
        '눈을 떠 보니 중세 시대?!',
      ],
      bg: {
        top: '#9bdcff', bottom: '#79c95f',
        path: 'rgba(217,196,160,0.55)',
        decor: ['🌼', '🌷', '🌱', '🍀', '🌻'],
        edge: '🌳',
      },
      duration: 60,           // 보스가 나오기까지의 시간(초)
      interval: [1.5, 0.8],   // 적 등장 간격(초): 시작 -> 보스 직전
      spawns: [               // from: 진행도(0~1) 이후부터 등장
        { type: 'bee',  pattern: 'line',   weight: 4 },
        { type: 'bee',  pattern: 'single', weight: 4 },
        { type: 'bird', pattern: 'single', weight: 3, from: 0.15 },
        { type: 'ball', pattern: 'single', weight: 2, from: 0.35 },
      ],
      boss: {
        name: '이웃집 개 멍멍이 대장',
        emoji: '🐕',
        bullet: '🦴',
        size: 120, r: 50, hp: 90, score: 5000,
        patterns: ['spread', 'ring', 'spread', 'charge'],
      },
    },
  ],
};
