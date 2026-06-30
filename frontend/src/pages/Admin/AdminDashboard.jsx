/**
 * AdminDashboard — top-level admin page showing platform statistics and quick-access
 * navigation cards to manage users and questions. Redirects non-admins to home.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Shield } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import StatsCards from '../../components/admin/StatsCards.jsx';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getStats();
      setStats(data.data || data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Could not load admin stats.');
    } finally {
      setIsLoading(false);
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className={styles.accessDenied}>
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className={styles.loadingState}><p>Loading stats...</p></div>;
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <button type="button" className={styles.retryBtn} onClick={fetchStats}>Try again</button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Admin Dashboard</h1>
        <p className={styles.pageSubtitle}>Overview of platform activity and management tools.</p>
      </div>

      <StatsCards stats={stats} />

      <div className={styles.actions}>
        <h3 className={styles.actionsTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button
            type="button"
            className={styles.actionCard}
            onClick={() => navigate('/admin/users')}
          >
            <Users size={24} className={styles.actionIcon} />
            <div>
              <h4 className={styles.actionLabel}>Manage Users</h4>
              <p className={styles.actionDesc}>View, ban, or unban users</p>
            </div>
          </button>
          <button
            type="button"
            className={styles.actionCard}
            onClick={() => navigate('/admin/questions')}
          >
            <MessageSquare size={24} className={styles.actionIcon} />
            <div>
              <h4 className={styles.actionLabel}>Manage Questions</h4>
              <p className={styles.actionDesc}>Review and moderate questions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
