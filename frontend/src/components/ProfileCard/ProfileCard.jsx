import { User, MapPin, Globe } from 'lucide-react';
import styles from './ProfileCard.module.css';

export default function ProfileCard({ profile, user }) {
  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'Unknown User';

  const avatarUrl =
    profile?.avatar_url ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f97316&color=fff`;

  return (
    <div className={styles.card}>
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
        </div>
        <h2 className={styles.name}>{displayName}</h2>
        {profile?.bio && <p className={styles.bio}>{profile.bio}</p>}
      </div>

      <div className={styles.details}>
        {profile?.location && (
          <div className={styles.detailRow}>
            <MapPin size={14} className={styles.detailIcon} />
            <span className={styles.detailText}>{profile.location}</span>
          </div>
        )}
        {profile?.website && (
          <div className={styles.detailRow}>
            <Globe size={14} className={styles.detailIcon} />
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.detailLink}
            >
              {profile.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
