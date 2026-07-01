import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StoryViewer({ isOpen, onClose, userStories }) {
  if (!isOpen || !userStories || !userStories.stories || userStories.stories.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);
  const timerTimeout = useRef(null);

  const stories = userStories.stories;
  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Reset state on story switch
    setProgress(0);
    clearInterval(progressInterval.current);
    clearTimeout(timerTimeout.current);

    // Setup smooth 5 second interval for progress bar updates (every 50ms we add 1% progress)
    const totalDuration = 5000; // 5 seconds
    const intervalStep = 50; // update progress every 50ms
    let elapsed = 0;

    progressInterval.current = setInterval(() => {
      elapsed += intervalStep;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);
    }, intervalStep);

    // After 5 seconds, move to next story
    timerTimeout.current = setTimeout(() => {
      handleNext();
    }, totalDuration);

    return () => {
      clearInterval(progressInterval.current);
      clearTimeout(timerTimeout.current);
    };
  }, [currentIndex, userStories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // End of stories
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-viewer-card" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars at the top */}
        <div className="story-progress-container">
          {stories.map((story, index) => {
            let barFill = 0;
            if (index < currentIndex) barFill = 100;
            else if (index === currentIndex) barFill = progress;

            return (
              <div key={story.id} className="story-progress-bar-bg">
                <div 
                  className="story-progress-bar-fill" 
                  style={{ width: `${barFill}%`, transition: index === currentIndex ? 'none' : 'width 0.1s linear' }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="story-header">
          <div className="story-header-user">
            <img 
              src={userStories.user?.avatar || 'https://api.dicebear.com/7.x/identicon/svg'} 
              alt={userStories.user?.username} 
            />
            <span className="story-header-name">{userStories.user?.username}</span>
          </div>
          <button className="story-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Story Content */}
        <div style={{ flexGrow: 1, position: 'relative' }}>
          {currentStory.mediaType === 'video' ? (
            <video 
              src={currentStory.mediaUrl} 
              className="story-media" 
              autoPlay 
              muted 
              playsInline 
            />
          ) : (
            <img 
              src={currentStory.mediaUrl} 
              alt="Story" 
              className="story-media" 
            />
          )}

          {/* Navigation Controls */}
          {currentIndex > 0 && (
            <button className="story-nav-btn prev" onClick={handlePrev}>
              <ChevronLeft size={24} />
            </button>
          )}

          <button className="story-nav-btn next" onClick={handleNext}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
