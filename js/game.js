// 游戏核心元素
const game = document.getElementById('plane-game');
const plane = document.getElementById('plane');
const scoreDisplay = document.getElementById('score');
const startTip = document.getElementById('start-tip');
const pillarContainer = document.getElementById('pillar-container');
const crashTip = document.getElementById('crash-tip');

// 游戏配置（✅ 测试用：屏蔽图片，后续开启只需改 useImage 为 true）
const config = {
  useImage: true, // 改为true启用贴纸
  moveSpeed: 1.8,
  pillarInitSpeed: 1.8,
  pillarGap: 120,
  pillarCreateInterval: 1800,
  speedUpScore: 6,
  speedUpStep: 0.15,
  // 基础贴纸路径
  planeImg: './images/plane-sticker.png',
  pillarBottomImg: './images/pillar-bottom.png',
  // 猫咪贴纸配置
  catImgs: [ // cat1-cat6 路径
    './images/cat1.png',
    './images/cat2.png',
    './images/cat3.png',
    './images/cat4.png',
    './images/cat5.png',
    './images/cat6.png'
  ],
  catSize: {w:40, h:40}, // 猫咪尺寸
  catShowProbability: 0.7, // 猫咪出现概率（0-1，0.7=70%）
  // 圆柱体贴纸配置
  pillarCylinderImg: './images/cylinder.png',
  cylinderSize: {w:40, h:130}, // 圆柱体尺寸
  // 纯色块尺寸（测试用）
  planeSize: {w:24, h:24},
  pillarSize: {w:40, h: 'auto'},
  planeLeftPercent: 15,
  // 新增：柱子装饰最小高度
  pillarDecorMinHeight: 45
};

// 游戏状态
let isPlaying = false;
let isCrashing = false; // 核心：避免重复碰撞
let score = 0;
let pillarSpeed = config.pillarInitSpeed;
let pillarTimer = null;
let moveTimer = null;
let planeTimer = null;
let planeBottom = 0;
let gameHeight = 0;
let gameWidth = 0;
let direction = -1;

// 初始化游戏尺寸和元素样式
function initGameSize() {
  gameHeight = game.clientHeight;
  gameWidth = game.clientWidth;
  planeBottom = (gameHeight - config.planeSize.h) / 2;
  
  const planeLeft = (gameWidth * config.planeLeftPercent) / 100;
  
  // 手机端尺寸适配
  if (window.innerWidth <= 768) {
    config.planeSize = {w:20, h:20};
    config.pillarSize = {w:30, h: 'auto'};
  }
  
  // 初始化飞机样式
  plane.style.width = `${config.planeSize.w}px`;
  plane.style.height = `${config.planeSize.h}px`;
  plane.style.bottom = `${planeBottom}px`;
  plane.style.left = `${planeLeft}px`;
  
  // ✅ 测试用：仅在开启图片时加载背景图
  if (config.useImage) {
    plane.style.backgroundImage = `url(${config.planeImg})`;
  } else {
    plane.style.backgroundImage = 'none'; // 屏蔽图片，显示纯色块
  }
}

// 切换飞机运动方向（碰撞时不响应）
function toggleDirection() {
  if (isCrashing) return;
  if (!isPlaying) {
    startGame();
    return;
  }
  direction = -direction;
}

// 飞机运动逻辑（松弛缓动）
function planeMove() {
  if (!isPlaying) return;
  const easeFactor = 0.98;
  planeBottom += direction * config.moveSpeed * easeFactor;
  
  // 边界检测（触边直接结束）
  if (planeBottom + config.planeSize.h >= gameHeight) {
    planeBottom = gameHeight - config.planeSize.h;
    gameOver();
  } else if (planeBottom <= 0) {
    planeBottom = 0;
    gameOver();
  }
  
  plane.style.bottom = `${planeBottom}px`;
}

// 开始游戏（彻底重置状态）
function startGame() {
  isPlaying = true;
  isCrashing = false;
  score = 0;
  pillarSpeed = config.pillarInitSpeed;
  direction = -1;
  startTip.style.display = 'none';
  scoreDisplay.innerText = `得分・${score}`;
  pillarContainer.innerHTML = ''; // 清空残留柱子
  crashTip.classList.remove('show');
  initGameSize();

  // 启动定时器
  pillarTimer = setInterval(createPillar, config.pillarCreateInterval);
  moveTimer = setInterval(() => {movePillars(); checkCrash();}, 20);
  planeTimer = setInterval(planeMove, 20);
}

