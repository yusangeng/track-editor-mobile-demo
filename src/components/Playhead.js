import React from 'react';
import './Playhead.css';

const Playhead = ({
  currentTime,
  duration,
  zoom,
  timeScale = 30,
  isVisible = true,
  className = ""
}) => {
  // 时间到像素的转换
  const timeToPixels = (time) => {
    return time * timeScale * zoom;
  };

  if (!isVisible) {
    return null;
  }

  const position = timeToPixels(currentTime);

  return (
    <div
      className={`playhead mobile ${className}`}
      style={{ left: `${position}px` }}
    >
      <div className="playhead-line"></div>
      <div className="playhead-arrow"></div>
    </div>
  );
};

export default React.memo(Playhead);