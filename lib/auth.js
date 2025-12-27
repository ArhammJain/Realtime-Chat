// lib/auth.js
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET not set');
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';

  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';

  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  });

  res.setHeader('Set-Cookie', cookie);
}

export function getUserFromRequest(req) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const token = cookies.token;

  if (!token) return null;

  try {
    const user = verifyToken(token);
    return user;
  } catch (e) {
    return null;
  }
}
