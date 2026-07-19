/** Static "Contact" page with support email and social links. */
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import styles from '../StaticPages/StaticPages.module.css';

export default function Contact() {
  return (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className={styles.pageTitle}>Contact Us</h1>
      <p className={styles.pageSubtitle}>
        Have questions, feedback, or need help? We'd love to hear from you.
      </p>

      <div className={styles.contactGrid}>
        <div className={styles.contactCard}>
          <Mail size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <p className={styles.contactCardTitle}>Email</p>
          <p className={styles.contactCardText}>support@evanganetworks.com</p>
        </div>

        <div className={styles.contactCard}>
          <MessageSquare size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <p className={styles.contactCardTitle}>Community</p>
          <p className={styles.contactCardText}>Ask in the forum</p>
        </div>

        <div className={styles.contactCard}>
          <ExternalLink size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <p className={styles.contactCardTitle}>GitHub</p>
          <p className={styles.contactCardText}>Open an issue</p>
        </div>
      </div>

      <div className={styles.section} style={{ marginTop: '2rem' }}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <ul className={styles.list}>
          <li>How do I reset my password? — Use the "Forgot Password" link on the login page</li>
          <li>How do I ask a good question? — Provide a clear title, detailed description, and relevant context</li>
          <li>Can I upload files? — Yes, you can attach images and PDFs to your answers</li>
          <li>How does AI search work? — Our AI finds semantically similar questions and answers to help you faster</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>For Mentors</h2>
        <p className={styles.sectionText}>
          If you're an Evangadi mentor and need admin access or have platform-related questions,
          please reach out through the community Slack channel or email the platform team directly.
        </p>
      </div>

      <div className={styles.highlight}>
        <p>
          This is an educational platform built for the Evangadi Networks community.
          We typically respond within 24-48 hours.
        </p>
      </div>
    </div>
  );
}
