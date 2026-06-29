import express from 'express';
import { getExternalSearch } from '../controller/community.controller.js';

const router = express.Router();

// Route is public as per specifications
router.get('/external', getExternalSearch);

export default router;