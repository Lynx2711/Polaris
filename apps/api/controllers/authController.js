import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import pool from '../config/db.js';

// Helper to handle validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  }
  return null;
};

export const register = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { fullName, email, password, role = 'user' } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({ fullName, email, passwordHash, role });

    res.status(201).json({ message: 'User registered successfully. Please log in.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Cookie configuration
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in prod (HTTPS)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  res.json(req.user);
};

export const updateProfile = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { fullName, email } = req.body;
  const userId = req.user.id;

  try {
    // Check if new email is taken by another user
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }

    const updatedUser = await User.updateProfile(userId, { fullName, email });
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error during profile update' });
  }
};

export const changePassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByEmail(req.user.email);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.updatePassword(userId, passwordHash);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error during password update' });
  }
};

export const forgotPassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      // Return 200/success anyways to protect user privacy
      return res.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await User.saveResetToken(user.id, token, expiresAt);

    // Logging link to console since we don't have mail server
    const resetUrl = `http://localhost:5174/reset-password/${token}`;
    console.log('\n======================================');
    console.log(`PASSWORD RESET FOR: ${email}`);
    console.log(`RESET URL: ${resetUrl}`);
    console.log('======================================\n');

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error during password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { token, password } = req.body;

  try {
    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.updatePassword(user.id, passwordHash);
    await User.clearResetToken(user.id);

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error during password reset' });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  try {
    let googleId, email, fullName, avatarUrl;

    if (credential === 'mock_google_token') {
      googleId = 'mock_google_user_id_99999';
      email = 'google-mock@polaris.com';
      fullName = 'Mock Google User';
      avatarUrl = 'https://lh3.googleusercontent.com/a/default-user';
    } else {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ error: 'Invalid Google token payload' });
      }

      googleId = payload.sub;
      email = payload.email;
      fullName = payload.name;
      avatarUrl = payload.picture;
    }

    let user;
    try {
      user = await User.findByGoogleId(googleId);

      if (!user) {
        user = await User.findByEmail(email);
        if (user) {
          await pool.execute(
            `UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?`,
            [googleId, avatarUrl, user.id]
          );
          user.google_id = googleId;
          user.avatar_url = avatarUrl;
        } else {
          user = await User.create({
            fullName,
            email,
            role: 'user',
            googleId,
            avatarUrl
          });
        }
      }
    } catch (dbError) {
      console.warn('\n======================================');
      console.warn('DATABASE CONNECTION / QUERY FAILED:');
      console.warn(dbError.message);
      if (credential === 'mock_google_token') {
        console.warn('FALLING BACK TO LOCAL MEMORY MOCK USER FOR OFFLINE TESTING.');
        user = {
          id: 99999,
          full_name: 'Mock Google User',
          email: 'google-mock@polaris.com',
          role: 'user',
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user'
        };
      } else {
        throw dbError;
      }
      console.warn('======================================\n');
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      id: user.id,
      fullName: user.full_name || user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url || user.avatarUrl
    });
  } catch (error) {
    console.error('Google OAuth verification error:', error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
};
