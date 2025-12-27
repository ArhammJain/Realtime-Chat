// pages/api/auth/login.js
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { signToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'username and password required' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error) {
      console.error('Supabase login query error:', error);
      return res
        .status(500)
        .json({ error: 'db error', details: error.message });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, username: user.username });
    setAuthCookie(res, token);

    return res
      .status(200)
      .json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('login handler error:', err);
    return res.status(500).json({ error: 'server error' });
  }
}
