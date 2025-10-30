import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pages/Forums.css';

function ThreadDetail() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchThread();
    fetchReplies();
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const response = await api.get(`/forums/threads/${threadId}`);
      setThread(response.data.data.thread);
    } catch (error) {
      console.error('Failed to fetch thread', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await api.get(`/forums/threads/${threadId}/replies`);
      setReplies(response.data.data.replies || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch replies', error);
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/forums/threads/${threadId}/replies`, {
        content: newReply
      });
      
      const newReplyData = response.data.data.reply;
      setReplies(prev => [...prev, newReplyData]);
      setNewReply('');
      
      // Update thread reply count if we have thread data
      if (thread) {
        setThread(prev => ({ 
          ...prev, 
          replyCount: (prev.replyCount || 0) + 1 
        }));
      }
    } catch (error) {
      console.error('Failed to submit reply', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!thread) {
    return (
      <div className="page">
        <div className="page-header">
          <Link to="/community" className="btn btn-secondary">← Back to Forums</Link>
        </div>
        <div className="card">
          <div className="card-body">
            <p>Thread not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page thread-detail-page">
      <div className="page-header">
        <Link to="/community" className="btn btn-secondary">← Back to Forums</Link>
        <h1>{thread.title}</h1>
      </div>

      <div className="thread-detail">
        <div className="thread-post card">
          <div className="card-header">
            <div className="post-author">
              <strong>{thread.author.name}</strong>
              <RoleBadge role={thread.author.role} />
              <span className="post-date">{new Date(thread.createdAt).toLocaleDateString()}</span>
            </div>
            {thread.category && (
              <div className="thread-category">
                <Link to={`/forums/category/${thread.category._id}`}>
                  {thread.category.name}
                </Link>
              </div>
            )}
          </div>
          <div className="card-body">
            <div className="post-content">{thread.content}</div>
          </div>
        </div>

        <div className="thread-replies">
          <h3>Replies ({replies.length})</h3>
          
          {replies.map(reply => (
            <div key={reply._id} className="reply-post card">
              <div className="card-header">
                <div className="post-author">
                  <strong>{reply.author.name}</strong>
                  <RoleBadge role={reply.author.role} />
                  <span className="post-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="card-body">
                <div className="post-content">{reply.content}</div>
              </div>
            </div>
          ))}

          <div className="reply-form card">
            <div className="card-header">
              <h4>Add a Reply</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmitReply}>
                <div className="form-group">
                  <textarea
                    className="form-textarea"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    rows="4"
                    placeholder="Write your reply..."
                    required
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submitting || !newReply.trim()}
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  if (!role) return null;
  
  const getBadgeClass = (role) => {
    switch (role) {
      case 'Mentor': return 'role-badge role-mentor';
      case 'Mentee': return 'role-badge role-mentee';
      case 'Admin': return 'role-badge role-admin';
      default: return 'role-badge';
    }
  };

  return <span className={getBadgeClass(role)}>{role}</span>;
}

export default ThreadDetail;