import React from 'react';
import './Clip.css';

const Clip = ({
  clip,
  zoom,
  timeScale = 30,
  minWidth = 40,
  onDragStart,
  onResizeStart,
  isDragging = false,
  isPreview = false,
  className = ""
}) => {
  const width = Math.max(minWidth, clip.duration * timeScale * zoom);
  const left = clip.startTime * timeScale * zoom;

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

  // 处理触摸开始事件
  const handleTouchStart = (e, action = 'drag') => {
    e.preventDefault();
    e.stopPropagation();

    if (action === 'drag' && onDragStart) {
      onDragStart(e, clip);
    } else if (action === 'resize' && onResizeStart) {
      onResizeStart(e, clip, e.target.dataset.direction);
    }
  };

  return (
    <div
      className={`clip mobile clip-${clip.type} ${isDragging ? 'dragging' : ''} ${isPreview ? 'preview' : ''} ${className}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: isDragging ? 'transparent' : clip.color,
        minWidth: `${minWidth}px`,
        opacity: isDragging ? 0.3 : (isPreview ? 0.8 : 1),
        zIndex: isPreview ? 2000 : 1
      }}
      onTouchStart={(e) => handleTouchStart(e, 'drag')}
    >
      {/* 调整大小的手柄 */}
      {!isDragging && (
        <>
          <div
            className="resize-handle mobile resize-start"
            data-direction="start"
            onTouchStart={(e) => handleTouchStart(e, 'resize')}
          />
          <div
            className="resize-handle mobile resize-end"
            data-direction="end"
            onTouchStart={(e) => handleTouchStart(e, 'resize')}
          />
        </>
      )}

      {/* 片段内容 */}
      <div className="clip-content mobile">
        <span className="clip-icon mobile">{getClipIcon(clip.type)}</span>
        <span className="clip-name mobile">{clip.name}</span>
      </div>

      {/* 音频波形 */}
      {clip.type === 'audio' && clip.waveform && !isDragging && (
        <WaveformDisplay waveform={clip.waveform} width={width} />
      )}
    </div>
  );
};

// 音频波形显示组件
const WaveformDisplay = ({ waveform, width }) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
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

export default React.memo(Clip);