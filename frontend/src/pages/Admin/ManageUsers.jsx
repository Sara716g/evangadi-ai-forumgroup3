/**
 * ManageUsers — admin page for listing, searching, banning, and role-toggling users.
 * Uses UserTable for display and delegates actions to adminService.
 */
import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import UserTable from '../../components/admin/UserTable.jsx';
import styles from './ManageUsers.module.css';

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  async function fetchUsers() {
    try {
      setError(null);
      const data = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      const payload = data.data || data;
      setUsers(payload.users || []);
      setPagination((prev) => ({ ...prev, ...payload.pagination }));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Could not load users.');
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search]);

  function handlePageChange(page) {
    setPagination((prev) => ({ ...prev, page }));
  }

  function handleSearch(term) {
    setSearch(term);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  async function handleStatusChange(userId, newStatus) {
    const action = newStatus === 'banned' ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error('Failed to update user status:', err);
      alert('Failed to update user status.');
    }
  }

  async function handleRoleChange(userId) {
    const targetUser = users.find((u) => u.id === userId);
    const action = targetUser?.role === 'admin' ? 'demote to regular user' : 'promote to admin';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      const result = await adminService.toggleUserRole(userId);
      const newRole = result.data?.role || result.role;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role.');
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

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Manage Users</h1>
        <p className={styles.pageSubtitle}>View and manage all registered users.</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <UserTable
        users={users}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onRoleChange={handleRoleChange}
      />
    </div>
  );
}
