// frontend/pages/profile.js
import { useEffect, useState } from 'react';
import Router from 'next/router';

const API_HOST = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

function makeAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  return `${API_HOST}${avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath}`;
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadMe(); }, []);

  async function loadMe() {
    try {
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
      setUser(res.data.user);
    } catch (e) {
      console.error('load me error', e);
      Router.push('/login');
    }
  }

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function uploadAvatar(e) {
    e.preventDefault();
    if (!file) return alert('Choose an image first');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await axios.post(`${API_HOST}/api/users/me/avatar`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadMe();
      setFile(null); setPreview(null);
      alert('Avatar uploaded');
    } catch (err) {
      console.error('upload err', err);
      alert(err?.response?.data?.error || 'Upload failed');
    } finally { setBusy(false); }
  }

  async function removeAvatar() {
    if (!confirm('Remove your profile photo?')) return;
    setBusy(true);
    try {
      await axios.delete(`${API_HOST}/api/users/me/avatar`, { withCredentials: true });
      await loadMe();
      alert('Avatar removed');
    } catch (e) {
      console.error('remove avatar err', e);
      alert('Remove failed');
    } finally { setBusy(false); }
  }

  if (!user) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 20 }}>
      <h2>Profile</h2>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
        <div>
          {user.avatar ? (
            <img src={makeAvatarUrl(user.avatar)} alt="avatar" style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: 12, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              {user.username ? user.username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user.username}</div>
          <div style={{ color: '#666', marginTop: 6 }}>Member since: {new Date(user.created_at).toLocaleString()}</div>

          <div style={{ marginTop: 18 }}>
            <form onSubmit={uploadAvatar}>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} />
              {preview && <div style={{ marginTop: 12 }}><img src={preview} alt="preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} /></div>}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button type="submit" disabled={busy || !file} style={{ padding: '8px 12px' }}>{busy ? 'Uploading...' : 'Upload'}</button>
                <button type="button" onClick={() => { setFile(null); setPreview(null); }} style={{ padding: '8px 12px' }}>Cancel</button>
                {user.avatar && <button type="button" onClick={removeAvatar} style={{ padding: '8px 12px', background: '#fee' }}>Remove</button>}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div>
        <button onClick={() => Router.push('/chat')} style={{ padding: '8px 12px' }}>Back to Chat</button>
      </div>
    </div>
  );
}
