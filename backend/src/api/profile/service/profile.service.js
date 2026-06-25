import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

export const getProfileByUserId = async (userId) => {
  const sql = `
    SELECT p.profile_id, p.user_id, p.bio, p.avatar_url, p.location, p.website, p.updated_at,
           u.first_name, u.last_name, u.email
    FROM profiles p
    JOIN users u ON p.user_id = u.user_id
    WHERE p.user_id = ?
    LIMIT 1
  `;
  const rows = await safeExecute(sql, [userId]);
  return rows[0] || null;
};

export const createOrUpdateProfile = async (userId, { bio, location, website, avatarUrl }) => {
  const existing = await safeExecute('SELECT profile_id FROM profiles WHERE user_id = ?', [userId]);

  if (existing.length > 0) {
    const sql = 'UPDATE profiles SET bio = ?, location = ?, website = ?, avatar_url = ? WHERE user_id = ?';
    await safeExecute(sql, [bio || null, location || null, website || null, avatarUrl || null, userId]);
  } else {
    const sql = 'INSERT INTO profiles (user_id, bio, location, website, avatar_url) VALUES (?, ?, ?, ?, ?)';
    await safeExecute(sql, [userId, bio || null, location || null, website || null, avatarUrl || null]);
  }

  return getProfileByUserId(userId);
};

export const uploadAvatar = async (userId, file) => {
  const avatarUrl = `/uploads/avatars/${file.filename}`;
  await createOrUpdateProfile(userId, { avatarUrl });
  return { avatarUrl };
};