// 创建柱子（所有猫咪贴柱子内侧上方）
function createPillar() {
  // 👇 替换原固定80px最小高度，改用配置项（更灵活）
  const minHeight = config.pillarDecorMinHeight; 
  const pillarWidth = config.pillarSize.w;
  // 👇 调整随机高度计算逻辑，适配配置项
  const topPillarHeight = Math.floor(Math.random() * (gameHeight - config.pillarGap - 2 * minHeight)) + minHeight;
  const bottomPillarHeight = gameHeight - topPillarHeight - config.pillarGap;

  // 上柱子（内侧顶端：猫咪 + 下方柱体）
  const topPillar = document.createElement('div');
  topPillar.className = 'pillar pillar-top';
  topPillar.style.height = `${topPillarHeight}px`;
  topPillar.style.width = `${pillarWidth}px`;
  topPillar.style.right = `-${pillarWidth}px`;
  topPillar.style.top = '0';
  topPillar.style.backgroundColor = '#B4C7B9';

  // 上柱子装饰：高度≥配置的最小高度
  if (topPillarHeight >= config.pillarDecorMinHeight) {
    // 👇 新增：随机判断是否显示猫咪（核心修复）
    const isShowCat = Math.random() <= config.catShowProbability;
    let catOffset = 0; // 猫咪占位高度（有猫咪则为40px，无则为0）
    
    // 1. 猫咪：仅当随机概率命中时创建
    if (isShowCat) {
      const randomCatIdx = Math.floor(Math.random() * config.catImgs.length);
      const topCat = document.createElement('div');
      topCat.className = 'pillar-cat';
      topCat.style.width = `${config.catSize.w}px`;
      topCat.style.height = `${config.catSize.h}px`;
      topCat.style.position = 'absolute';
      topCat.style.top = '0px';
      topCat.style.left = '0px';
      topCat.style.zIndex = '10';
      topCat.style.backgroundImage = `url(${config.catImgs[randomCatIdx]})`;
      topCat.style.backgroundSize = '100% 100%';
      topPillar.appendChild(topCat);
      catOffset = config.catSize.h; // 有猫咪时，柱体从猫咪下方开始
    }

    // 2. 柱体：无论是否有猫咪，都适配剩余高度显示（低于40px也能显示）
    const cylinderHeight = Math.min(config.cylinderSize.h, topPillarHeight - catOffset);
    const topCylinder = document.createElement('div');
    topCylinder.className = 'pillar-cylinder';
    topCylinder.style.width = `${config.cylinderSize.w}px`;
    topCylinder.style.height = `${cylinderHeight}px`;
    topCylinder.style.position = 'absolute';
    topCylinder.style.top = `${catOffset}px`; // 有猫咪则在下方，无则贴顶端
    topCylinder.style.left = '0';
    topCylinder.style.zIndex = '9';
    topCylinder.style.backgroundImage = `url(${config.pillarCylinderImg})`;
    topCylinder.style.backgroundSize = '100% 100%';
    topPillar.appendChild(topCylinder);
  }
  
  pillarContainer.appendChild(topPillar);

  // 下柱子（内侧顶端：猫咪 + 下方柱体）
  const bottomPillar = document.createElement('div');
  bottomPillar.className = 'pillar pillar-bottom';
  bottomPillar.style.height = `${bottomPillarHeight}px`;
  bottomPillar.style.width = `${pillarWidth}px`;
  bottomPillar.style.right = `-${pillarWidth}px`;
  bottomPillar.style.bottom = '0';
  bottomPillar.style.backgroundColor = '#B4C7B9';

  // 下柱子装饰：高度≥配置的最小高度
  if (bottomPillarHeight >= config.pillarDecorMinHeight) {
    // 👇 新增：随机判断是否显示猫咪
    const isShowCat = Math.random() <= config.catShowProbability;
    let catOffset = 0;
    
    // 1. 猫咪：仅当随机概率命中时创建
    if (isShowCat) {
      const randomCatIdx = Math.floor(Math.random() * config.catImgs.length);
      const bottomCat = document.createElement('div');
      bottomCat.className = 'pillar-cat';
      bottomCat.style.width = `${config.catSize.w}px`;
      bottomCat.style.height = `${config.catSize.h}px`;
      bottomCat.style.position = 'absolute';
      bottomCat.style.top = '0px';
      bottomCat.style.left = '0px';
      bottomCat.style.zIndex = '10';
      bottomCat.style.backgroundImage = `url(${config.catImgs[randomCatIdx]})`;
      bottomCat.style.backgroundSize = '100% 100%';
      bottomPillar.appendChild(bottomCat);
      catOffset = config.catSize.h;
    }

    // 2. 柱体：适配剩余高度显示
    const cylinderHeight = Math.min(config.cylinderSize.h, bottomPillarHeight - catOffset);
    const bottomCylinder = document.createElement('div');
    bottomCylinder.className = 'pillar-cylinder';
    bottomCylinder.style.width = `${config.cylinderSize.w}px`;
    bottomCylinder.style.height = `${cylinderHeight}px`;
    bottomCylinder.style.position = 'absolute';
    bottomCylinder.style.top = `${catOffset}px`;
    bottomCylinder.style.left = '0';
    bottomCylinder.style.zIndex = '9';
    bottomCylinder.style.backgroundImage = `url(${config.pillarCylinderImg})`;
    bottomCylinder.style.backgroundSize = '100% 100%';
    bottomPillar.appendChild(bottomCylinder);
  }
  
  if (config.useImage) bottomPillar.style.backgroundImage = `url(${config.pillarBottomImg})`;
  else bottomPillar.style.backgroundImage = 'none';
  pillarContainer.appendChild(bottomPillar);
}

