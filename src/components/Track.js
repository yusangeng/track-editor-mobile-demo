import React from 'react';
import Clip from './Clip';
import './Track.css';

const Track = ({
  track,
  zoom,
  timeScale = 30,
  currentTime,
  onClipDragStart,
  onClipResizeStart,
  onTrackClick,
  className = ""
}) => {
  // 获取轨道图标
  const getTrackIcon = (type) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'text': return '📝';
      case 'effects': return '✨';
      default: return '📄';
    }
  };

  // 处理轨道点击
  const handleTrackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 只有点击轨道空白区域才处理
    if (e.target === e.currentTarget || e.target.classList.contains('track')) {
      if (onTrackClick) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const newTime = x / (timeScale * zoom);
        onTrackClick(newTime);
      }
    }
  };

  return (
    <div
      className={`track mobile track-${track.type} ${track.locked ? 'locked' : ''} ${track.muted ? 'muted' : ''} ${className}`}
      style={{ height: `${track.height}px` }}
      onTouchStart={handleTrackClick}
      onClick={handleTrackClick}
    >
      {/* 轨道头部 */}
      <div className="track-header mobile">
        <span className="track-icon mobile">{getTrackIcon(track.type)}</span>
        <span className="track-name mobile">{track.name}</span>
        <div className="track-controls mobile">
          {track.muted && <span className="track-status muted">🔇</span>}
          {track.locked && <span className="track-status locked">🔒</span>}
        </div>
      </div>

      {/* 片段容器 */}
      <div className="track-clips mobile">
        {track.clips.map(clip => (
          <Clip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            timeScale={timeScale}
            onDragStart={onClipDragStart}
            onResizeStart={onClipResizeStart}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(Track);