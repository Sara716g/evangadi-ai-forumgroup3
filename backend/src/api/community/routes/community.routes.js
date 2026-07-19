/**
 * @file Community API routes.
 *
 * Public endpoint for searching external forums (StackOverflow, Dev.to).
 * No authentication required.
 */

import express from 'express';
import { getExternalSearch } from '../controller/community.controller.js';

const router = express.Router();

/** GET /external — Search external forums by query string. */
router.get('/external', getExternalSearch);

export default router;