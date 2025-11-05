import React from 'react';
import './Toolbar.css';

const Toolbar = ({
  currentTime,
  duration,
  isPlaying,
  zoom,
  onPlayPause,
  onZoomIn,
  onZoomOut,
  className = ""
}) => {
  // 时间格式化
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // 处理键盘快捷键
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case '+':
        case '=':
          e.preventDefault();
          onZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          onZoomOut();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onZoomIn, onZoomOut]);

  return (
    <div className={`toolbar mobile ${className}`}>
      {/* 播放控制区域 */}
      <div className="playback-controls">
        <button
          onClick={onPlayPause}
          className="play-button mobile"
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="time-display mobile">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="divider">/</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 缩放控制区域 */}
      <div className="zoom-controls mobile">
        <button
          onClick={onZoomOut}
          className="zoom-button mobile"
          aria-label="缩小"
          disabled={zoom <= 0.1}
        >
          −
        </button>

        <span className="zoom-level">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="zoom-button mobile"
          aria-label="放大"
          disabled={zoom >= 3.0}
        >
          +
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="shortcuts-hint mobile">
        <span className="shortcut">空格:播放/暂停</span>
        <span className="shortcut">+/-:缩放</span>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);