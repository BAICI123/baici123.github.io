用户名.github.io/
│
├── index.html		#默认页面（导航和音乐组件，通过iframe保证音乐不断）
├── home.html       # 主页（含游戏组件）
├── projects.html    # 项目页面
├── about.html       # 关于我页面
│
├── css/
│   ├──  base.css    # 基础样式
│   ├──  index.css	#默认页单独样式（导航、音乐）
│   ├──  home.css	#主页样式（游戏）
│   ├──  projects.css	#项目单独样式
│   ├──  about.css	#关于页单独样式
│
├── js/
│   ├── game.js      # 飞机小游戏核心逻辑
│   └── music.js     # 音乐播放器逻辑（跨页面同步）
│
├── images/
│   ├── avatar.jpg   # 首页头像
│   ├── plane-sticker.png  # 游戏飞机贴纸（game.js 引用）
│   ├── pillar-bottom.png  # 游戏柱子贴纸（game.js 引用）
│   ├── cat1.png ~ cat6.png # 游戏猫咪贴纸（game.js 引用）
│   ├── cylinder.png        # 游戏圆柱体贴纸（game.js 引用）
│   └── life/        # 放点图片
│
└── music/
    └── background.mp3  # 背景音乐文件（各页面audio标签引用）