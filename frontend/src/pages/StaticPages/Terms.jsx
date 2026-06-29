import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from '../StaticPages/StaticPages.module.css';

export default function Terms() {
  return (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className={styles.pageTitle}>Terms of Service</h1>
      <p className={styles.pageSubtitle}>
        Guidelines and rules for using the Evangadi Forum platform.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
        <p className={styles.sectionText}>
          By accessing or using Evangadi Forum, you agree to be bound by these Terms of Service.
          If you do not agree with any part of these terms, please do not use the platform.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Community Guidelines</h2>
        <ul className={styles.list}>
          <li>Be respectful and constructive in all interactions</li>
          <li>Ask clear, well-formed questions with sufficient context</li>
          <li>Provide helpful, accurate answers when you can</li>
          <li>No spam, self-promotion, or off-topic content</li>
          <li>Respect intellectual property and give credit where due</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Content Ownership</h2>
        <p className={styles.sectionText}>
          You retain ownership of content you post on the forum. By posting, you grant
          Evangadi Forum a non-exclusive license to display, distribute, and use your content
          within the platform for educational purposes.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account Responsibilities</h2>
        <ul className={styles.list}>
          <li>You are responsible for maintaining the security of your account</li>
          <li>One account per person — no duplicate or impersonation accounts</li>
          <li>Admins may suspend accounts that violate these terms</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
        <p className={styles.sectionText}>
          Evangadi Forum is provided "as is" for educational purposes. We make no warranties
          about the accuracy of content posted by users. Use the platform at your own discretion.
        </p>
      </div>

      <div className={styles.highlight}>
        <p>
          These terms may be updated from time to time. Continued use of the platform
          constitutes acceptance of any changes.
        </p>
      </div>
    </div>
  );
}
