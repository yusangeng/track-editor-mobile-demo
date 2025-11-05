import React, { useState, useRef, useCallback, useEffect } from 'react';
import './TrackEditor.css';

// 移动端优化配置
const TIME_SCALE = 30; // 更小的像素比例，适合手机屏幕
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
const MOBILE_CLIP_MIN_WIDTH = 40; // 移动端最小片段宽度

const TrackEditor = () => {
  const [zoom, setZoom] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(30); // 减少到30秒，更适合移动端
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragState, setDragState] = useState({
    isDragging: false,
    clip: null,
    originalTrackId: null,
    originalStartTime: 0,
    startX: 0,
    startY: 0,
    targetTrackId: null
  });

  const timelineRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  // 移动端适配的轨道数据
  const [tracks, setTracks] = useState([
    {
      id: 'track-1',
      type: 'video',
      height: 70, // 减小高度
      clips: [
        { id: 'clip-1', type: 'video', startTime: 0, duration: 4, name: '视频1', color: '#FF6B6B' },
        { id: 'clip-2', type: 'video', startTime: 5, duration: 3, name: '视频2', color: '#4ECDC4' },
      ]
    },
    {
      id: 'track-2',
      type: 'audio',
      height: 50,
      clips: [
        { id: 'clip-3', type: 'audio', startTime: 1, duration: 6, name: '音频1', color: '#95E77E', waveform: generateMockWaveform(6) },
        { id: 'clip-4', type: 'audio', startTime: 8, duration: 4, name: '音频2', color: '#FFE66D', waveform: generateMockWaveform(4) },
      ]
    },
    {
      id: 'track-3',
      type: 'text',
      height: 50,
      clips: [
        { id: 'clip-5', type: 'text', startTime: 2, duration: 5, name: '标题文字', color: '#A8E6CF' },
      ]
    },
    {
      id: 'track-4',
      type: 'effects',
      height: 50,
      clips: [
        { id: 'clip-6', type: 'effect', startTime: 3, duration: 2, name: '淡入效果', color: '#C7B3E5' },
      ]
    }
  ]);

  // 生成模拟波形数据
  function generateMockWaveform(duration) {
    const samples = Math.floor(duration * 50); // 减少采样率，提高性能
    const waveform = [];
    for (let i = 0; i < samples; i++) {
      waveform.push(Math.random() * 0.6 + 0.2);
    }
    return waveform;
  }

  // 时间格式化
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // 根据缩放级别计算时间间隔
  const getTimeInterval = (zoom) => {
    if (zoom < 0.3) return 5;      // 低缩放：5秒间隔
    if (zoom < 0.6) return 2;      // 中低缩放：2秒间隔
    if (zoom < 1.0) return 1;      // 中等缩放：1秒间隔
    if (zoom < 2.0) return 0.5;    // 高缩放：0.5秒间隔
    if (zoom < 3.0) return 0.2;    // 很高缩放：0.2秒间隔
    return 0.1;                    // 超高缩放：0.1秒间隔
  };

  // 生成时间标记
  const generateTimeMarkers = () => {
    const interval = getTimeInterval(zoom);
    const markers = [];
    const totalMarkers = Math.ceil(duration / interval) + 1;

    for (let i = 0; i < totalMarkers; i++) {
      const time = i * interval;
      if (time <= duration) {
        markers.push({
          time,
          label: time < 1 ? `${Math.round(time * 10) * 100}ms` : `${time}s`,
          isMajor: time % 1 === 0 || (interval < 1 && time % 1 < interval)
        });
      }
    }

    return markers;
  };

  // 时间到像素的转换
  const timeToPixels = (time) => {
    return time * TIME_SCALE * zoom;
  };

  // 像素到时间的转换
  const pixelsToTime = (pixels) => {
    return pixels / (TIME_SCALE * zoom);
  };

  // 处理时间标尺点击（只允许点击标尺移动时间指针）
  const handleRulerClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = timelineRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const newTime = pixelsToTime(x + timelineRef.current.scrollLeft);
    setCurrentTime(Math.max(0, Math.min(duration, newTime)));
  }, [duration]);

  // 处理轨道空白区域点击（移动时间指针）
  const handleTrackClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // 只有点击轨道空白区域才移动时间指针
    if (e.target === e.currentTarget || e.target.classList.contains('track')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const newTime = pixelsToTime(x + timelineRef.current.scrollLeft);
      setCurrentTime(Math.max(0, Math.min(duration, newTime)));
    }
  }, [duration]);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // 播放动画循环
  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp) => {
        if (lastTimeRef.current) {
          const deltaTime = (timestamp - lastTimeRef.current) / 1000;
          setCurrentTime(prev => {
            const newTime = prev + deltaTime;
            if (newTime >= duration) {
              setIsPlaying(false);
              return duration;
            }
            return newTime;
          });
        }
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        lastTimeRef.current = 0;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(MIN_ZOOM, prev / 1.2));
  }, []);

  // 获取触摸点所在的轨道
  const getTrackFromPosition = (y, containerRect) => {
    const relativeY = y - containerRect.top;
    const rulerHeight = 30; // 移动端时间标尺高度

    if (relativeY <= rulerHeight) {
      return null; // 点击在时间标尺上
    }

    const trackAreaY = relativeY - rulerHeight;
    let currentY = 0;

    for (const track of tracks) {
      currentY += track.height;
      if (trackAreaY <= currentY) {
        return track.id;
      }
    }

    return tracks[tracks.length - 1].id; // 默认返回最后一个轨道
  };

  // 获取轨道顶部位置
  const getTrackTopPosition = (trackId) => {
    let top = 0;
    const rulerHeight = 30; // 移动端时间标尺高度

    for (const track of tracks) {
      if (track.id === trackId) {
        return rulerHeight + top + 3; // +3 是片段的top偏移
      }
      top += track.height;
    }

    return rulerHeight + top + 3;
  };

  // 获取片段图标
  const getClipIcon = (type) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'effect': return '✨';
      default: return '📄';
    }
  };

  // 简化的拖拽开始
  const handleDragStart = (e, clip, trackId) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];

    setDragState({
      isDragging: true,
      clip: { ...clip },
      originalTrackId: trackId,
      originalStartTime: clip.startTime,
      startX: touch.clientX,
      startY: touch.clientY,
      targetTrackId: trackId
    });
  };

  // 拖拽移动
  const handleDragMove = useCallback((e) => {
    e.preventDefault();

    if (!dragState.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    const timeDelta = pixelsToTime(deltaX);
    const newStartTime = Math.max(0, dragState.originalStartTime + timeDelta);

    // 检测目标轨道
    const containerRect = timelineRef.current.getBoundingClientRect();
    const targetTrackId = getTrackFromPosition(touch.clientY, containerRect) || dragState.originalTrackId;

    // 更新拖拽状态
    setDragState(prev => ({
      ...prev,
      clip: { ...prev.clip, startTime: newStartTime },
      targetTrackId
    }));
  }, [dragState]);

  // 拖拽结束
  const handleDragEnd = useCallback((e) => {
    e.preventDefault();

    if (!dragState.isDragging) return;

    // 应用最终的位置和轨道
    setTracks(prevTracks => {
      const newTracks = [...prevTracks];

      // 从原轨道移除
      const originalTrack = newTracks.find(t => t.id === dragState.originalTrackId);
      originalTrack.clips = originalTrack.clips.filter(c => c.id !== dragState.clip.id);

      // 添加到目标轨道
      const targetTrack = newTracks.find(t => t.id === dragState.targetTrackId);
      if (targetTrack) {
        targetTrack.clips.push({
          ...dragState.clip,
          startTime: dragState.clip.startTime
        });
      }

      return newTracks;
    });

    // 重置拖拽状态
    setDragState({
      isDragging: false,
      clip: null,
      originalTrackId: null,
      originalStartTime: 0,
      startX: 0,
      startY: 0,
      targetTrackId: null
    });
  }, [dragState]);

  // 添加全局触摸事件监听器
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd, { passive: false });

      return () => {
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // 自动滚动到播放位置
  useEffect(() => {
    if (timelineRef.current) {
      const playheadPosition = timeToPixels(currentTime);
      const containerWidth = timelineRef.current.clientWidth;
      const scrollLeft = timelineRef.current.scrollLeft;

      if (playheadPosition < scrollLeft || playheadPosition > scrollLeft + containerWidth - 100) {
        timelineRef.current.scrollTo({
          left: Math.max(0, playheadPosition - containerWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime]);

  const timelineWidth = timeToPixels(duration);

  return (
    <div className="track-editor mobile">
      {/* 移动端工具栏 */}
      <div className="toolbar mobile">
        <div className="playback-controls">
          <button onClick={togglePlay} className="play-button mobile">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="time-display mobile">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="divider">/</span>
            <span className="total-time">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="zoom-controls mobile">
          <button onClick={handleZoomOut} className="zoom-button mobile">−</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="zoom-button mobile">+</button>
        </div>
      </div>

      {/* 时间线容器 */}
      <div className="timeline-container mobile">
        {/* 时间标尺 */}
        <div
          className="timeline-ruler mobile"
          style={{ width: `${timelineWidth}px` }}
          onTouchStart={handleRulerClick}
          onClick={handleRulerClick}
        >
          {generateTimeMarkers().map((marker, index) => (
            <div
              key={index}
              className={`time-marker mobile ${marker.isMajor ? 'major' : 'minor'}`}
              style={{ left: `${timeToPixels(marker.time)}px` }}
            >
              <div className={`time-tick ${marker.isMajor ? 'major' : 'minor'}`}></div>
              {marker.isMajor && (
                <span className="time-label">{marker.label}</span>
              )}
            </div>
          ))}
        </div>

        {/* 轨道容器 */}
        <div
          ref={timelineRef}
          className="tracks-container mobile"
          style={{ width: `${timelineWidth}px` }}
        >
          {tracks.map(track => (
            <div
              key={track.id}
              className={`track mobile track-${track.type}`}
              style={{ height: `${track.height}px` }}
              onTouchStart={handleTrackClick}
              onClick={handleTrackClick}
            >
              {track.clips.map(clip => (
                <MobileClip
                  key={clip.id}
                  clip={clip}
                  trackId={track.id}
                  zoom={zoom}
                  onDragStart={handleDragStart}
                  isDragging={dragState.isDragging && dragState.clip.id === clip.id}
                />
              ))}
            </div>
          ))}

          {/* 播放指针 */}
          <div
            className="playhead mobile"
            style={{ left: `${timeToPixels(currentTime)}px` }}
          />

          {/* 拖拽预览 */}
          {dragState.isDragging && dragState.clip && (
            <div
              className={`drag-preview clip mobile clip-${dragState.clip.type}`}
              style={{
                position: 'absolute',
                top: `${getTrackTopPosition(dragState.targetTrackId)}px`,
                left: `${timeToPixels(dragState.clip.startTime)}px`,
                width: `${Math.max(MOBILE_CLIP_MIN_WIDTH, dragState.clip.duration * TIME_SCALE * zoom)}px`,
                backgroundColor: dragState.clip.color,
                opacity: 0.8,
                zIndex: 2000,
                pointerEvents: 'none',
                transform: 'scale(1.05)',
                border: '2px dashed rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="clip-content mobile">
                <span className="clip-icon mobile">{getClipIcon(dragState.clip.type)}</span>
                <span className="clip-name mobile">{dragState.clip.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 移动端提示信息 */}
      <div className="mobile-tips">
        <p>📱 拖拽片段到任意轨道 • 拖拽边缘调整长度 • 点击标尺或空白区域定位时间</p>
      </div>
    </div>
  );
};

// 移动端片段组件
const MobileClip = ({ clip, trackId, zoom, onDragStart, isDragging }) => {
  const width = Math.max(MOBILE_CLIP_MIN_WIDTH, clip.duration * TIME_SCALE * zoom);
  const left = clip.startTime * TIME_SCALE * zoom;

  const getClipIcon = (type) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'effect': return '✨';
      default: return '📄';
    }
  };

  return (
    <div
      className={`clip mobile clip-${clip.type} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: isDragging ? 'transparent' : clip.color,
        minWidth: `${MOBILE_CLIP_MIN_WIDTH}px`,
        opacity: isDragging ? 0.3 : 1
      }}
      onTouchStart={(e) => onDragStart(e, clip, trackId)}
    >
      {/* 片段内容 */}
      <div className="clip-content mobile">
        <span className="clip-icon mobile">{getClipIcon(clip.type)}</span>
        <span className="clip-name mobile">{clip.name}</span>
      </div>

      {/* 音频波形 */}
      {clip.type === 'audio' && clip.waveform && !isDragging && (
        <MobileWaveform waveform={clip.waveform} width={width} />
      )}
    </div>
  );
};

// 移动端波形显示组件
const MobileWaveform = ({ waveform, width }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 优化的波形绘制
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    const barWidth = Math.max(1, width / waveform.length);
    const centerY = height / 2;

    ctx.beginPath();
    waveform.forEach((amplitude, i) => {
      const x = i * barWidth;
      const barHeight = amplitude * height * 0.7;

      ctx.moveTo(x, centerY - barHeight / 2);
      ctx.lineTo(x, centerY + barHeight / 2);
    });
    ctx.stroke();
  }, [waveform, width]);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas mobile"
      width={width}
      height={30}
    />
  );
};

export default TrackEditor;