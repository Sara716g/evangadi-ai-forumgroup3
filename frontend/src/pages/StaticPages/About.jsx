/** Static "About" page describing the platform and team. */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from '../StaticPages/StaticPages.module.css';

export default function About() {
  return (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className={styles.pageTitle}>About Evangadi Forum</h1>
      <p className={styles.pageSubtitle}>
        Learn more about our mission and the community we're building.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Mission</h2>
        <p className={styles.sectionText}>
          Evangadi Forum is a practice space for technical Q&A, peer feedback, and AI-assisted
          search. We built this platform for Evangadi learners and mentors to collaborate, share
          knowledge, and grow together.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>What We Offer</h2>
        <ul className={styles.list}>
          <li>Ask and answer technical questions in a supportive community</li>
          <li>AI-powered search to find relevant answers faster</li>
          <li>Semantic question matching to avoid duplicate discussions</li>
          <li>Knowledge base with document upload and AI-assisted retrieval</li>
          <li>Voice input and text-to-speech for accessibility</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Built for Learners</h2>
        <p className={styles.sectionText}>
          Whether you're just starting your coding journey or helping others learn, Evangadi Forum
          provides the tools and environment to have meaningful technical conversations. Every
          question is an opportunity to learn, and every answer helps someone grow.
        </p>
      </div>

      <div className={styles.highlight}>
        <p>
          Evangadi Forum is an educational platform built as part of the Evangadi Networks
          full-stack development program.
        </p>
      </div>
    </div>
  );
}
