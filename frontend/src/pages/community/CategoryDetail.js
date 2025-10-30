import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/pages/Forums.css';

function CategoryDetail() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategory();
    fetchThreads();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      // Mock category data based on ID
      const categories = {
        '507f1f77bcf86cd799439011': {
          _id: '507f1f77bcf86cd799439011',
          name: 'General Discussion',
          description: 'General mentorship topics and discussions',
          threadCount: 5
        },
        '507f1f77bcf86cd799439012': {
          _id: '507f1f77bcf86cd799439012',
          name: 'Technical Skills',
          description: 'Programming, technology, and technical skill development',
          threadCount: 8
        },
        '507f1f77bcf86cd799439013': {
          _id: '507f1f77bcf86cd799439013',
          name: 'Career Advice',
          description: 'Career guidance, job hunting, and professional development',
          threadCount: 12
        }
      };
      
      setCategory(categories[categoryId] || {
        _id: categoryId,
        name: 'Unknown Category',
        description: 'Category not found',
        threadCount: 0
      });
    } catch (error) {
      console.error('Failed to fetch category', error);
    }
  };

  const fetchThreads = async () => {
    try {
      // Mock threads for this category
      const mockThreads = [
        {
          _id: '507f1f77bcf86cd799439021',
          title: 'How to find the right mentor?',
          author: {
            _id: '507f1f77bcf86cd799439031',
            name: 'John Doe',
            role: 'Mentee'
          },
          replyCount: 5,
          viewCount: 24,
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          _id: '507f1f77bcf86cd799439022',
          title: 'Best practices for mentorship sessions',
          author: {
            _id: '507f1f77bcf86cd799439032',
            name: 'Jane Smith',
            role: 'Mentor'
          },
          replyCount: 8,
          viewCount: 42,
          createdAt: new Date(Date.now() - 172800000)
        },
        {
          _id: '507f1f77bcf86cd799439023',
          title: 'Setting effective goals with your mentor',
          author: {
            _id: '507f1f77bcf86cd799439033',
            name: 'Mike Johnson',
            role: 'Mentee'
          },
          replyCount: 3,
          viewCount: 18,
          createdAt: new Date(Date.now() - 259200000)
        }
      ];
      
      setThreads(mockThreads);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch threads', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page category-detail-page">
      <div className="page-header">
        <Link to="/community" className="btn btn-secondary">← Back to Forums</Link>
        <div>
          <h1>{category?.name}</h1>
          <p className="category-description">{category?.description}</p>
        </div>
      </div>

      <div className="category-detail">
        <div className="card">
          <div className="card-header">
            <h3>Threads in {category?.name} ({threads.length})</h3>
          </div>
          <div className="card-body">
            {threads.length === 0 ? (
              <div className="empty-state">
                <p>No threads in this category yet.</p>
                <p>Be the first to start a discussion!</p>
              </div>
            ) : (
              <div className="threads-list">
                {threads.map(thread => (
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
                ))}
              </div>
            )}
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

export default CategoryDetail;