// 移动柱子 + 计分逻辑
function movePillars() {
  const allPillars = document.querySelectorAll('.pillar');
  allPillars.forEach(pillar => {
    const pillarWidth = parseInt(pillar.style.width);
    let currentRight = parseInt(pillar.style.right) || 0;
    currentRight += pillarSpeed * 0.99;
    pillar.style.right = `${currentRight}px`;

    // 柱子移出屏幕后删除并计分
    if (currentRight > gameWidth) {
      pillar.remove();
      if (pillar.classList.contains('pillar-top')) {
        score++;
        scoreDisplay.innerText = `得分・${score}`;
        if (score % config.speedUpScore === 0) {
          pillarSpeed += config.speedUpStep;
        }
      }
    }
  });
}

// 精准碰撞检测（碰撞时跳过）
function checkCrash() {
  if (!isPlaying || isCrashing) return;
  
  const planeRect = {
    left: plane.offsetLeft,
    right: plane.offsetLeft + config.planeSize.w,
    top: gameHeight - (planeBottom + config.planeSize.h),
    bottom: gameHeight - planeBottom
  };

  const gameRect = game.getBoundingClientRect();
  document.querySelectorAll('.pillar').forEach(pillar => {
    const pillarRect = pillar.getBoundingClientRect();
    const p = {
      left: pillarRect.left - gameRect.left,
      right: pillarRect.right - gameRect.left,
      top: pillarRect.top - gameRect.top,
      bottom: pillarRect.bottom - gameRect.top
    };
    // 矩形碰撞检测
    if (planeRect.right > p.left && planeRect.left < p.right && planeRect.bottom > p.top && planeRect.top < p.bottom) {
      isCrashing = true;
      crashTip.classList.add('show');
      setTimeout(() => {
        gameOver();
      }, 300);
    }
  });
}

// 游戏结束（核心：彻底重置所有状态）
function gameOver() {
  isPlaying = false;
  isCrashing = false;
  clearInterval(pillarTimer);
  clearInterval(moveTimer);
  clearInterval(planeTimer);
  
  setTimeout(() => {
    alert(`游戏结束 ✿ 最终得分: ${score}`);
    // 重置视觉和位置
    startTip.style.display = 'block';
    crashTip.classList.remove('show');
    direction = -1;
    planeBottom = (gameHeight - config.planeSize.h) / 2;
    plane.style.bottom = `${planeBottom}px`;
    pillarContainer.innerHTML = ''; // 关键：清空所有柱子，避免残留碰撞
  }, 200);
}

// 事件绑定
window.addEventListener('load', initGameSize);
window.addEventListener('resize', initGameSize);
game.addEventListener('click', toggleDirection);
game.addEventListener('touchstart', (e) => {
  e.preventDefault();
  toggleDirection();
});
document.addEventListener('keydown', (e) => {
  if (isPlaying && !isCrashing && e.code === 'Space') {
    e.preventDefault();
    toggleDirection();
  }
});