// pages/api/conversations/index.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  const me = getUserFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      // 1) Find all conversation IDs where current user is a participant
      const { data: parts, error: partsErr } = await supabaseAdmin
        .from('participants')
        .select('conversation_id')
        .eq('user_id', me.id);

      if (partsErr) {
        console.error('GET /conversations participants error:', partsErr);
        return res.status(500).json({ error: 'db error', details: partsErr.message });
      }

      if (!parts || parts.length === 0) {
        return res.status(200).json({ conversations: [] });
      }

      const convIds = [...new Set(parts.map((p) => p.conversation_id))];
      const conversations = [];

      // 2) For each conversation, get basic info, other user and last message
      for (const convId of convIds) {
        // conversation row
        const { data: conv, error: convErr } = await supabaseAdmin
          .from('conversations')
          .select('id, name, is_group, created_at')
          .eq('id', convId)
          .single();

        if (convErr) {
          console.error('GET /conversations conv error:', convErr);
          continue;
        }

        // other participant (for one-to-one)
        const { data: otherParts, error: otherErr } = await supabaseAdmin
          .from('participants')
          .select('user_id, users(username)')
          .eq('conversation_id', convId)
          .neq('user_id', me.id);

        if (otherErr) {
          console.error('GET /conversations otherParts error:', otherErr);
        }

        const otherUser =
          otherParts && otherParts.length > 0 ? otherParts[0].users : null;

        // last message
        const { data: lastMsgs, error: lastErr } = await supabaseAdmin
          .from('messages')
          .select('id, content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lastErr) {
          console.error('GET /conversations lastMsgs error:', lastErr);
        }

        const lastMsg = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0] : null;

        conversations.push({
          id: conv.id,
          name: conv.name,
          is_group: conv.is_group,
          created_at: conv.created_at,
          other_username: otherUser ? otherUser.username : null,
          last_message: lastMsg ? lastMsg.content : null,
        });
      }

      return res.status(200).json({ conversations });
    } catch (err) {
      console.error('GET /conversations exception:', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { otherUserId } = req.body;
      if (!otherUserId) {
        return res.status(400).json({ error: 'otherUserId required' });
      }

      // 1) Ensure other user exists
      const { data: otherUser, error: otherErr } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .eq('id', otherUserId)
        .single();

      if (otherErr || !otherUser) {
        console.error('POST /conversations otherUser error:', otherErr);
        return res.status(404).json({ error: 'User not found' });
      }

      // 2) Check if a conversation between me and other already exists
      const { data: myParts, error: myPartsErr } = await supabaseAdmin
        .from('participants')
        .select('conversation_id')
        .eq('user_id', me.id);

      if (myPartsErr) {
        console.error('POST /conversations myPartsErr:', myPartsErr);
        return res.status(500).json({ error: 'db error', details: myPartsErr.message });
      }

      const myConvIds = myParts.map((p) => p.conversation_id);

      let existingConvId = null;

      if (myConvIds.length > 0) {
        const { data: sharedParts, error: sharedErr } = await supabaseAdmin
          .from('participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', myConvIds)
          .limit(1);

        if (sharedErr) {
          console.error('POST /conversations sharedErr:', sharedErr);
          return res.status(500).json({ error: 'db error', details: sharedErr.message });
        }

        if (sharedParts && sharedParts.length > 0) {
          existingConvId = sharedParts[0].conversation_id;
        }
      }

      let convId = existingConvId;

      // 3) If no existing, create new conversation + participants
      if (!convId) {
        const { data: newConv, error: newConvErr } = await supabaseAdmin
          .from('conversations')
          .insert({ is_group: false })
          .select('id')
          .single();

        if (newConvErr) {
          console.error('POST /conversations newConvErr:', newConvErr);
          return res.status(500).json({ error: 'db error', details: newConvErr.message });
        }

        convId = newConv.id;

        const { error: partsInsertErr } = await supabaseAdmin
          .from('participants')
          .insert([
            { conversation_id: convId, user_id: me.id },
            { conversation_id: convId, user_id: otherUserId },
          ]);

        if (partsInsertErr) {
          console.error('POST /conversations partsInsertErr:', partsInsertErr);
          return res.status(500).json({ error: 'db error', details: partsInsertErr.message });
        }
      }

      return res.status(200).json({
        id: convId,
        other_username: otherUser.username,
      });
    } catch (err) {
      console.error('POST /conversations exception:', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
