import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from '../StaticPages/StaticPages.module.css';

export default function Privacy() {
  return (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className={styles.pageTitle}>Privacy Policy</h1>
      <p className={styles.pageSubtitle}>
        How we collect, use, and protect your information.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Information We Collect</h2>
        <ul className={styles.list}>
          <li>Account information: name, email address, and profile details you provide</li>
          <li>Content: questions, answers, and documents you upload to the platform</li>
          <li>Usage data: pages visited, search queries, and interaction patterns</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
        <ul className={styles.list}>
          <li>To provide and improve the forum experience</li>
          <li>To power AI-assisted search and recommendations</li>
          <li>To send notifications about activity on your questions and answers</li>
          <li>To maintain platform security and prevent abuse</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Data Protection</h2>
        <p className={styles.sectionText}>
          We implement appropriate security measures to protect your personal information.
          Your data is stored securely and is only accessed by authorized personnel. We do not
          sell your personal information to third parties.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>AI Features</h2>
        <p className={styles.sectionText}>
          Our AI-powered features process your queries to provide relevant answers and
          suggestions. Uploaded documents are processed for semantic search indexing. AI
          interactions may be logged to improve service quality.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Rights</h2>
        <ul className={styles.list}>
          <li>Access and review your personal data</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of non-essential data collection</li>
        </ul>
      </div>

      <div className={styles.highlight}>
        <p>
          This is an educational platform. For questions about your data, contact the
          Evangadi Networks team.
        </p>
      </div>
    </div>
  );
}
