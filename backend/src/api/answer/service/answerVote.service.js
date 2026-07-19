import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

/**
 * Toggle upvote for an answer.
 * If the user has already voted, remove the vote.
 * If the user has not voted, add a vote.
 * Returns { voted: true/false, voteCount: number }
 */
export const toggleAnswerVoteService = async ({ answerId, userId }) => {
  const answerSql = 'SELECT answer_id FROM answers WHERE answer_id = $1 LIMIT 1';
  const answerRows = await safeExecute(answerSql, [answerId]);

  if (answerRows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  const existingVoteSql = 'SELECT vote_id FROM answer_votes WHERE answer_id = $1 AND user_id = $2 LIMIT 1';
  const existingVotes = await safeExecute(existingVoteSql, [answerId, userId]);

  if (existingVotes.length > 0) {
    await safeExecute('DELETE FROM answer_votes WHERE answer_id = $1 AND user_id = $2', [answerId, userId]);
  } else {
    await safeExecute('INSERT INTO answer_votes (answer_id, user_id) VALUES ($1, $2)', [answerId, userId]);
  }

  const countSql = 'SELECT COUNT(*) AS vote_count FROM answer_votes WHERE answer_id = $1';
  const countRows = await safeExecute(countSql, [answerId]);

  return {
    voted: existingVotes.length === 0,
    voteCount: countRows[0].vote_count,
  };
};

/**
 * Get vote count and whether the current user has voted for a single answer.
 */
export const getAnswerVoteStatusService = async ({ answerId, userId }) => {
  const countSql = 'SELECT COUNT(*) AS vote_count FROM answer_votes WHERE answer_id = $1';
  const countRows = await safeExecute(countSql, [answerId]);

  let userHasVoted = false;
  if (userId) {
    const voteSql = 'SELECT 1 FROM answer_votes WHERE answer_id = $1 AND user_id = $2 LIMIT 1';
    const voteRows = await safeExecute(voteSql, [answerId, userId]);
    userHasVoted = voteRows.length > 0;
  }

  return {
    voteCount: countRows[0].vote_count,
    userHasVoted,
  };
};
