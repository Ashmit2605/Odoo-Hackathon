import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function signAccessToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}