import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CommentModal from '../components/CommentModal';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, getAuthHeaders } = useAuth();
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Selected post for comments modal
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/user/${id}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setProfileUser(data.user);
        setPosts(data.posts);
        setFollowersCount(data.user.followers?.length || 0);
        
        const isFollowed = data.user.followers?.some(
          follower => follower._id === currentUser?.id || follower === currentUser?.id
        );
        setIsFollowing(!!isFollowed);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/user/${id}/follow`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        showToast(data.isFollowing ? `You followed ${profileUser.username}!` : `You unfollowed ${profileUser.username}.`);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleMessageRedirect = () => {
    if (profileUser) {
      navigate('/messages', { state: { startChatWith: profileUser } });
    }
  };

  if (loading) {
    return (
      <div className="profile-container page-fade-in" style={{ pointerEvents: 'none' }}>
        <div className="profile-header" style={{ gap: '80px' }}>
          <div className="skeleton" style={{ width: '150px', height: '150px', borderRadius: '50%' }} />
          <div className="profile-info" style={{ gap: '20px' }}>
            <div className="skeleton" style={{ width: '200px', height: '24px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '280px', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '180px', height: '16px', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="profile-tabs-divider" style={{ margin: '30px 0' }} />
        <div className="profile-grid">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="grid-item skeleton" style={{ aspectRatio: '1/1', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        User not found.
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  return (
    <div className="profile-container page-fade-in">
      {/* Header Info */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img 
            src={profileUser.avatar || 'https://api.dicebear.com/7.x/identicon/svg'} 
            className="profile-avatar" 
            alt={profileUser.username} 
          />
        </div>

        <div className="profile-info">
          <div className="profile-username-row">
            <h2 className="profile-username">{profileUser.username}</h2>
            {isOwnProfile ? (
              <button className="btn-secondary" onClick={() => navigate('/create')}>Create Post</button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="btn-secondary" onClick={handleMessageRedirect}>
                  Message
                </button>
              </div>
            )}
          </div>

          <ul className="profile-stats">
            <li><span>{posts.length}</span> posts</li>
            <li><span>{followersCount}</span> followers</li>
            <li><span>{profileUser.following?.length || 0}</span> following</li>
          </ul>

          <div className="profile-bio">
            <div className="profile-bio-name">{profileUser.username}</div>
            <p>{profileUser.bio || 'No bio yet.'}</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs-divider" />

      {/* Grid List */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          No posts shared yet.
        </div>
      ) : (
        <div className="profile-grid">
          {posts.map((post) => (
            <div 
              key={post._id} 
              className="grid-item"
              onClick={() => setSelectedPost(post)}
            >
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} muted playsInline />
              ) : (
                <img src={post.mediaUrl} alt="Post content" />
              )}
              
              {/* Overlay with stats on hover */}
              <div className="grid-item-overlay">
                <div className="grid-overlay-stat">
                  <Heart size={20} fill="#fff" />
                  <span>{post.likes?.length || 0}</span>
                </div>
                <div className="grid-overlay-stat">
                  <MessageCircle size={20} fill="#fff" />
                  <span>View</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal view when post is clicked */}
      {selectedPost && (
        <CommentModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          postId={selectedPost._id}
          postAuthorId={selectedPost.author}
          onCommentAdded={fetchProfile} // Refresh profile post comments
        />
      )}
    </div>
  );
}
