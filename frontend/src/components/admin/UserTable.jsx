import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Ban, CheckCircle, Shield, ShieldOff } from 'lucide-react';
import styles from './UserTable.module.css';

export default function UserTable({ users, pagination, onPageChange, onSearch, onStatusChange, onRoleChange }) {
  const [searchInput, setSearchInput] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    onSearch(searchInput);
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Questions</th>
              <th>Answers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className={styles.nameCell}>{user.firstName} {user.lastName}</td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td>
                    <span className={`${styles.badge} ${user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      user.status === 'active' ? styles.badgeActive :
                      user.status === 'banned' ? styles.badgeBanned :
                      styles.badgeSuspended
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className={styles.numCell}>{user.questionCount}</td>
                  <td className={styles.numCell}>{user.answerCount}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${user.status === 'banned' ? styles.unbanBtn : styles.banBtn}`}
                        onClick={() => onStatusChange(user.id, user.status === 'banned' ? 'active' : 'banned')}
                        title={user.status === 'banned' ? 'Unban user' : 'Ban user'}
                      >
                        {user.status === 'banned' ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${user.role === 'admin' ? styles.demoteBtn : styles.promoteBtn}`}
                        onClick={() => onRoleChange(user.id)}
                        title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                      >
                        {user.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
