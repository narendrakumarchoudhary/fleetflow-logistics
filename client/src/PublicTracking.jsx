import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getError } from './lib/api';

export default function PublicTracking() {
  const { trackingNumber } = useParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async e => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.post(`/public/tracking/${encodeURIComponent(trackingNumber || '')}/request-otp`, { email });
      setSent(true); setMessage(result.data.message || 'If the details match, a verification code has been sent.');
    } catch (err) { setError(getError(err)); }
    finally { setBusy(false); }
  };
  const verifyCode = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api.post(`/public/tracking/${encodeURIComponent(trackingNumber || '')}/verify-otp`, { email, code });
      setRecord(result.data);
    } catch (err) { setError(getError(err)); }
    finally { setBusy(false); }
  };

  return <main className="login-screen" style={{display:'block',padding:'clamp(20px,5vw,64px)',minHeight:'100vh'}}>
    <section className="panel" style={{maxWidth:760,margin:'0 auto',padding:28}}>
      <div className="brand" style={{padding:0,marginBottom:25}}>fleet<span className="brand-light">flow</span></div>
      <div className="eyebrow">CUSTOMER SHIPMENT TRACKING</div>
      <h1 style={{margin:'8px 0 10px'}}>Track your consignment</h1>
      {!record && <><p className="muted">For privacy, verify using the email address registered with this shipment. The one-time code expires in 5 minutes.</p>
        <form onSubmit={requestCode} style={{maxWidth:440,marginTop:22}}>
          <label className="field">Registered email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/></label>
          <button className="btn btn-primary" disabled={busy}>{busy?'Sending…':'Send verification code'}</button>
        </form>
        {sent&&<form onSubmit={verifyCode} style={{maxWidth:440,marginTop:18}}>
          <p className="muted">{message}</p>
          <label className="field">6-digit verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000"/></label>
          <button className="btn btn-primary" disabled={busy||code.length!==6}>{busy?'Verifying…':'Verify and view tracking'}</button>
        </form>}
        {error&&<p className="login-error" role="alert">{error}</p>}
      </>}
      {record&&<><div className="detail-summary"><div><span>Tracking number</span><b>{record.trackingNumber}</b></div><div><span>Current status</span><b>{record.status}</b></div><div><span>Estimated delivery</span><b>{record.eta||'To be confirmed'}</b></div><div><span>Progress</span><b>{record.progress}%</b></div></div><div className="route-banner"><div><small>ORIGIN</small><b>{record.origin}</b></div><span>→</span><div><small>DESTINATION</small><b>{record.destination}</b></div></div><h3>Shipment updates</h3><div className="timeline">{(record.events||[]).slice().reverse().map((event,i)=><div className="timeline-event" key={event._id||i}><i/><div><b>{event.status}</b><small>{event.location||'Location not provided'} · {new Date(event.occurredAt||event.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</small>{event.note&&<p>{event.note}</p>}</div></div>)}</div>{record.pod?.deliveredAt&&<p className="muted" style={{marginTop:20}}>Delivery recorded on {new Date(record.pod.deliveredAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</p>}<button className="btn btn-ghost" style={{marginTop:20}} onClick={()=>{setRecord(null);setCode('');setSent(false)}}>Track another shipment</button></>}
    </section>
  </main>;
}
