/**
 * Profile — user profile page showing avatar, bio, credentials, and activity tabs
 * (questions/answers). Allows editing own profile fields inline.
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profile/profile.service.js';
import { apiClient } from '../../services/core/api.client.js';
import { Pencil, MapPin, Briefcase, GraduationCap, Calendar, X, Camera } from 'lucide-react';
import styles from './Profile.module.css';

const TABS = ['Questions', 'Answers'];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Questions');
  const [searchContent, setSearchContent] = useState('');
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioForm, setBioForm] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameForm, setNameForm] = useState({ firstName: '', lastName: '' });
  const [isSavingName, setIsSavingName] = useState(false);

  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [credentialType, setCredentialType] = useState('employment');
  const [credentialTitle, setCredentialTitle] = useState('');
  const [isSavingCredential, setIsSavingCredential] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await profileService.getMyProfile();
      setProfile(data);
      setBioForm(data.bio || '');
      setNameForm({ firstName: data.firstName, lastName: data.lastName });
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserQuestions() {
    try {
      setLoadingContent(true);
      const res = await apiClient.get('/api/questions', { params: { mine: true } });
      setUserQuestions(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContent(false);
    }
  }

  async function loadUserAnswers() {
    try {
      setLoadingContent(true);
      const res = await apiClient.get('/api/answers', { params: { userId: user?.id } });
      setUserAnswers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContent(false);
    }
  }

  useEffect(() => {
    loadProfile();
    loadUserQuestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'Questions') loadUserQuestions();
    if (activeTab === 'Answers') loadUserAnswers();
  }, [activeTab]);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const updated = await profileService.uploadAvatar(file);
      setProfile(updated);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.avatar = updated.avatarUrl;
      localStorage.setItem('user', JSON.stringify(storedUser));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveBio() {
    try {
      setIsSavingBio(true);
      const updated = await profileService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: bioForm,
      });
      setProfile(updated);
      setIsEditingBio(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingBio(false);
    }
  }

  async function handleSaveName() {
    try {
      setIsSavingName(true);
      const updated = await profileService.updateProfile({
        firstName: nameForm.firstName,
        lastName: nameForm.lastName,
        bio: profile.bio,
      });
      setProfile(updated);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAddCredential() {
    if (!credentialTitle.trim()) return;
    try {
      setIsSavingCredential(true);
      const updated = await profileService.addCredential(credentialType, credentialTitle);
      setProfile(updated);
      setShowCredentialModal(false);
      setCredentialTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingCredential(false);
    }
  }

  async function handleDeleteCredential(credentialId) {
    try {
      const updated = await profileService.deleteCredential(credentialId);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  }

  const getJoinDate = () => {
    if (!profile?.createdAt) return '';
    const date = new Date(profile.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const filterContent = (items, searchField) => {
    if (!searchContent.trim()) return items;
    return items.filter(item =>
      item[searchField]?.toLowerCase().includes(searchContent.toLowerCase())
    );
  };

  const getCredentialIcon = (type) => {
    switch (type) {
      case 'employment': return <Briefcase size={16} className={styles.credentialIcon} />;
      case 'education': return <GraduationCap size={16} className={styles.credentialIcon} />;
      case 'location': return <MapPin size={16} className={styles.credentialIcon} />;
      default: return null;
    }
  };

  const getAvatarUrl = () => {
    if (profile?.avatarUrl) return profile.avatarUrl;
    if (user?.avatar) return user.avatar;
    return `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}+${user?.lastName || ''}&background=random`;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.header}>
            <div
              className={styles.avatar}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={getAvatarUrl()}
                alt='avatar'
                referrerPolicy='no-referrer'
              />
              <div className={styles.avatarOverlay}>
                <Camera size={20} />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Change photo'}</span>
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/gif,image/webp'
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div className={styles.headerInfo}>
              {isEditingName ? (
                <div className={styles.nameEditForm}>
                  <input
                    type='text'
                    className={styles.nameInput}
                    value={nameForm.firstName}
                    onChange={(e) => setNameForm({ ...nameForm, firstName: e.target.value })}
                    placeholder='First name'
                  />
                  <input
                    type='text'
                    className={styles.nameInput}
                    value={nameForm.lastName}
                    onChange={(e) => setNameForm({ ...nameForm, lastName: e.target.value })}
                    placeholder='Last name'
                  />
                  <div className={styles.nameFormActions}>
                    <button type='button' className={styles.cancelBtn} onClick={() => setIsEditingName(false)}>Cancel</button>
                    <button type='button' className={styles.saveBtn} onClick={handleSaveName} disabled={isSavingName}>
                      {isSavingName ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.nameRow}>
                  <h1 className={styles.name}>
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  <button type='button' className={styles.editNameBtn} onClick={() => setIsEditingName(true)}>
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className={styles.credential}>Add profile credential</p>
              <p className={styles.followers}>
                {profile?.stats?.questions || 0} questions · {profile?.stats?.answers || 0} answers
              </p>
            </div>
          </div>

          <div className={styles.description}>
            {isEditingBio ? (
              <div className={styles.bioEditForm}>
                <textarea
                  className={styles.bioTextarea}
                  value={bioForm}
                  onChange={(e) => setBioForm(e.target.value)}
                  placeholder='Write a description about yourself...'
                  rows={3}
                />
                <div className={styles.formActions}>
                  <button type='button' className={styles.cancelBtn} onClick={() => setIsEditingBio(false)}>Cancel</button>
                  <button type='button' className={styles.saveBtn} onClick={handleSaveBio} disabled={isSavingBio}>
                    {isSavingBio ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.descriptionContent}>
                <p>{profile?.bio || 'Write a description about yourself'}</p>
                <button type='button' className={styles.editDescBtn} onClick={() => setIsEditingBio(true)}>
                  <Pencil size={14} /> Edit
                </button>
              </div>
            )}
          </div>

          <div className={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab}
                type='button'
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab(tab); setSearchContent(''); }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.content}>
            <div className={styles.searchBox}>
              <input
                type='text'
                placeholder='Search content'
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {loadingContent ? (
              <p className={styles.loadingContent}>Loading...</p>
            ) : activeTab === 'Questions' ? (
              <div className={styles.contentList}>
                {filterContent(userQuestions, 'title').length === 0 ? (
                  <div className={styles.emptyContent}>
                    <p>No questions found.</p>
                  </div>
                ) : (
                  filterContent(userQuestions, 'title').map(q => (
                    <div
                      key={q.questionHash || q.id}
                      className={styles.contentItem}
                      onClick={() => navigate(`/question/${q.questionHash || q.id}`)}
                    >
                      <h4 className={styles.contentItemTitle}>{q.title}</h4>
                      <p className={styles.contentItemMeta}>
                        {q.answerCount || 0} answers · {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'Answers' ? (
              <div className={styles.contentList}>
                {filterContent(userAnswers, 'content').length === 0 ? (
                  <div className={styles.emptyContent}>
                    <p>No answers found.</p>
                  </div>
                ) : (
                  filterContent(userAnswers, 'content').map(a => (
                    <div
                      key={a.id || a.answerId}
                      className={styles.contentItem}
                      onClick={() => navigate(`/question/${a.questionHash}`)}
                    >
                      <p className={styles.contentItemText}>{a.content?.substring(0, 150)}...</p>
                      <p className={styles.contentItemMeta}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Credentials & Highlights</h3>
              <button type='button' className={styles.editBtn} onClick={() => setShowCredentialModal(true)}>
                <Pencil size={16} />
              </button>
            </div>
            <div className={styles.credentialList}>
              {profile?.credentials?.map(cred => (
                <div key={cred.id} className={styles.credentialItem}>
                  {getCredentialIcon(cred.type)}
                  <span className={styles.credentialText}>{cred.title}</span>
                  <button type='button' className={styles.deleteCredentialBtn} onClick={() => handleDeleteCredential(cred.id)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className={styles.credentialItem}>
                <Calendar size={16} className={styles.credentialIcon} />
                <span>Joined {getJoinDate()}</span>
              </div>
            </div>
          </div>


        </div>
      </div>

      {showCredentialModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCredentialModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Credential</h3>
              <button type='button' className={styles.modalClose} onClick={() => setShowCredentialModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <label className={styles.label}>Type</label>
                <select
                  className={styles.select}
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                >
                  <option value='employment'>Employment</option>
                  <option value='education'>Education</option>
                  <option value='location'>Location</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Title</label>
                <input
                  type='text'
                  className={styles.input}
                  value={credentialTitle}
                  onChange={(e) => setCredentialTitle(e.target.value)}
                  placeholder='e.g. Software Engineer at Google'
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type='button' className={styles.cancelBtn} onClick={() => setShowCredentialModal(false)}>Cancel</button>
              <button type='button' className={styles.saveBtn} onClick={handleAddCredential} disabled={isSavingCredential || !credentialTitle.trim()}>
                {isSavingCredential ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
