// JSON Web Token (JWT) Helper Utilities
// Provides signing and verification helpers for user session tokens

import jwt from 'jsonwebtoken'; // Library to sign, verify, and decode JSON Web Tokens
import dotenv from 'dotenv';    // Module to read variables from .env

// Load environment variables
dotenv.config();

// Secret signature key used for signing and verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || 'polaris_secret_key_12345';
// Expiration period for generated JWT tokens (e.g. '7d' for 7 days)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a signed JWT for a given payload (user object / claims).
 * @param {Object} payload - Data to embed inside the token (e.g. { id, email, role })
 * @returns {string} - Signed JWT token string
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifies a given JWT string against the secret key.
 * @param {string} token - Signed JWT string
 * @returns {Object|null} - Decoded payload if valid, null if signature invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET); // Verify cryptographic signature and expiration
  } catch (error) {
    return null; // Return null if token is invalid, expired, or tampered with
  }
};

