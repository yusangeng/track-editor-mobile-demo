import React, { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from './Toolbar';
import Timeline from './Timeline';
import Track from './Track';
import Playhead from './Playhead';
import Clip from './Clip';
import { initialProjectData } from '../data/initialData';

import './Timeline.css';
import './Track.css';
import './Clip.css';
import './Playhead.css';
import './Toolbar.css';

const MOBILE_CLIP_MIN_WIDTH = 40;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;

const TrackEditor = ({ projectData = initialProjectData }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [tracks, setTracks] = useState(projectData.tracks);

  // 拖拽状态
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

  // 时间格式化
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // 时间到像素转换
  const timeToPixels = (time) => {
    return time * 30 * zoom; // 使用固定的时间缩放因子
  };

  // 像素到时间转换
  const pixelsToTime = (pixels) => {
    return pixels / (30 * zoom);
  };

  // 获取轨道顶部位置
  const getTrackTopPosition = (trackId) => {
    let top = 0;
    const rulerHeight = 30;

    for (const track of tracks) {
      if (track.id === trackId) {
        return rulerHeight + top;
      }
      top += track.height;
    }

    return rulerHeight + top;
  };

  // 获取触摸点所在的轨道
  const getTrackFromPosition = (y, containerRect) => {
    const relativeY = y - containerRect.top;
    const rulerHeight = 30;

    if (relativeY <= rulerHeight) {
      return null;
    }

    const trackAreaY = relativeY - rulerHeight;
    let currentY = 0;

    for (const track of tracks) {
      currentY += track.height;
      if (trackAreaY <= currentY) {
        return track.id;
      }
    }

    return tracks[tracks.length - 1].id;
  };

  // 播放控制
  const handlePlayPause = useCallback(() => {
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
            if (newTime >= projectData.metadata.duration) {
              setIsPlaying(false);
              return projectData.metadata.duration;
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
  }, [isPlaying, projectData.metadata.duration]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(MIN_ZOOM, prev / 1.2));
  }, []);

  // 时间标尺点击
  const handleRulerClick = useCallback((time) => {
    setCurrentTime(Math.max(0, Math.min(projectData.metadata.duration, time)));
  }, [projectData.metadata.duration]);

  // 轨道点击
  const handleTrackClick = useCallback((time) => {
    setCurrentTime(Math.max(0, Math.min(projectData.metadata.duration, time)));
  }, [projectData.metadata.duration]);

  // 片段拖拽开始
  const handleClipDragStart = useCallback((e, clip, trackId) => {
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
  }, []);

  // 片段调整大小开始
  const handleClipResizeStart = useCallback((e, clip, direction) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: 实现调整大小逻辑
    console.log('Resize start:', clip, direction);
  }, []);

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

    // 应用最终的轨道移动
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

  // 全局触摸事件监听
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

  const timelineWidth = timeToPixels(projectData.metadata.duration);

  return (
    <div className="track-editor mobile">
      {/* 工具栏 */}
      <Toolbar
        currentTime={currentTime}
        duration={projectData.metadata.duration}
        isPlaying={isPlaying}
        zoom={zoom}
        onPlayPause={handlePlayPause}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {/* 时间线容器 */}
      <div className="timeline-container mobile">
        {/* 时间标尺 */}
        <Timeline
          duration={projectData.metadata.duration}
          zoom={zoom}
          onTimeClick={handleRulerClick}
          className="timeline-ruler-wrapper"
        />

        {/* 轨道容器 */}
        <div
          ref={timelineRef}
          className="tracks-container mobile"
          style={{ width: `${timelineWidth}px` }}
        >
          {tracks.map(track => (
            <Track
              key={track.id}
              track={track}
              zoom={zoom}
              currentTime={currentTime}
              onClipDragStart={handleClipDragStart}
              onClipResizeStart={handleClipResizeStart}
              onTrackClick={handleTrackClick}
            />
          ))}

          {/* 播放指针 */}
          <Playhead
            currentTime={currentTime}
            duration={projectData.metadata.duration}
            zoom={zoom}
            isVisible={true}
          />

          {/* 拖拽预览 */}
          {dragState.isDragging && dragState.clip && (
            <Clip
              clip={dragState.clip}
              zoom={zoom}
              isPreview={true}
              className="drag-preview"
            />
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

export default TrackEditor;