import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, ExternalLink, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './ManageQuestions.module.css';

export default function ManageQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  async function fetchQuestions() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getQuestions({ page: pagination.page, limit: pagination.limit, search: searchTerm });
      const payload = data.data || data;
      setQuestions(payload.questions || []);
      setPagination((prev) => ({ ...prev, ...payload.pagination }));
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Could not load questions.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
  }, [pagination.page]);

  async function handleDelete(hash) {
    if (!window.confirm('Are you sure you want to delete this question? This cannot be undone.')) return;

    try {
      await adminService.deleteQuestion(hash);
      setQuestions((prev) => prev.filter((q) => q.questionHash !== hash));
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question.');
    }
  }

  const filtered = questions.filter((q) =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchQuestions();
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
        <h1 className={styles.pageTitle}>Manage Questions</h1>
        <p className={styles.pageSubtitle}>Review and moderate community questions.</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by title..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button type="button" className={styles.searchBtn} onClick={handleSearchSubmit}>Search</button>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}><p>Loading questions...</p></div>
      ) : (
        <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>No questions found.</td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id || q.questionHash}>
                    <td className={styles.titleCell}>{q.title}</td>
                    <td className={styles.authorCell}>{q.author}</td>
                    <td className={styles.dateCell}>
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          to={`/question/${q.questionHash}`}
                          className={styles.viewBtn}
                          title="View question"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(q.questionHash)}
                          title="Delete question"
                        >
                          <Trash2 size={14} />
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
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
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
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
