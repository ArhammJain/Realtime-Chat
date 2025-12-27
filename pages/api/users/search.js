// pages/api/users/search.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const me = getUserFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  const query = (req.query.query || '').toString().trim();

  if (!query) {
    return res.status(200).json({ users: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, avatar')
      .ilike('username', `%${query}%`)
      .limit(20);

    if (error) {
      console.error('users/search error:', error);
      return res.status(500).json({ error: 'db error', details: error.message });
    }

    return res.status(200).json({ users: data || [] });
  } catch (err) {
    console.error('users/search exception:', err);
    return res.status(500).json({ error: 'server error' });
  }
}
