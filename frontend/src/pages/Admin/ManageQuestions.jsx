import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, ExternalLink, Shield } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './ManageQuestions.module.css';

export default function ManageQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  async function fetchQuestions() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getUsers({ page: 1, limit: 1000 });
      const payload = data.data || data;
      setQuestions(payload.questions || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Could not load questions.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function handleDelete(hash) {
    if (!window.confirm('Are you sure you want to delete this question? This cannot be undone.')) return;

    try {
      await adminService.deleteQuestion(hash);
      setQuestions((prev) => prev.filter((q) => q.question_hash !== hash));
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question.');
    }
  }

  const filtered = questions.filter((q) =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className={styles.loadingState}><p>Loading questions...</p></div>
      ) : (
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
                  <tr key={q.question_id || q.question_hash}>
                    <td className={styles.titleCell}>{q.title}</td>
                    <td className={styles.authorCell}>{q.author?.firstName} {q.author?.lastName}</td>
                    <td className={styles.dateCell}>
                      {q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          to={`/question/${q.question_hash}`}
                          className={styles.viewBtn}
                          title="View question"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(q.question_hash)}
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
      )}
    </div>
  );
}
