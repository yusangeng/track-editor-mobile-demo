import React from 'react';
import './Timeline.css';

const Timeline = ({
  duration,
  zoom,
  onTimeClick,
  timeScale = 30,
  className = ""
}) => {
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
    return time * timeScale * zoom;
  };

  // 处理时间标尺点击
  const handleRulerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onTimeClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const newTime = x / (timeScale * zoom);
      onTimeClick(Math.max(0, Math.min(duration, newTime)));
    }
  };

  const timelineWidth = timeToPixels(duration);
  const timeMarkers = generateTimeMarkers();

  return (
    <div
      className={`timeline-ruler mobile ${className}`}
      style={{ width: `${timelineWidth}px` }}
      onTouchStart={handleRulerClick}
      onClick={handleRulerClick}
    >
      {timeMarkers.map((marker, index) => (
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
  );
};

export default Timeline;