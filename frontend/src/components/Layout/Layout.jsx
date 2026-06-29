import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import styles from './Layout.module.css';

/**
 * Authenticated shell: fixed sidebar + scrollable main column + footer.
 * Add new `pathname` branches below when you introduce more protected routes.
 */
export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  /** Navbar title: keep in sync with routes in `App.jsx`. */
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Home';
    if (path === '/my-questions') return 'Your topics';
    if (path === '/questions/ask') return 'Ask a question';
    if (path.startsWith('/question/')) return 'Discussion';
    if (path === '/rag-documents') return 'Knowledge base';
    if (path === '/notifications') return 'Notifications';
    if (path === '/profile') return 'My Profile';
    if (path === '/admin') return 'Admin Dashboard';
    if (path === '/admin/users') return 'Manage Users';
    if (path === '/admin/questions') return 'Manage Questions';
    if (path === '/about') return 'About';
    if (path === '/privacy') return 'Privacy Policy';
    if (path === '/terms') return 'Terms of Service';
    if (path === '/contact') return 'Contact Us';
    return 'Forum';
  };

  /** One-line context under the title (helps students orient on each screen). */
  const getSubtitle = () => {
    const path = location.pathname;
    if (path === '/dashboard')
      return 'Browse the feed, search by keyword, or run AI similarity search.';
    if (path === '/my-questions')
      return 'Questions you have posted. Open any thread to read replies or edit context.';
    if (path === '/questions/ask')
      return 'A clear title and reproducible steps get faster, more accurate answers.';
    if (path.startsWith('/question/'))
      return 'Read the thread, review related topics, and reply with markdown if you can help.';
    if (path === '/rag-documents')
      return 'Private PDF library: reader, semantic search, and AI answers with citations per document.';
    if (path === '/notifications')
      return 'Stay updated with activity on your questions and answers.';
    if (path === '/profile')
      return 'Manage your public profile information.';
    if (path === '/admin')
      return 'Overview of platform activity and management tools.';
    if (path === '/admin/users')
      return 'View and manage all registered users.';
    if (path === '/admin/questions')
      return 'Review and moderate community questions.';
    if (path === '/about')
      return 'Learn more about the Evangadi Forum platform.';
    if (path === '/privacy')
      return 'How we collect, use, and protect your information.';
    if (path === '/terms')
      return 'Guidelines and rules for using the platform.';
    if (path === '/contact')
      return 'Get in touch with the Evangadi Forum team.';
    return '';
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.layout__content}>
        <Navbar
          title={getTitle()}
          subtitle={getSubtitle()}
          user={user}
          onLogout={logout}
        />
        <main className={styles.layout__main}>
          <div className={styles.layout__mainInner}>
            <Outlet />
          </div>
        </main>

        <footer className={styles.layout__footer}>
          <div className={styles['layout__footer-content']}>
            <div className={styles['layout__footer-branding']}>
              <h4 className={styles['layout__footer-title']}>Evangadi Forum</h4>
              <p className={styles['layout__footer-tagline']}>
                A practice space for technical Q&A, peer feedback, and
                AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles['layout__footer-copyright']}>
                © 2026 Evangadi Forum. For educational use.
              </p>
            </div>
            <nav className={styles['layout__footer-nav']}>
              <Link to='/about' className={styles['layout__footer-link']}>
                About
              </Link>
              <Link to='/privacy' className={styles['layout__footer-link']}>
                Privacy
              </Link>
              <Link to='/terms' className={styles['layout__footer-link']}>
                Terms
              </Link>
              <Link to='/contact' className={styles['layout__footer-link']}>
                Contact
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
