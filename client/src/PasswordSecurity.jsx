import React, { useState } from 'react';
import { api, getError } from './lib/api';

export default function PasswordSecurity({ notify }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    try { const result = await api.post('/auth/change-password', { currentPassword, newPassword }); localStorage.setItem('fleetflow_token', result.data.token); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); notify(result.data.message); }
    catch (err) { setError(getError(err)); }
    finally { setBusy(false); }
  };
  return <section className="panel settings-panel"><div className="panel-head"><div><h3>Account security</h3><p>Change your password and revoke other active sessions.</p></div></div>{error&&<div className="login-error">{error}</div>}<form onSubmit={submit}><label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label><label>New password<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label><button className="btn btn-primary" disabled={busy}>{busy?'Updating…':'Change password'}</button></form></section>;
}
