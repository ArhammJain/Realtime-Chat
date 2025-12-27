// pages/api/auth/signup.js
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { signToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username);

    if (existingErr) {
      console.error('Supabase signup check error:', existingErr);
      return res
        .status(500)
        .json({ error: 'db error', details: existingErr.message });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({ username, password_hash: hash })
      .select('id, username')
      .single();

    if (insertErr) {
      console.error('Supabase signup insert error:', insertErr);
      return res
        .status(500)
        .json({ error: 'db error', details: insertErr.message });
    }

    const token = signToken({ id: inserted.id, username: inserted.username });
    setAuthCookie(res, token);

    return res
      .status(200)
      .json({ user: { id: inserted.id, username: inserted.username } });
  } catch (err) {
    console.error('signup handler error:', err);
    return res.status(500).json({ error: 'server error' });
  }
}
