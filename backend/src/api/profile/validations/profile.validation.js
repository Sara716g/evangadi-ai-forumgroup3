import { body } from 'express-validator';

export const updateProfileValidation = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be at most 500 characters.'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters.'),
  body('website')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Website must be at most 255 characters.'),
];
