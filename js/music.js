// 音乐控制核心逻辑 - 支持跨页面播放
class MusicPlayer {
  constructor() {
    // 获取DOM元素
    this.audio = document.getElementById('bg-music');
    this.record = document.querySelector('.record');
    this.tonearm = document.querySelector('.tonearm');
    this.musicPlayer = document.querySelector('.music-player');
    
    // 状态标识：从localStorage读取（跨页面同步）
    this.isPlaying = localStorage.getItem('musicPlaying') === 'true';
    this.audioTouched = localStorage.getItem('audioTouched') === 'true';

    // 初始化音频状态
    this.initAudioState();
    // 初始化事件监听
    this.initEventListeners();
  }

  // 初始化音频状态（跨页面恢复播放/暂停）
  initAudioState() {
    if (!this.audio || !this.record || !this.tonearm) return;

    // 恢复唱片/唱针样式
    if (this.isPlaying) {
      this.record.classList.add('rotate');
      this.tonearm.classList.remove('lifted');
      // 尝试播放（需用户已交互）
      if (this.audioTouched) {
        this.audio.play().catch(err => {
          console.log('恢复播放失败:', err);
          this.isPlaying = false;
          localStorage.setItem('musicPlaying', 'false');
          this.record.classList.remove('rotate');
          this.tonearm.classList.add('lifted');
        });
      }
    } else {
      this.record.classList.remove('rotate');
      this.tonearm.classList.add('lifted');
    }

    // 标记音频已加载（避免重复预加载）
    this.audio.dataset.loaded = 'true';
  }

  // 初始化事件
  initEventListeners() {
    if (!this.musicPlayer) return;

    // 唱片/唱针点击事件：切换播放/暂停
    this.musicPlayer.addEventListener('click', () => {
      this.isPlaying ? this.pause() : this.play();
    });

    // 页面首次交互触发（解决浏览器自动播放限制）
    if (!this.audioTouched) {
      const touchHandler = () => {
        this.audioTouched = true;
        localStorage.setItem('audioTouched', 'true');
        document.removeEventListener('click', touchHandler);
        document.removeEventListener('keydown', touchHandler);
      };
      document.addEventListener('click', touchHandler);
      document.addEventListener('keydown', touchHandler);
    }

    // 页面跳转前保存播放状态（可选：支持a标签跳转不中断）
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (link.href && !link.href.includes('#') && link.target !== '_blank') {
        link.addEventListener('click', () => {
          // 保存当前播放状态
          localStorage.setItem('musicPlaying', this.isPlaying);
          // 音频不暂停（浏览器会保留Audio实例直到新页面加载）
        });
      }
    });
  }

  // 播放音乐
  play() {
    if (!this.audioTouched) return; // 未交互则不播放（浏览器限制）
    
    this.audio.play().then(() => {
      this.isPlaying = true;
      localStorage.setItem('musicPlaying', 'true');
      this.record.classList.add('rotate'); // 唱片旋转
      this.tonearm.classList.remove('lifted'); // 放下唱针
    }).catch(err => {
      console.log('播放失败:', err);
    });
  }

  // 暂停音乐
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    localStorage.setItem('musicPlaying', 'false');
    this.record.classList.remove('rotate'); // 停止旋转
    this.tonearm.classList.add('lifted'); // 抬起唱针
  }

  // 游戏碰撞时暂停（保留游戏联动）
  pauseOnCrash() {
    if (this.isPlaying) {
      this.pause();
    }
  }

  // 游戏重新开始时播放（保留游戏联动）
  playOnRestart() {
    if (!this.isPlaying && this.audioTouched) {
      this.play();
    }
  }
}

// 页面加载完成后初始化音乐播放器
document.addEventListener('DOMContentLoaded', () => {
  // 检查是否存在音乐DOM元素
  if (document.getElementById('bg-music')) {
    window.musicPlayer = new MusicPlayer();
  }
});

// 页面卸载前确保状态保存（兼容部分浏览器）
window.addEventListener('beforeunload', () => {
  if (window.musicPlayer) {
    localStorage.setItem('musicPlaying', window.musicPlayer.isPlaying);
    localStorage.setItem('audioTouched', window.musicPlayer.audioTouched);
  }
});