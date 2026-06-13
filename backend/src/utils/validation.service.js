/**
 * ============================================================================
 * Cross-Domain Utility: Input Validation Service
 * ============================================================================
 * Provides consistent validation patterns for all domains.
 * Reduces duplication and ensures uniform error messages.
 * 
 * Validation layers:
 * 1. Type validation (string, number, array types)
 * 2. Length/size validation (min/max bounds)
 * 3. Format validation (email, URL, special patterns)
 * 4. Business logic validation (uniqueness, relationships)
 * ============================================================================
 */

import { BadRequestError } from './errors/index.js';

// String validations
export const validateString = ({ value, fieldName, minLength = 1, maxLength = Infinity }) => {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new BadRequestError(`${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    throw new BadRequestError(`${fieldName} must not exceed ${maxLength} characters`);
  }

  return trimmed;
};

// Email validation
export const validateEmail = (email) => {
  const validated = validateString({
    value: email,
    fieldName: 'Email',
    minLength: 5,
    maxLength: 320,
  });

  // Basic email validation
  if (!validated.includes('@') || !validated.includes('.')) {
    throw new BadRequestError('Email must be a valid email address');
  }

  return validated.toLowerCase();
};

// Question title validation
export const validateQuestionTitle = (title) => {
  return validateString({
    value: title,
    fieldName: 'Question title',
    minLength: 5,
    maxLength: 255,
  });
};

// Question content validation
export const validateQuestionContent = (content) => {
  return validateString({
    value: content,
    fieldName: 'Question content',
    minLength: 10,
    maxLength: 10000,
  });
};

// Answer content validation
export const validateAnswerContent = (content) => {
  return validateString({
    value: content,
    fieldName: 'Answer content',
    minLength: 5,
    maxLength: 10000,
  });
};

// Integer validation
export const validatePositiveInteger = ({ value, fieldName }) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequestError(`${fieldName} must be a positive integer`);
  }
  return num;
};

// Array validation
export const validateArray = ({ value, fieldName, minItems = 1, maxItems = Infinity }) => {
  if (!Array.isArray(value)) {
    throw new BadRequestError(`${fieldName} must be an array`);
  }

  if (value.length < minItems) {
    throw new BadRequestError(`${fieldName} must contain at least ${minItems} item(s)`);
  }

  if (value.length > maxItems) {
    throw new BadRequestError(`${fieldName} must not exceed ${maxItems} item(s)`);
  }

  return value;
};

// Document title validation
export const validateDocumentTitle = (title) => {
  return validateString({
    value: title,
    fieldName: 'Document title',
    minLength: 1,
    maxLength: 512,
  });
};

// Search query validation
export const validateSearchQuery = (query) => {
  return validateString({
    value: query,
    fieldName: 'Search query',
    minLength: 1,
    maxLength: 1000,
  });
};
