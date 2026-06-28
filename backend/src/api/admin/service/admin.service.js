import { safeExecute } from '../../../../db/config.js';
import { NotFoundError, BadRequestError } from '../../../utils/errors/index.js';

export const getStatsService = async () => {
  const [usersRow] = await safeExecute('SELECT COUNT(*) AS count FROM users', []);
  const [questionsRow] = await safeExecute('SELECT COUNT(*) AS count FROM questions', []);
  const [answersRow] = await safeExecute('SELECT COUNT(*) AS count FROM answers', []);

  const [activeUsersRow] = await safeExecute(
    "SELECT COUNT(*) AS count FROM users WHERE status = 'active'", []
  );

  const [newUsersRow] = await safeExecute(
    "SELECT COUNT(*) AS count FROM users WHERE DATE(created_at) = CURDATE()", []
  );

  const [newQuestionsRow] = await safeExecute(
    "SELECT COUNT(*) AS count FROM questions WHERE DATE(created_at) = CURDATE()", []
  );

  return {
    totalUsers: usersRow.count,
    totalQuestions: questionsRow.count,
    totalAnswers: answersRow.count,
    activeUsers: activeUsersRow.count,
    newUsersToday: newUsersRow.count,
    newQuestionsToday: newQuestionsRow.count,
  };
};

export const getAllUsersService = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit;
  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = 'WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const countSql = `SELECT COUNT(*) AS total FROM users u ${whereClause}`;
  const [countRow] = await safeExecute(countSql, params);
  const total = countRow.total;

  const usersSql = `
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.status, u.created_at,
           COALESCE(q.question_count, 0) AS question_count,
           COALESCE(a.answer_count, 0) AS answer_count
    FROM users u
    LEFT JOIN (SELECT user_id, COUNT(*) AS question_count FROM questions GROUP BY user_id) q ON q.user_id = u.user_id
    LEFT JOIN (SELECT user_id, COUNT(*) AS answer_count FROM answers GROUP BY user_id) a ON a.user_id = u.user_id
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const users = await safeExecute(usersSql, [...params, Number(limit), offset]);

  return {
    users: users.map((u) => ({
      id: u.user_id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
      status: u.status,
      questionCount: u.question_count,
      answerCount: u.answer_count,
      createdAt: u.created_at,
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateUserStatusService = async (userId, status, adminId) => {
  if (userId === adminId) {
    throw new BadRequestError('You cannot change your own status.');
  }

  const validStatuses = ['active', 'banned', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const rows = await safeExecute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  await safeExecute('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);

  return { id: userId, status };
};

export const getAllQuestionsService = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit;
  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = 'WHERE (q.title LIKE ? OR q.content LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  const countSql = `SELECT COUNT(*) AS total FROM questions q ${whereClause}`;
  const [countRow] = await safeExecute(countSql, params);
  const total = countRow.total;

  const questionsSql = `
    SELECT q.question_id, q.question_hash, q.title, q.content, q.created_at,
           u.first_name, u.last_name, u.email,
           COALESCE(a.answer_count, 0) AS answer_count
    FROM questions q
    LEFT JOIN users u ON u.user_id = q.user_id
    LEFT JOIN (SELECT question_id, COUNT(*) AS answer_count FROM answers GROUP BY question_id) a ON a.question_id = q.question_id
    ${whereClause}
    ORDER BY q.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const questions = await safeExecute(questionsSql, [...params, Number(limit), offset]);

  return {
    questions: questions.map((q) => ({
      id: q.question_id,
      questionHash: q.question_hash,
      title: q.title,
      content: q.content,
      author: `${q.first_name} ${q.last_name}`,
      authorEmail: q.email,
      answerCount: q.answer_count,
      createdAt: q.created_at,
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const toggleUserRoleService = async (userId, adminId) => {
  if (userId === adminId) {
    throw new BadRequestError('You cannot change your own role.');
  }

  const rows = await safeExecute('SELECT user_id, role FROM users WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    throw new NotFoundError('User not found.');
  }

  const newRole = rows[0].role === 'admin' ? 'user' : 'admin';
  await safeExecute('UPDATE users SET role = ? WHERE user_id = ?', [newRole, userId]);

  return { id: userId, role: newRole };
};

export const deleteQuestionService = async (questionHash) => {
  const rows = await safeExecute(
    'SELECT question_id FROM questions WHERE question_hash = ?',
    [questionHash]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Question not found.');
  }

  await safeExecute('DELETE FROM questions WHERE question_hash = ?', [questionHash]);

  return { success: true };
};

export const deleteAnswerService = async (answerId) => {
  const rows = await safeExecute(
    'SELECT answer_id FROM answers WHERE answer_id = ?',
    [answerId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Answer not found.');
  }

  await safeExecute('DELETE FROM answers WHERE answer_id = ?', [answerId]);

  return { success: true };
};
