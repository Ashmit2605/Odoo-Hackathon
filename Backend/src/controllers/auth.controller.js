import * as authService from '../services/auth.service.js';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await authService.updateProfile(req.user.id, data);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}