import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function formatUserResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    address: user.address || { street: '', city: '', state: '', postalCode: '' },
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 * Public customer registration (always assigns 'customer' role).
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Security: Always force role to 'customer' on public registration
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'customer',
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: address && typeof address === 'object' ? address : undefined,
    });

    const token = signToken(user._id);
    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate customer or admin and return JWT token.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    res.json({
      message: 'Login successful.',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Return currently authenticated user profile.
 */
export async function getMe(req, res) {
  res.json({ user: formatUserResponse(req.user) });
}

/**
 * PUT /api/auth/me
 * Update profile details for the currently authenticated user.
 */
export async function updateMe(req, res, next) {
  try {
    const { name, phone, address } = req.body;
    const updates = {};

    if (typeof name === 'string') {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
      }
      updates.name = name.trim();
    }

    if (typeof phone === 'string') {
      updates.phone = phone.trim();
    }

    if (address && typeof address === 'object') {
      updates.address = {
        street: String(address.street || '').trim(),
        city: String(address.city || '').trim(),
        state: String(address.state || '').trim(),
        postalCode: String(address.postalCode || '').trim(),
      };
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: 'Profile updated successfully.',
      user: formatUserResponse(updated),
    });
  } catch (error) {
    next(error);
  }
}
