import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import StoryViewer from '../components/StoryViewer';
import DoubleTapLike from '../components/DoubleTapLike';
import CommentModal from '../components/CommentModal';

export default function Home() {
  const { user, getAuthHeaders } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedType, setFeedType] = useState('explore'); // 'following' or 'explore'
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modals state
  const [selectedStories, setSelectedStories] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [bouncingLikeId, setBouncingLikeId] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const url = feedType === 'following' 
        ? 'http://localhost:5000/api/posts?feed=following' 
        : 'http://localhost:5000/api/posts';

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setPosts(data.filter(p => p.type === 'post'));
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stories', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setStories(data);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  };

  const handleLike = async (postId, postAuthorName) => {
    // Trigger bounce animation locally
    setBouncingLikeId(postId);
    setTimeout(() => setBouncingLikeId(null), 400);

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        const isNowLiked = data.includes(user?.id);
        if (isNowLiked) {
          showToast(`Liked ${postAuthorName}'s post!`);
        }
        setPosts(posts.map(p => p._id === postId ? { ...p, likes: data } : p));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/posts`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        const filtered = data.filter(p => 
          p.type === 'post' && 
          p.caption.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setPosts(filtered);
      }
    } catch (err) {
      console.error('Error searching posts:', err);
    }
  };

  return (
    <div className="feed-container page-fade-in">
      {/* Search Header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1, display: 'flex', position: 'relative' }}>
          <input
            type="text"
            className="comment-input"
            style={{ width: '100%', paddingLeft: '40px' }}
            placeholder="Search posts by caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        </form>

        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2px' }}>
          <button 
            className={`content-type-tab ${feedType === 'explore' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '18px' }}
            onClick={() => setFeedType('explore')}
          >
            Explore
          </button>
          <button 
            className={`content-type-tab ${feedType === 'following' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '18px' }}
            onClick={() => setFeedType('following')}
          >
            Feed
          </button>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="stories-wrapper">
        {/* Add story button */}
        <div className="story-circle" onClick={() => navigate('/create')}>
          <div className="avatar-ring viewed" style={{ background: 'var(--border-color)' }}>
            <img src={user?.avatar || 'https://api.dicebear.com/7.x/identicon/svg'} alt="You" />
          </div>
          <span className="story-username">Add Story</span>
        </div>

        {/* User Stories with rotating glowing gradient rings */}
        {stories.map((storyGroup) => (
          <div 
            key={storyGroup.user?._id} 
            className="story-circle"
            onClick={() => setSelectedStories(storyGroup)}
          >
            <div className="avatar-ring animating">
              <img src={storyGroup.user?.avatar} alt={storyGroup.user?.username} />
            </div>
            <span className="story-username">{storyGroup.user?.username}</span>
          </div>
        ))}
      </div>

      {/* Feed Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loadingPosts ? (
          // Shimmer loading card skeletons
          Array(2).fill(0).map((_, idx) => (
            <div key={idx} className="post-card" style={{ pointerEvents: 'none' }}>
              <div className="post-header" style={{ gap: '10px' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
              </div>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1' }} />
              <div className="post-info" style={{ gap: '10px', paddingTop: '14px' }}>
                <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '100%', height: '12px', borderRadius: '4px' }} />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
            No posts found. Share your first post or follow other users!
          </div>
        ) : (
          posts.map((post) => {
            const isLiked = post.likes?.includes(user?.id);

            return (
              <div key={post._id} className="post-card">
                {/* Header */}
                <div className="post-header">
                  <div className="post-author" onClick={() => navigate(`/profile/${post.author?._id}`)}>
                    <img src={post.author?.avatar} alt={post.author?.username} />
                    <span className="post-author-name">{post.author?.username}</span>
                  </div>
                  <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Media with Double Tap Heart effect */}
                <DoubleTapLike 
                  liked={isLiked} 
                  onDoubleTap={() => {
                    if (!isLiked) handleLike(post._id, post.author?.username);
                  }}
                >
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls muted playsInline />
                  ) : (
                    <img src={post.mediaUrl} alt="Post media" />
                  )}
                </DoubleTapLike>

                {/* Actions */}
                <div className="post-actions">
                  <div className="post-action-buttons">
                    <button 
                      className={`action-btn ${isLiked ? 'liked' : ''} ${bouncingLikeId === post._id ? 'heart-bounce' : ''}`}
                      onClick={() => handleLike(post._id, post.author?.username)}
                    >
                      <Heart size={24} className={isLiked ? 'heart-bounce' : ''} />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => setActiveCommentPost(post)}
                    >
                      <MessageCircle size={24} />
                    </button>
                  </div>
                  <button className="action-btn" onClick={() => navigate('/messages', { state: { startChatWith: post.author } })}>
                    <Send size={20} />
                  </button>
                </div>

                {/* Post Metadata info */}
                <div className="post-info">
                  <span className="likes-count">{post.likes?.length || 0} likes</span>
                  <div className="post-caption">
                    <span 
                      className="caption-username" 
                      onClick={() => navigate(`/profile/${post.author?._id}`)}
                    >
                      {post.author?.username}
                    </span>
                    {post.caption}
                  </div>
                  <button 
                    className="view-comments-btn"
                    onClick={() => setActiveCommentPost(post)}
                  >
                    View comments...
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Story Slideshow Overlay */}
      {selectedStories && (
        <StoryViewer 
          isOpen={!!selectedStories} 
          onClose={() => setSelectedStories(null)} 
          userStories={selectedStories} 
        />
      )}

      {/* Comments overlay modal */}
      {activeCommentPost && (
        <CommentModal
          isOpen={!!activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          postId={activeCommentPost._id}
          postAuthorId={activeCommentPost.author?._id}
          onCommentAdded={fetchPosts}
        />
      )}
    </div>
  );
}
