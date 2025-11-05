// 初始项目数据结构
export const initialProjectData = {
  // 项目元数据
  metadata: {
    name: "未命名项目",
    duration: 30, // 总时长（秒）
    frameRate: 30,
    resolution: {
      width: 1920,
      height: 1080
    }
  },

  // 轨道配置
  tracks: [
    {
      id: "track-1",
      type: "video",
      name: "视频轨道 1",
      height: 70,
      muted: false,
      locked: false,
      clips: [
        {
          id: "clip-1",
          type: "video",
          name: "视频1",
          startTime: 0,
          duration: 4,
          color: "#FF6B6B",
          metadata: {
            source: "video1.mp4",
            inPoint: 0,
            outPoint: 4
          }
        },
        {
          id: "clip-2",
          type: "video",
          name: "视频2",
          startTime: 5,
          duration: 3,
          color: "#4ECDC4",
          metadata: {
            source: "video2.mp4",
            inPoint: 0,
            outPoint: 3
          }
        }
      ]
    },
    {
      id: "track-2",
      type: "audio",
      name: "音频轨道 1",
      height: 50,
      muted: false,
      locked: false,
      clips: [
        {
          id: "clip-3",
          type: "audio",
          name: "音频1",
          startTime: 1,
          duration: 6,
          color: "#95E77E",
          volume: 1.0,
          waveform: generateMockWaveform(6),
          metadata: {
            source: "audio1.mp3",
            inPoint: 0,
            outPoint: 6
          }
        },
        {
          id: "clip-4",
          type: "audio",
          name: "音频2",
          startTime: 8,
          duration: 4,
          color: "#FFE66D",
          volume: 1.0,
          waveform: generateMockWaveform(4),
          metadata: {
            source: "audio2.mp3",
            inPoint: 0,
            outPoint: 4
          }
        }
      ]
    },
    {
      id: "track-3",
      type: "text",
      name: "文本轨道 1",
      height: 50,
      muted: false,
      locked: false,
      clips: [
        {
          id: "clip-5",
          type: "text",
          name: "标题文字",
          startTime: 2,
          duration: 5,
          color: "#A8E6CF",
          metadata: {
            text: "标题文字",
            fontSize: 48,
            fontFamily: "Arial",
            color: "#FFFFFF",
            position: { x: 100, y: 200 }
          }
        }
      ]
    },
    {
      id: "track-4",
      type: "effects",
      name: "特效轨道 1",
      height: 50,
      muted: false,
      locked: false,
      clips: [
        {
          id: "clip-6",
          type: "effect",
          name: "淡入效果",
          startTime: 3,
          duration: 2,
          color: "#C7B3E5",
          metadata: {
            effectType: "fadeIn",
            parameters: {
              duration: 1,
              ease: "ease-in-out"
            }
          }
        }
      ]
    }
  ]
};

// 生成模拟波形数据
function generateMockWaveform(duration) {
  const samples = Math.floor(duration * 50);
  const waveform = [];
  for (let i = 0; i < samples; i++) {
    waveform.push(Math.random() * 0.6 + 0.2);
  }
  return waveform;
}

// 片段类型配置
export const clipTypeConfig = {
  video: {
    icon: "🎬",
    defaultColor: "#FF6B6B",
    name: "视频"
  },
  audio: {
    icon: "🎵",
    defaultColor: "#95E77E",
    name: "音频"
  },
  text: {
    icon: "📝",
    defaultColor: "#A8E6CF",
    name: "文本"
  },
  image: {
    icon: "🖼️",
    defaultColor: "#FFE66D",
    name: "图片"
  },
  effect: {
    icon: "✨",
    defaultColor: "#C7B3E5",
    name: "特效"
  }
};

// 轨道类型配置
export const trackTypeConfig = {
  video: {
    icon: "🎬",
    defaultHeight: 70,
    name: "视频轨道"
  },
  audio: {
    icon: "🎵",
    defaultHeight: 50,
    name: "音频轨道"
  },
  text: {
    icon: "📝",
    defaultHeight: 50,
    name: "文本轨道"
  },
  effects: {
    icon: "✨",
    defaultHeight: 50,
    name: "特效轨道"
  }
};