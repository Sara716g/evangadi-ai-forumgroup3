/**
 * StatsCards — renders a grid of dashboard statistic cards (total users, questions, etc.)
 * from the admin stats API response.
 */
import { Users, MessageSquare, Activity, UserPlus, HelpCircle } from 'lucide-react';
import styles from './StatsCards.module.css';

const CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: '#3b82f6' },
  { key: 'totalQuestions', label: 'Total Questions', icon: MessageSquare, color: '#f97316' },
  { key: 'totalAnswers', label: 'Total Answers', icon: Activity, color: '#10b981' },
  { key: 'activeUsers', label: 'Active Users', icon: UserPlus, color: '#8b5cf6' },
  { key: 'newUsersToday', label: 'New Users Today', icon: UserPlus, color: '#06b6d4' },
  { key: 'newQuestionsToday', label: 'New Questions Today', icon: HelpCircle, color: '#ec4899' },
];

export default function StatsCards({ stats }) {
  return (
    <div className={styles.grid}>
      {CARDS.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className={styles.card}>
          <div className={styles.iconWrap} style={{ backgroundColor: `${color}15`, color }}>
            <Icon size={22} />
          </div>
          <div className={styles.info}>
            <span className={styles.value}>{stats?.[key] ?? 0}</span>
            <span className={styles.label}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
