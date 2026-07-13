import { safeExecute } from '../../../../db/config.js';
import { NotFoundError, BadRequestError } from '../../../utils/errors/index.js';
import fs from 'fs';
import path from 'path';

export const getProfileService = async (userId) => {
  const rows = await safeExecute(
    'SELECT user_id, first_name, last_name, email, bio, avatar_url, created_at FROM users WHERE user_id = $1',
    [userId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  const user = rows[0];

  const questionCount = await safeExecute(
    'SELECT COUNT(*) as count FROM questions WHERE user_id = $1',
    [userId]
  );

  const answerCount = await safeExecute(
    'SELECT COUNT(*) as count FROM answers WHERE user_id = $1',
    [userId]
  );

  const credentials = await safeExecute(
    'SELECT credential_id, credential_type, title FROM user_credentials WHERE user_id = $1',
    [userId]
  );

  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    bio: user.bio || '',
    avatarUrl: user.avatar_url || null,
    createdAt: user.created_at,
    stats: {
      questions: questionCount[0].count,
      answers: answerCount[0].count,
    },
    credentials: credentials.map(c => ({
      id: c.credential_id,
      type: c.credential_type,
      title: c.title,
    })),
  };
};

export const updateProfileService = async (userId, { firstName, lastName, bio }) => {
  if (!firstName || !lastName) {
    throw new BadRequestError('First name and last name are required.');
  }

  await safeExecute(
    'UPDATE users SET first_name = $1, last_name = $2, bio = $3, updated_at = NOW() WHERE user_id = $4',
    [firstName, lastName, bio || null, userId]
  );

  return getProfileService(userId);
};

export const uploadAvatarService = async (userId, file) => {
  if (!file) {
    throw new BadRequestError('No image file provided.');
  }

  const avatarUrl = `/uploads/avatars/${file.filename}`;

  await safeExecute(
    'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE user_id = $2',
    [avatarUrl, userId]
  );

  return getProfileService(userId);
};

export const addCredentialService = async (userId, { type, title }) => {
  if (!type || !title) {
    throw new BadRequestError('Credential type and title are required.');
  }

  if (!['employment', 'education', 'location'].includes(type)) {
    throw new BadRequestError('Invalid credential type.');
  }

  await safeExecute(
    'INSERT INTO user_credentials (user_id, credential_type, title) VALUES ($1, $2, $3)',
    [userId, type, title]
  );

  return getProfileService(userId);
};

export const deleteCredentialService = async (userId, credentialId) => {
  await safeExecute(
    'DELETE FROM user_credentials WHERE credential_id = $1 AND user_id = $2',
    [credentialId, userId]
  );

  return getProfileService(userId);
};
