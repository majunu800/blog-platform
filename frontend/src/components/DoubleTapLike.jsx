import React, { useState } from 'react';
import { Heart } from 'lucide-react';

export default function DoubleTapLike({ children, onDoubleTap, liked }) {
  const [animate, setAnimate] = useState(false);

  const handleDoubleClick = (e) => {
    setAnimate(true);
    if (onDoubleTap) {
      onDoubleTap();
    }
    // Remove animation class after animation duration (800ms)
    setTimeout(() => {
      setAnimate(false);
    }, 800);
  };

  return (
    <div 
      className="post-media-container" 
      onDoubleClick={handleDoubleClick}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {children}
      <div className={`heart-pop ${animate ? 'animate' : ''}`}>
        <Heart size={96} fill="#f43f5e" stroke="none" />
      </div>
    </div>
  );
}
