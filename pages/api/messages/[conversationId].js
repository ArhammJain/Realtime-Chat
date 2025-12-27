// frontend/pages/api/messages/[conversationId].js
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  const me = getUserFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  const conversationId = parseInt(req.query.conversationId, 10);
  if (!conversationId) {
    return res.status(400).json({ error: 'Invalid conversationId' });
  }

  // ensure user is a participant of the conversation
  const { data: part, error: partErr } = await supabaseAdmin
    .from('participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', me.id)
    .maybeSingle();

  if (partErr) {
    console.error('messages participant error:', partErr);
    return res.status(500).json({ error: 'db error', details: partErr.message });
  }

  if (!part) {
    return res.status(403).json({ error: 'Not a participant' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('id, sender_id, content, created_at, users ( username )')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('GET /messages error:', error);
        return res.status(500).json({ error: 'db error', details: error.message });
      }

      const mapped = (data || []).map((m) => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        sender_username: m.users?.username || null,
      }));

      return res.status(200).json({ messages: mapped });
    } catch (err) {
      console.error('GET /messages exception:', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content required' });
      }

      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: me.id,
          content: content.trim(),
          type: 'text',
        })
        .select('id, sender_id, content, created_at')
        .single();

      if (error) {
        console.error('POST /messages error:', error);
        return res.status(500).json({ error: 'db error', details: error.message });
      }

      const message = {
        ...data,
        sender_username: me.username,
      };

      return res.status(200).json({ message });
    } catch (err) {
      console.error('POST /messages exception:', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
