// frontend/pages/chat.js
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

// --- UI Component: Avatar ---
function Avatar({ name, size = 40, color }) {
  const initial = name && name[0] ? name[0].toUpperCase() : '?';
  const bg = color || '#3B82F6'; 
  
  return (
    <div className="avatar">
      {initial}
      <style jsx>{`
        .avatar {
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${bg};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: ${size * 0.45}px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
          user-select: none;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();

  // --- State & Logic (Unchanged) ---
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Typing state
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messagesRef = useRef(null);
  const activeConvRef = useRef(null);
  const searchRef = useRef(null);
  const presenceChannelRef = useRef(null);

  // --- Effects (Unchanged) ---
  useEffect(() => {
    setMounted(true);
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
        if (res.status !== 200) { router.replace('/login'); return; }
        const data = await res.json();
        setUser(data.user);
        await loadConversations(true);
      } catch (err) {
        console.error('init error', err);
        router.replace('/login');
      } finally { setLoadingInitial(false); }
    };
    init();
  }, [router]);

  useEffect(() => {
    activeConvRef.current = activeConv?.id ?? null;
    if (activeConv && typeof window !== 'undefined' && window.innerWidth <= 860) {
      setSidebarOpen(false);
    }
    setIsTyping(false); 
  }, [activeConv]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!searchQ.trim()) { setSearchResults([]); return; }
      (async () => {
        try {
          const res = await fetch(`/api/users/search?query=${encodeURIComponent(searchQ)}`, { credentials: 'include' });
          if (!res.ok) return;
          const data = await res.json();
          const users = data.users || data || [];
          setSearchResults(users.filter((u) => u.id !== user?.id));
        } catch (e) { console.error(e); }
      })();
    }, 220);
    return () => clearTimeout(t);
  }, [searchQ, user]);

  // --- Logic Functions (Unchanged) ---
  async function loadConversations(autoOpenFirst = false) {
    try {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const convs = data.conversations || data || [];
      setConversations(convs);
      if (autoOpenFirst && convs.length > 0) {
        const first = convs[0];
        await openConversation({
          id: first.id,
          other_username: first.other_username,
          name: first.name || first.other_username || `#${first.id}`,
        });
      }
    } catch (e) { console.error(e); }
  }

  async function openConversation(convInfo) {
    const convId = convInfo.id;
    const name = convInfo.other_username || convInfo.name || `#${convId}`;
    setActiveConv({ id: convId, name });
    setMessages([]);
    try {
      const res = await fetch(`/api/messages/${convId}`, { credentials: 'include' });
      if (!res.ok) { alert('Could not load messages'); return; }
      const data = await res.json();
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (e) { alert('Could not load messages'); }
    loadConversations().catch(() => {});
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 40);
  }

  async function onUserClick(u) {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: u.id }),
      });
      if (!res.ok) { alert('Could not open conversation'); return; }
      const data = await res.json();
      await openConversation({ id: data.id, other_username: data.other_username || u.username });
      setSearchQ('');
      setSearchResults([]);
      loadConversations().catch(() => {});
    } catch (e) { alert('Could not open conversation'); }
  }

  async function sendMessage(conversationId, content) {
    if (!conversationId || !content || !user) return;
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) { alert('Could not send message'); return; }
      const data = await res.json();
      const msg = data.message || data;
      const msgWithName = { ...msg, sender_username: user.username };
      setMessages((prev) => {
        if (prev.some((x) => x.id === msgWithName.id)) return prev;
        return [...prev, msgWithName];
      });
      
      // Stop typing broadcasting immediately after sending
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({ user_id: user.id, username: user.username, typing: false });
      }
      scrollToBottom();
    } catch (e) { alert('Could not send message'); }
  }

  async function handleSend(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!text.trim() || !activeConv) return;
    const content = text;
    setText('');
    await sendMessage(activeConv.id, content);
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setText(value);
    if (!activeConv || !user || !presenceChannelRef.current) return;
    if (typingTimeout) clearTimeout(typingTimeout);

    if (value.trim()) {
      presenceChannelRef.current.track({ user_id: user.id, username: user.username, typing: true });
      const timeout = setTimeout(() => {
        if (presenceChannelRef.current) {
          presenceChannelRef.current.track({ user_id: user.id, username: user.username, typing: false });
        }
      }, 2000);
      setTypingTimeout(timeout);
    } else {
      presenceChannelRef.current.track({ user_id: user.id, username: user.username, typing: false });
    }
  }

  async function doLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
    router.replace('/login');
  }

  // --- Subscriptions (Unchanged) ---
  useEffect(() => {
    if (!activeConv?.id || !user) return;
    const convId = activeConv.id;
    const channel = supabase.channel(`messages_conv_${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` }, (payload) => {
          const m = payload.new;
          if (!m) return;
          const mine = m.sender_id === user.id;
          const msgWithName = { id: m.id, sender_id: m.sender_id, content: m.content, created_at: m.created_at, sender_username: mine ? user.username : activeConv.name };
          setMessages((prev) => {
            if (prev.some((x) => x.id === msgWithName.id)) return prev;
            return [...prev, msgWithName];
          });
          setIsTyping(false);
          scrollToBottom();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id, user, activeConv?.name]);

  useEffect(() => {
    if (!activeConv?.id || !user) return;
    const convId = activeConv.id;
    const channel = supabase.channel(`presence_conv_${convId}`, { config: { presence: { key: user.id.toString() } } });
    presenceChannelRef.current = channel;
    channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserTyping = Object.values(state).some((presences) => presences.some((presence) => presence.user_id !== user.id && presence.typing === true));
        setIsTyping(otherUserTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, username: user.username, typing: false });
        }
      });
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      channel.untrack();
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
    };
  }, [activeConv?.id, user]);

  if (!mounted || loadingInitial) return <div className="loading-screen">Loading Application...</div>;
  if (!user) return null;

  // --- Render UI ---
  return (
    <div className="app-shell">
      
      {/* Sidebar Panel */}
      <aside className={`sidebar-panel ${sidebarOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-header">
          <h2 className="brand-logo">ChatApp</h2>
          {typeof window !== 'undefined' && window.innerWidth <= 860 && (
             <button onClick={() => setSidebarOpen(false)} className="close-sidebar-btn">✕</button>
          )}
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
             <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
             <input 
                ref={searchRef}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search people..." 
                className="search-input" 
             />
          </div>
        </div>

        <div className="conversation-list">
          {searchResults.length > 0 && <div className="list-heading">Search Results</div>}
          
          {searchResults.map((u) => (
            <div key={u.id} className="nav-item" onClick={() => onUserClick(u)}>
              <Avatar name={u.username} size={40} color="#10B981" />
              <div className="nav-item-content">
                <div className="nav-item-title">{u.username}</div>
                <div className="nav-item-subtitle">Start a conversation</div>
              </div>
            </div>
          ))}

          {searchResults.length === 0 && conversations.map((conv) => (
            <div 
              key={conv.id} 
              className={`nav-item ${activeConv?.id === conv.id ? 'active' : ''}`}
              onClick={() => openConversation({ id: conv.id, other_username: conv.other_username, name: conv.name })}
            >
              <Avatar name={conv.other_username || conv.name} size={42} color={activeConv?.id === conv.id ? '#1D56CF' : '#6B7280'} />
              <div className="nav-item-content">
                <div className="nav-item-header">
                  <span className="nav-item-title">{conv.other_username || conv.name || `#${conv.id}`}</span>
                </div>
                <div className="nav-item-subtitle">
                  {conv.last_message || 'No messages yet'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
           <div className="user-block">
              <Avatar name={user.username} size={36} color="#1F2937" />
              <div className="user-block-info">
                 <span className="user-block-name">{user.username}</span>
                 <button onClick={doLogout} className="logout-btn">Log out</button>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
           <button className="mobile-menu-trigger" onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
           </button>
           
           <div className="chat-header-info">
              <h3 className="chat-recipient-name">{activeConv ? activeConv.name : 'Inbox'}</h3>
              {activeConv && <div className="active-indicator">Active Now</div>}
           </div>
        </header>

        <div className="messages-container" ref={messagesRef}>
          {!activeConv && (
             <div className="welcome-state">
                <div className="welcome-icon">💬</div>
                <h3>Welcome to Messages</h3>
                <p>Select a conversation to start chatting.</p>
             </div>
          )}

          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            const senderName = m.sender_username || (mine ? user?.username : 'User');
            return (
              <div key={m.id} className={`message-group ${mine ? 'mine' : 'theirs'}`}>
                 {!mine && (
                   <div className="message-avatar-col">
                      <Avatar name={senderName} size={32} color="#9CA3AF" />
                   </div>
                 )}
                 <div className="message-content-col">
                    {!mine && <div className="sender-label">{senderName}</div>}
                    <div className="message-bubble">{m.content}</div>
                 </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {activeConv && isTyping && (
             <div className="message-group theirs typing-group">
                <div className="message-avatar-col">
                   <Avatar name={activeConv.name} size={32} color="#9CA3AF" />
                </div>
                <div className="message-content-col">
                   <div className="sender-label">{activeConv.name} is typing...</div>
                   <div className="message-bubble typing-bubble">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                   </div>
                </div>
             </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={(e) => { e.preventDefault(); handleSend(e); }}>
           <div className="input-row">
              <input 
                 className="chat-input"
                 value={text}
                 onChange={handleInputChange}
                 placeholder={activeConv ? `Message ${activeConv.name}...` : 'Select a chat'}
                 disabled={!activeConv}
              />
              <button className="send-btn" type="submit" disabled={!activeConv || !text.trim()}>
                 <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
           </div>
        </form>
      </main>

      {/* --- STYLES --- */}
      <style jsx global>{`
        /* Reset & Variables */
        :root {
          --gray-50: #F9FAFB;
          --gray-100: #F3F4F6;
          --gray-200: #E5E7EB;
          --gray-300: #D1D5DB;
          --gray-400: #9CA3AF;
          --gray-500: #6B7280;
          --gray-800: #1F2937;
          --gray-900: #111827;
          
          --blue-primary: #1D56CF;
          --blue-hover: #16429F;
          
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }

        html, body, #__next {
          height: 100%; margin: 0; padding: 0;
          font-family: var(--font-sans);
          background-color: var(--gray-50);
          color: var(--gray-900);
          overflow: hidden;
        }

        .loading-screen {
          height: 100vh; display: flex; align-items: center; justify-content: center;
          color: var(--gray-500); font-weight: 500;
        }

        .app-shell {
          display: flex; height: 100vh; width: 100vw;
        }

        /* --- Sidebar --- */
        .sidebar-panel {
          width: 320px; background: #fff; border-right: 1px solid var(--gray-200);
          display: flex; flex-direction: column; flex-shrink: 0; z-index: 20;
          transition: transform 0.3s ease;
        }

        .sidebar-header {
          height: 64px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid transparent;
        }
        .brand-logo { font-size: 20px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; margin: 0; }
        .close-sidebar-btn { background: none; border: none; font-size: 20px; color: var(--gray-500); cursor: pointer; }

        .search-container { padding: 0 16px 16px 16px; }
        .search-input-wrapper {
          position: relative; color: var(--gray-400); display: flex; align-items: center;
        }
        .search-input-wrapper svg { position: absolute; left: 12px; }
        .search-input {
          width: 100%; padding: 10px 12px 10px 36px;
          background: var(--gray-100); border: 1px solid transparent; border-radius: 8px;
          font-size: 14px; color: var(--gray-900); outline: none; transition: all 0.2s;
        }
        .search-input:focus { background: #fff; border-color: var(--gray-300); box-shadow: 0 0 0 3px rgba(0,0,0,0.03); }

        .conversation-list { flex: 1; overflow-y: auto; padding: 0 12px; }
        .list-heading { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--gray-500); margin: 8px 4px; letter-spacing: 0.05em; }

        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 10px; margin-bottom: 4px;
          border-radius: 12px; cursor: pointer; transition: background 0.15s;
        }
        .nav-item:hover { background: var(--gray-50); }
        .nav-item.active { background: #EFF6FF; }
        
        .nav-item-content { flex: 1; overflow: hidden; min-width: 0; }
        .nav-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .nav-item-title { font-size: 14px; font-weight: 600; color: var(--gray-900); truncate; }
        .nav-item-subtitle { font-size: 13px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

        .sidebar-footer {
          padding: 16px 20px; border-top: 1px solid var(--gray-200); background: #fff;
        }
        .user-block { display: flex; align-items: center; gap: 10px; }
        .user-block-info { display: flex; flex-direction: column; }
        .user-block-name { font-size: 14px; font-weight: 600; color: var(--gray-900); }
        .logout-btn { background: none; border: none; padding: 0; text-align: left; font-size: 12px; color: var(--gray-500); cursor: pointer; margin-top: 2px; }
        .logout-btn:hover { color: var(--blue-primary); text-decoration: underline; }

        /* --- Main Chat --- */
        .chat-main {
          flex: 1; display: flex; flex-direction: column; background: var(--gray-50); position: relative;
        }

        .chat-header {
          height: 64px; padding: 0 24px; background: #fff; border-bottom: 1px solid var(--gray-200);
          display: flex; align-items: center; gap: 16px; flex-shrink: 0;
        }
        .mobile-menu-trigger { display: none; background: none; border: none; color: var(--gray-900); cursor: pointer; padding: 0; }
        .chat-recipient-name { font-size: 16px; font-weight: 700; margin: 0; color: var(--gray-900); }
        .active-indicator { font-size: 12px; font-weight: 500; color: #10B981; background: #ECFDF5; padding: 2px 8px; border-radius: 12px; margin-left: auto; }

        .messages-container {
          flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;
        }

        .welcome-state { margin: auto; text-align: center; color: var(--gray-500); }
        .welcome-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.8; }

        .message-group { display: flex; gap: 12px; max-width: 650px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .message-group.mine { align-self: flex-end; flex-direction: row-reverse; }
        .message-avatar-col { display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 2px; }
        
        .message-content-col { display: flex; flex-direction: column; max-width: 100%; }
        .sender-label { font-size: 11px; color: var(--gray-500); margin-bottom: 4px; margin-left: 4px; }
        .message-group.mine .sender-label { text-align: right; margin-right: 4px; }

        .message-bubble {
          padding: 12px 16px; border-radius: 18px; font-size: 15px; line-height: 1.5;
          position: relative; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        
        .message-group.mine .message-bubble {
          background: var(--blue-primary); color: white;
          border-bottom-right-radius: 4px;
        }
        .message-group.theirs .message-bubble {
          background: #fff; color: var(--gray-900); border: 1px solid var(--gray-200);
          border-bottom-left-radius: 4px;
        }

        /* Typing Animation */
        .typing-bubble { padding: 14px 20px; display: flex; gap: 4px; align-items: center; width: fit-content; }
        .typing-dot { width: 6px; height: 6px; background: var(--gray-400); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* Composer */
        .chat-composer {
          padding: 20px 24px; background: #fff; border-top: 1px solid var(--gray-200);
        }
        .input-row {
          display: flex; gap: 12px; align-items: flex-end; background: var(--gray-50);
          border: 1px solid var(--gray-200); border-radius: 24px; padding: 6px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-row:focus-within {
           background: #fff; border-color: var(--blue-primary); box-shadow: 0 0 0 3px rgba(29, 86, 207, 0.1);
        }
        
        .chat-input {
          flex: 1; border: none; background: transparent; padding: 10px 14px;
          font-size: 15px; color: var(--gray-900); outline: none; min-height: 24px;
        }
        
        .send-btn {
          width: 36px; height: 36px; border-radius: 50%; border: none;
          background: var(--blue-primary); color: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) { background: var(--blue-hover); transform: scale(1.05); }
        .send-btn:disabled { background: var(--gray-300); cursor: not-allowed; }

        /* Mobile Responsive */
        @media (max-width: 860px) {
          .sidebar-panel {
            position: absolute; left: 0; top: 0; bottom: 0;
            transform: translateX(-100%); box-shadow: 10px 0 25px rgba(0,0,0,0.1);
          }
          .mobile-visible { transform: translateX(0); }
          .mobile-menu-trigger { display: block; }
          .message-group { max-width: 85%; }
        }
      `}</style>
    </div>
  );
}