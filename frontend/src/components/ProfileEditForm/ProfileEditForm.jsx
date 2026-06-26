import { useState, useRef } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import { profileService } from '../../services/profile.service.js';
import styles from './ProfileEditForm.module.css';

export default function ProfileEditForm({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar_url || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 2MB.' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return;

    try {
      setIsUploading(true);
      const data = await profileService.uploadAvatar(avatarFile);
      const payload = data.data || data;
      setAvatarFile(null);
      if (payload.avatarUrl) {
        setAvatarPreview(payload.avatarUrl);
      }
      setMessage({ type: 'success', text: 'Avatar updated.' });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setMessage({ type: 'error', text: 'Failed to upload avatar.' });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);

      if (avatarFile) {
        await handleAvatarUpload();
      }

      await profileService.update(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Profile update failed:', err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Edit Profile</h3>

      {message && (
        <div
          className={`${styles.message} ${
            message.type === 'error' ? styles.messageError : styles.messageSuccess
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={styles.avatarSection}>
        <div className={styles.avatarPreview}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <Camera size={24} />
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button
          type="button"
          className={styles.changeAvatarBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          Change photo
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          className={styles.textarea}
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          maxLength={500}
        />
        <span className={styles.charCount}>{formData.bio.length}/500</span>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          className={styles.input}
          placeholder="City, Country"
          value={formData.location}
          onChange={handleChange}
          maxLength={100}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          className={styles.input}
          placeholder="https://example.com"
          value={formData.website}
          onChange={handleChange}
          maxLength={255}
        />
      </div>

      <button
        type="submit"
        className={styles.saveBtn}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 size={16} className={styles.spinIcon} />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} />
            Save changes
          </>
        )}
      </button>
    </form>
  );
}
