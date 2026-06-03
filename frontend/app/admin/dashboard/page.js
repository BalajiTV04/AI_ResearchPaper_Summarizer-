'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './dashboard.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    checkAuth();
  }, []);

  function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }

  async function loadData() {
    try {
      const token = localStorage.getItem('adminToken');
      // Set the admin token for API calls
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersData, statsData] = await Promise.all([
        api.get('/admin/users', { headers }),
        api.get('/admin/dashboard', { headers })
      ]);
      
      setUsers(usersData.users || []);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>🔐 Admin Dashboard</h1>
          <p className={styles.subtitle}>Manage users and monitor platform activity</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshBtn}
            onClick={loadData}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total_users}</span>
              <span className={styles.statLabel}>Total Users</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📄</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total_papers}</span>
              <span className={styles.statLabel}>Total Papers</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>❓</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total_quizzes}</span>
              <span className={styles.statLabel}>Quizzes Taken</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total_ppts}</span>
              <span className={styles.statLabel}>PPTs Generated</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💬</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.chat_sessions}</span>
              <span className={styles.statLabel}>Chat Sessions</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.users_with_quizzes}</span>
              <span className={styles.statLabel}>Users with Quizzes</span>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      <div className={styles.sectionHeader}>
        <h2>📋 Registered Users ({users.length})</h2>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No users found matching your search.</p>
        </div>
      ) : (
        <div className={styles.usersList}>
          {filteredUsers.map(user => (
            <div 
              key={user.id} 
              className={`${styles.userCard} ${expandedUser === user.id ? styles.expanded : ''}`}
            >
              <div 
                className={styles.userCardHeader}
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={styles.userName}>{user.name}</h3>
                    <p className={styles.userEmail}>{user.email}</p>
                  </div>
                </div>
                <div className={styles.userMeta}>
                  <span className={styles.userStat}>
                    📄 {user.total_papers} papers
                  </span>
                  <span className={`${styles.usageBadge} ${user.chat_used ? styles.used : styles.notUsed}`}>
                    🤖 {user.chat_used ? 'Chat Used' : 'No Chat'}
                  </span>
                  <span className={`${styles.usageBadge} ${user.quiz_used ? styles.used : styles.notUsed}`}>
                    ❓ {user.quiz_used ? 'Quiz Taken' : 'No Quiz'}
                  </span>
                  <span className={`${styles.usageBadge} ${user.ppt_used ? styles.used : styles.notUsed}`}>
                    📊 {user.ppt_used ? 'PPT Used' : 'No PPT'}
                  </span>
                  <span className={styles.expandIcon}>
                    {expandedUser === user.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedUser === user.id && (
                <div className={styles.userDetails}>
                  {/* Papers */}
                  <div className={styles.detailSection}>
                    <h4>📄 Papers</h4>
                    {user.papers.length === 0 ? (
                      <p className={styles.noData}>No papers uploaded</p>
                    ) : (
                      <div className={styles.papersList}>
                        {user.papers.map(paper => (
                          <div key={paper.id} className={styles.paperItem}>
                            <span className={styles.paperTitle}>{paper.title}</span>
                            <span className={styles.paperMeta}>
                              {paper.page_count} pages • {new Date(paper.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quiz Scores */}
                  <div className={styles.detailSection}>
                    <h4>❓ Quiz Scores</h4>
                    {Object.keys(user.quiz_scores).length === 0 ? (
                      <p className={styles.noData}>No quizzes taken</p>
                    ) : (
                      <div className={styles.quizGrid}>
                        {Object.entries(user.quiz_scores).map(([diff, data]) => (
                          <div key={diff} className={styles.quizItem}>
                            <span className={styles.quizDiff}>{diff}</span>
                            <span className={styles.quizScore}>
                              {data.total} questions
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feature Usage */}
                  <div className={styles.detailSection}>
                    <h4>📊 Feature Usage</h4>
                    <div className={styles.featureGrid}>
                      <div className={`${styles.featureItem} ${user.chat_used ? styles.active : ''}`}>
                        <span>🤖 AI Chat Bot</span>
                        <span>{user.chat_used ? '✅ Used' : '❌ Not Used'}</span>
                      </div>
                      <div className={`${styles.featureItem} ${user.quiz_used ? styles.active : ''}`}>
                        <span>❓ Quiz</span>
                        <span>{user.quiz_used ? '✅ Used' : '❌ Not Used'}</span>
                      </div>
                      <div className={`${styles.featureItem} ${user.ppt_used ? styles.active : ''}`}>
                        <span>📊 PPT</span>
                        <span>{user.ppt_used ? '✅ Used' : '❌ Not Used'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}