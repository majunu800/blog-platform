import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommentModal({ isOpen, onClose, postId, postAuthorId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, getAuthHeaders } = useAuth();

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${postId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/comments/${postId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: newComment })
      });
      const data = await res.json();
      if (res.ok) {
        setComments([...comments, data]);
        setNewComment('');
        if (onCommentAdded) {
          onCommentAdded(); // Refresh count/state in parent
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Comments</h3>
          <button className="action-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="comments-list">
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
              No comments yet. Be the first to start the conversation!
            </div>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = comment.author?._id === user?.id;
              const isPostAuthor = postAuthorId === user?.id;

              return (
                <div key={comment._id} className="comment-item">
                  <img 
                    src={comment.author?.avatar || 'https://api.dicebear.com/7.x/identicon/svg'} 
                    alt={comment.author?.username} 
                    className="comment-avatar"
                  />
                  <div className="comment-details">
                    <div>
                      <span className="comment-author">{comment.author?.username}</span>
                      <span>{comment.content}</span>
                    </div>
                    <div className="comment-meta">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {(isCommentAuthor || isPostAuthor) && (
                        <button 
                          className="delete-comment-btn" 
                          onClick={() => handleDelete(comment._id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="comment-input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="comment-submit-btn" 
            disabled={loading || !newComment.trim()}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
