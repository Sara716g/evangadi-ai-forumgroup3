/**
 * ExternalSearch — community search page that queries external forum sources
 * (Stack Overflow / Discourse) and displays results as clickable cards.
 * Minimum 3-character query enforced client-side.
 */
import React, { useState } from 'react';
import { externalForumSearch } from '../../services/community/community.service';
import styles from './ExternalSearch.module.css';

const ExternalSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (searchTerm.trim().length < 3) {
      setErrorMessage('Please type a search query containing at least 3 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await externalForumSearch(searchTerm.trim());
      setResults(data);
    } catch (err) {
      setErrorMessage(typeof err === 'string' ? err : 'Failed to retrieve external forum topics.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Community Search</h1>
        <p>Instantly search across millions of technical troubleshooting guides globally.</p>
      </header>

      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Search errors, hooks, code fragments... (e.g., react hooks)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            disabled={isLoading}
          />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}

      {isLoading ? (
        <div className={styles.spinnerContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Scanning global technical repositories...</p>
        </div>
      ) : (
        <div className={styles.resultsGrid}>
          {results.map((item, index) => (
            <div key={item.externalId || index} className={styles.card}>
              <div className={styles.cardHeader}>
                <a href={item.url || item.link} target="_blank" rel="noopener noreferrer" className={styles.cardTitle}>
                  <span dangerouslySetInnerHTML={{ __html: item.title }} />
                </a>
                <span className={`${styles.badge} ${item.isAnswered ? styles.answered : styles.unanswered}`}>
                  {item.isAnswered ? '✓ Answered' : 'Open'}
                </span>
              </div>

              <p className={styles.excerpt}>{item.excerpt}</p>

              <div className={styles.tagsContainer}>
                {item.tags.map(tag => (
                  <span key={tag} className={styles.tagSpec}>{tag}</span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.metaMetric}>Answers: <strong>{item.answerCount}</strong></span>
                <span className={styles.metaMetric}>Score: <strong>{item.score}</strong></span>
                <span className={styles.metaDate}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}

          {!isLoading && results.length === 0 && searchTerm && !errorMessage && (
            <div className={styles.emptyState}>No matching public articles located. Try clarifying your input terms.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExternalSearch;