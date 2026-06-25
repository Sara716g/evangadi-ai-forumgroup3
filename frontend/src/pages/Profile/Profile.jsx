import { useState, useEffect } from 'react';
import { profileService } from '../../services/profile.service.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ProfileCard from '../../components/ProfileCard/ProfileCard.jsx';
import ProfileEditForm from '../../components/ProfileEditForm/ProfileEditForm.jsx';
import styles from './Profile.module.css';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await profileService.get();
      setProfile(data.data || data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Could not load profile.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <button type="button" className={styles.retryBtn} onClick={fetchProfile}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Profile</h1>
        <p className={styles.pageSubtitle}>
          Manage your public profile information.
        </p>
      </div>

      <div className={styles.columns}>
        <div className={styles.previewColumn}>
          <ProfileCard profile={profile} user={user} />
        </div>
        <div className={styles.editColumn}>
          <ProfileEditForm profile={profile} onUpdate={fetchProfile} />
        </div>
      </div>
    </div>
  );
}
