import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import DoubleTapLike from '../components/DoubleTapLike';
import CommentModal from '../components/CommentModal';

export default function Reels() {
  const { user, getAuthHeaders } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [reels, setReels] = useState([]);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/posts?type=reel', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setReels(data);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId, reelAuthorName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${reelId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        const isNowLiked = data.includes(user?.id);
        if (isNowLiked) {
          showToast(`Liked ${reelAuthorName}'s reel!`);
        }
        setReels(reels.map(r => r._id === reelId ? { ...r, likes: data } : r));
      }
    } catch (err) {
      console.error('Error liking reel:', err);
    }
  };

  return (
    <div className="page-fade-in" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      {loading ? (
        // Premium Reels Shimmer
        <div className="reels-wrapper-page" style={{ pointerEvents: 'none' }}>
          <div className="reel-card skeleton" />
        </div>
      ) : reels.length === 0 ? (
        <div 
          className="feed-container" 
          style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: 'var(--text-muted)', 
            border: '1px dashed var(--border-color)', 
            borderRadius: '12px', 
            backgroundColor: 'var(--bg-secondary)',
            height: 'fit-content'
          }}
        >
          No reels shared yet. Be the first to create an amazing vertical reel!
          <button 
            className="btn-primary" 
            style={{ marginTop: '20px', width: '100%' }}
            onClick={() => navigate('/create')}
          >
            Create Reel
          </button>
        </div>
      ) : (
        <div className="reels-wrapper-page">
          {reels.map((reel) => {
            const isLiked = reel.likes?.includes(user?.id);

            return (
              <div key={reel._id} className="reel-card">
                <DoubleTapLike 
                  liked={isLiked} 
                  onDoubleTap={() => {
                    if (!isLiked) handleLike(reel._id, reel.author?.username);
                  }}
                >
                  {reel.mediaType === 'video' ? (
                    <video 
                      src={reel.mediaUrl} 
                      className="reel-video" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                    />
                  ) : (
                    <img 
                      src={reel.mediaUrl} 
                      className="reel-video" 
                      alt="Reel content" 
                    />
                  )}
                </DoubleTapLike>

                {/* Info Overlay */}
                <div className="reel-overlay">
                  <div className="reel-meta-info">
                    <div className="reel-author" onClick={() => navigate(`/profile/${reel.author?._id}`)}>
                      <img src={reel.author?.avatar} alt={reel.author?.username} />
                      <span className="reel-author-name">{reel.author?.username}</span>
                    </div>
                    <p className="reel-caption">{reel.caption}</p>
                    <div className="reels-music">
                      <Music size={14} />
                      <span>Original Audio • {reel.author?.username}</span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="reel-actions">
                    <div className="reel-action-item" onClick={() => handleLike(reel._id, reel.author?.username)}>
                      <div className={`reel-action-circle ${isLiked ? 'liked' : ''}`}>
                        <Heart size={22} className={isLiked ? 'heart-bounce' : ''} />
                      </div>
                      <span>{reel.likes?.length || 0}</span>
                    </div>

                    <div className="reel-action-item" onClick={() => setActiveCommentPost(reel)}>
                      <div className="reel-action-circle">
                        <MessageCircle size={22} />
                      </div>
                      <span>Comments</span>
                    </div>

                    <div className="reel-action-item" onClick={() => navigate('/messages', { state: { startChatWith: reel.author } })}>
                      <div className="reel-action-circle">
                        <Send size={20} />
                      </div>
                      <span>Share</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reel Comment Drawer Overlay */}
      {activeCommentPost && (
        <CommentModal
          isOpen={!!activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          postId={activeCommentPost._id}
          postAuthorId={activeCommentPost.author?._id}
        />
      )}
    </div>
  );
}
