import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, Sparkles, Bell, ChevronRight, MessageSquare, Bookmark, FileText, BarChart3 } from 'lucide-react';
import styles from './Navbar.module.css';

/**
 * Top bar: page title, debounced text search → `/dashboard?q=…`, optional AI semantic search.
 * Search state is driven by the URL on the dashboard so bookmarks and refresh keep context.
 */
export default function Navbar({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize searchTerm from URL if we are already on the dashboard
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || params.get('semantic') || '';
  });

  // Keep input in sync with URL if it changes externally
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get('q') || params.get('semantic') || '');
    } else {
      setSearchTerm('');
    }
  }, [location.search, location.pathname]);

  // Debounced keyword search: updates `?q=` on the dashboard (500ms quiet period).
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
      } else if (
        location.pathname === '/dashboard' &&
        !new URLSearchParams(location.search).get('semantic')
      ) {
        navigate('/dashboard');
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, navigate, location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSemanticSearch = e => {
    e.preventDefault();
    if (searchTerm.trim().length >= 3) {
      navigate(`/dashboard?semantic=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleDropdownNavigate = (path) => {
    setShowDropdown(false);
    navigate(path);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__titleBlock}>
        <h2 className={styles.navbar__pageTitle}>{title}</h2>
        {subtitle ? (
          <p className={styles.navbar__pageSubtitle}>{subtitle}</p>
        ) : null}
      </div>

      <form className={styles.navbar__search} onSubmit={handleSearchSubmit}>
        <div className={styles['navbar__search-icon']}>
          <Search size={16} />
        </div>
        <input
          id='search'
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder='Search questions by keyword...'
          className={styles['navbar__search-input']}
          aria-label='Search questions by keyword'
          style={{ paddingRight: searchTerm.length >= 3 ? '7.5rem' : '1.25rem' }}
        />
        {searchTerm.length >= 3 && (
          <button
            type='button'
            onClick={handleSemanticSearch}
            className={styles['navbar__semantic-button']}
            title='Use AI Semantic Search'
          >
            <Sparkles size={14} />
            <span className={styles['navbar__semantic-text']}>AI Search</span>
          </button>
        )}
      </form>

      <div className={styles.navbar__actions}>
        {user && (
          <button
            type='button'
            className={styles.navbar__iconBtn}
            onClick={() => navigate('/notifications')}
            aria-label='Notifications'
            title='Notifications'
          >
            <Bell size={18} />
          </button>
        )}
        {user && (
          <div className={styles.navbar__userWrapper} ref={dropdownRef}>
            <div
              className={styles.navbar__user}
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles['navbar__user-name']}>
                {user.firstName} {user.lastName}
              </span>
              <div className={styles['navbar__user-avatar']}>
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${
                      user?.firstName || 'User'
                    }+${user?.lastName || ''}&background=random`
                  }
                  alt='avatar'
                  referrerPolicy='no-referrer'
                />
              </div>
            </div>

            {showDropdown && (
              <div className={styles.navbar__dropdown}>
                <div
                  className={styles.navbar__dropdownHeader}
                  onClick={() => handleDropdownNavigate('/profile')}
                >
                  <div className={styles.navbar__dropdownAvatar}>
                    <img
                      src={
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${
                          user?.firstName || 'User'
                        }+${user?.lastName || ''}&background=random`
                      }
                      alt='avatar'
                      referrerPolicy='no-referrer'
                    />
                  </div>
                  <div className={styles.navbar__dropdownUserInfo}>
                    <span className={styles.navbar__dropdownName}>
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.navbar__dropdownArrow} />
                </div>

                <div className={styles.navbar__dropdownDivider} />

                <button
                  type='button'
                  className={styles.navbar__dropdownItem}
                  onClick={() => handleDropdownNavigate('/my-questions')}
                >
                  <MessageSquare size={16} />
                  <span>Your Topics</span>
                </button>

                <button
                  type='button'
                  className={styles.navbar__dropdownItem}
                  onClick={() => handleDropdownNavigate('/rag-documents')}
                >
                  <Bookmark size={16} />
                  <span>Knowledge Base</span>
                </button>

                <button
                  type='button'
                  className={styles.navbar__dropdownItem}
                  onClick={() => handleDropdownNavigate('/notifications')}
                >
                  <FileText size={16} />
                  <span>Notifications</span>
                </button>

                <div className={styles.navbar__dropdownDivider} />

                <button
                  type='button'
                  className={styles.navbar__dropdownItem}
                  onClick={() => handleDropdownNavigate('/profile')}
                >
                  <BarChart3 size={16} />
                  <span>Profile</span>
                </button>

                <div className={styles.navbar__dropdownDivider} />

                <button
                  type='button'
                  className={`${styles.navbar__dropdownItem} ${styles.navbar__dropdownItemLogout}`}
                  onClick={() => { setShowDropdown(false); onLogout(); }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
