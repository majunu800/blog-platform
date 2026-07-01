import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80'
];

const MOCK_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-1527-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-countryside-meadow-under-a-stormy-sky-24488-large.mp4'
];

export default function CreateContent() {
  const [contentType, setContentType] = useState('post'); // 'post', 'reel', 'story'
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image', 'video'
  const [caption, setCaption] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { getAuthHeaders } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleGenerateMockMedia = () => {
    if (mediaType === 'image') {
      const randomImg = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
      setMediaUrl(randomImg);
    } else {
      const randomVid = MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)];
      setMediaUrl(randomVid);
    }
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setMediaUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      setError('Media URL is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (contentType === 'story') {
        const res = await fetch('http://localhost:5000/api/stories', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ mediaUrl, mediaType })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Failed to share story');
        showToast('Story shared successfully!');
        navigate('/');
      } else {
        const res = await fetch('http://localhost:5000/api/posts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type: contentType,
            mediaUrl,
            mediaType,
            caption
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Failed to share content');
        
        showToast(`${contentType === 'reel' ? 'Reel' : 'Post'} shared successfully!`);
        if (contentType === 'reel') {
          navigate('/reels');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-content-container page-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Create New Content</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Share photos, videos or stories with your followers.</p>
      </div>

      {/* Tabs */}
      <div className="content-type-selector">
        <button 
          className={`content-type-tab ${contentType === 'post' ? 'active' : ''}`}
          onClick={() => { setContentType('post'); setMediaType('image'); setMediaUrl(''); }}
        >
          Post
        </button>
        <button 
          className={`content-type-tab ${contentType === 'reel' ? 'active' : ''}`}
          onClick={() => { setContentType('reel'); setMediaType('video'); setMediaUrl(''); }}
        >
          Reel
        </button>
        <button 
          className={`content-type-tab ${contentType === 'story' ? 'active' : ''}`}
          onClick={() => { setContentType('story'); setMediaType('image'); setMediaUrl(''); }}
        >
          Story
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="create-form-card" onSubmit={handleSubmit}>
        {contentType !== 'reel' && (
          <div className="form-group">
            <label>Media Format</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button 
                type="button" 
                className={`btn-secondary ${mediaType === 'image' ? 'active' : ''}`}
                style={{ flexGrow: 1, backgroundColor: mediaType === 'image' ? 'var(--border-color)' : '' }}
                onClick={() => handleMediaTypeChange('image')}
              >
                Photo
              </button>
              <button 
                type="button" 
                className={`btn-secondary ${mediaType === 'video' ? 'active' : ''}`}
                style={{ flexGrow: 1, backgroundColor: mediaType === 'video' ? 'var(--border-color)' : '' }}
                onClick={() => handleMediaTypeChange('video')}
              >
                Video
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <div style={{ display: 'flex', justifycontent: 'space-between', alignitems: 'center' }}>
            <label htmlFor="mediaUrl">Media Link / URL</label>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={handleGenerateMockMedia}
            >
              Generate Mock Media
            </button>
          </div>
          <input
            type="text"
            id="mediaUrl"
            className="form-input"
            placeholder={mediaType === 'image' ? 'https://example.com/photo.jpg' : 'https://example.com/video.mp4'}
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            required
          />
        </div>

        {mediaUrl.trim() && (
          <div className="form-group">
            <label>Live Preview</label>
            <div className="image-preview-box" style={{ marginTop: '6px' }}>
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls muted playsInline />
              ) : (
                <img src={mediaUrl} alt="Preview" />
              )}
            </div>
          </div>
        )}

        {contentType !== 'story' && (
          <div className="form-group">
            <label htmlFor="caption">Caption</label>
            <textarea
              id="caption"
              className="form-input"
              rows="3"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
        )}

        <button type="submit" className="auth-submit-btn" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Sharing...' : 'Share now'}
        </button>
      </form>
    </div>
  );
}
