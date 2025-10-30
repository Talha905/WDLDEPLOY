import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pages/Forums.css';

function Forums() {
  const [categories, setCategories] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateThread, setShowCreateThread] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchThreads();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/forums/categories');
      setCategories(res.data.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch forum categories', error);
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await api.get('/forums/threads?limit=20');
      setThreads(res.data.data.threads || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch forum threads', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page forums-page">
      <div className="page-header">
        <h1>Community Forums</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateThread(!showCreateThread)}
        >
          {showCreateThread ? 'Cancel' : 'New Thread'}
        </button>
      </div>

      {showCreateThread && (
        <CreateThreadForm
          onSubmit={() => {
            setShowCreateThread(false);
            fetchThreads();
          }}
          onCancel={() => setShowCreateThread(false)}
        />
      )}

      <div className="forums-layout">
        <div className="forum-categories">
          <div className="card">
            <div className="card-header">
              <h3>Categories</h3>
            </div>
            <div className="card-body">
              {categories.length === 0 ? (
                <p>No categories available</p>
              ) : (
                categories.map(category => (
                  <div key={category._id} className="category-item">
                    <Link to={`/forums/category/${category._id}`}>
                      <h4>{category.name}</h4>
                      <p>{category.description}</p>
                      <span className="thread-count">{category.threadCount || 0} threads</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="forum-threads">
          <div className="card">
            <div className="card-header">
              <h3>Recent Threads</h3>
            </div>
            <div className="card-body">
              {threads.length === 0 ? (
                <p>No threads yet. Be the first to start a discussion!</p>
              ) : (
                threads.map(thread => (
                  <div key={thread._id} className="thread-item">
                    <div className="thread-info">
                      <Link to={`/forums/thread/${thread._id}`}>
                        <h4>{thread.title}</h4>
                      </Link>
                      <div className="thread-meta">
                        <div className="author-info">
                          <span className="author-name">{thread.author?.name}</span>
                          <RoleBadge role={thread.author?.role} />
                        </div>
                        <span className="thread-date">{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="thread-stats">
                      <span className="replies">{thread.replyCount || 0} replies</span>
                      <span className="views">{thread.viewCount || 0} views</span>
                    </div>
                  </div>
                ))
              )}
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

function CreateThreadForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/forums/categories');
        setCategories(res.data.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/forums/threads', formData);
      onSubmit();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card create-thread-form">
      <div className="card-header">
        <h3>Create New Thread</h3>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">-- Select a category --</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="form-textarea"
            rows="6"
            placeholder="Start your discussion..."
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Thread'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Forums;