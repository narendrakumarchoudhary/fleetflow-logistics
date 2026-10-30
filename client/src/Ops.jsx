import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, getError } from './lib/api';

const sections = [
  ['maintenance', 'Vehicle maintenance'], ['compliance', 'Document compliance'], ['fuel', 'Fuel ledger'], ['attendance', 'Driver attendance'],
  ['invoices', 'Invoices & GST'], ['pod', 'Proof of delivery'], ['notifications', 'Notifications'], ['audit', 'Audit trail'], ['users', 'User access']
];
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const date = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function Operations({ notify, user, mode = 'demo' }) {
  const location = useLocation();
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get('tab') || 'maintenance');
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [users, setUsers] = useState([]);
  const [unread, setUnread] = useState(0);
  const [podFile, setPodFile] = useState(null);

  const load = useCallback(async () => {
    if (mode !== 'api') return;
    setBusy(true); setError('');
    try {
      const requests = [api.get('/vehicles'), api.get('/drivers'), api.get('/shipments?limit=100')];
      const [v, d, s] = await Promise.allSettled(requests);
      if (v.status === 'fulfilled') setVehicles(v.value.data.vehicles || []);
      if (d.status === 'fulfilled') setDrivers(d.value.data.drivers || []);
      if (s.status === 'fulfilled') setShipments(s.value.data.shipments || []);
      const failed = [v, d, s].find(result => result.status === 'rejected');
      if (failed) throw failed.reason;
      const endpoint = ({ maintenance: '/operations/maintenance', compliance: '/vehicles/expiring-documents?days=60', fuel: '/operations/fuel', attendance: '/people/attendance', invoices: '/operations/invoices', pod: '/shipments?limit=100', notifications: '/operations/notifications', audit: '/operations/audit', users: '/people/users' })[tab];
      const result = await api.get(endpoint);
      if (tab === 'users') setUsers(result.data.users || []);
      else if (tab === 'pod') setItems((result.data.shipments || []).filter(x => x.pod?.receiverName));
      else if (tab === 'compliance') setItems(result.data.items || []);
      else if (tab === 'notifications') { setItems(result.data.items || []); setUnread(result.data.unread || 0); }
      else setItems(result.data.items || []);
    } catch (e) { setError(getError(e)); }
    finally { setBusy(false); }
  }, [tab, mode]);

  useEffect(() => { const requested = new URLSearchParams(location.search).get('tab'); if (sections.some(([key]) => key === requested)) setTab(requested); }, [location.search]);
  useEffect(() => { load(); }, [load]);
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (tab === 'compliance') { const vehicle = vehicles.find(v => v.registration === form.vehicle); if (!vehicle) throw new Error('Select a registered vehicle'); const documents = [...(vehicle.documents || []), { kind: form.kind, number: form.number || '', expiresAt: form.expiresAt || undefined, documentUrl: form.documentUrl || '' }]; await api.patch(`/vehicles/${vehicle._id}/documents`, { documents }); }
      if (tab === 'maintenance') await api.post('/operations/maintenance', { ...form, cost: form.cost || 0, odometerKm: form.odometerKm || 0 });
      if (tab === 'fuel') await api.post('/operations/fuel', { ...form, quantityLitres: Number(form.quantityLitres), pricePerLitre: Number(form.pricePerLitre), odometerKm: Number(form.odometerKm || 0) });
      if (tab === 'attendance') await api.post('/people/attendance', { ...form, date: form.date || new Date().toISOString(), status: form.status || 'Present' });
      if (tab === 'invoices') await api.post('/operations/invoices', { ...form, lines: [{ description: form.description || 'Freight and handling', quantity: Number(form.quantity || 1), unitPrice: Number(form.unitPrice || 0) }], gstRate: Number(form.gstRate || 0) });
      if (tab === 'pod') { let payload = { ...form }; if (podFile) { const body = new FormData(); body.append('file', podFile); const uploaded = await api.post('/uploads', body); payload.documentUrl = uploaded.data.file.url; } await api.post(`/operations/shipments/${form.shipmentId}/pod`, payload); setPodFile(null); }
      if (tab === 'users') await api.post('/people/users', form);
      setForm({}); notify('Record saved successfully'); await load();
    } catch (e) { setError(getError(e)); }
    finally { setBusy(false); }
  };
  const patch = async (path, body) => { try { await api.patch(path, body); notify('Update saved'); await load(); } catch (e) { setError(getError(e)); } };
  const downloadDocument = async (url) => { try { const filename = String(url).split('/').pop().split('?')[0]; const response = await api.get(`/uploads/${encodeURIComponent(filename)}`, { responseType: 'blob' }); const objectUrl = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = objectUrl; link.download = filename; link.click(); URL.revokeObjectURL(objectUrl); } catch (e) { setError(getError(e)); } };
  const field = (key, label, type = 'text', required = true, extra = {}) => <label className="form-field" key={key}>{label}<input type={type} required={required} value={form[key] ?? ''} onChange={e => update(key, e.target.value)} {...extra}/></label>;
  const select = (key, label, options, required = true) => <label className="form-field" key={key}>{label}<select required={required} value={form[key] ?? ''} onChange={e => update(key, e.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select></label>;
  const formFields = () => {
    if (tab === 'compliance') return <>{select('vehicle','Vehicle',vehicles.map(v => v.registration))}{select('kind','Document type',['RC','Insurance','Fitness','Permit','PUC','Other'])}{field('number','Document number','text',false)}{field('expiresAt','Expiry date','date',false)}{field('documentUrl','Document URL','url',false)}<label className="form-field">Attach document (PDF/JPG/PNG/WEBP, max 10 MB)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const body=new FormData();body.append('file',file);const result=await api.post('/uploads',body);update('documentUrl',result.data.file.url);notify('Document uploaded');}catch(err){setError(getError(err));}}}/></label></>;
    if (tab === 'maintenance') return <>{select('vehicle', 'Vehicle', vehicles.map(v => v.registration))}{select('type', 'Work type', ['Scheduled service','Repair','Tyre','Inspection','Other'], false)}{field('description','Work description')}{field('vendor','Workshop / vendor','text',false)}{field('cost','Estimated cost (₹)','number',false,{min:0})}{field('odometerKm','Odometer (km)','number',false,{min:0})}{field('scheduledAt','Scheduled date','date',false)}</>;
    if (tab === 'fuel') return <>{select('vehicle','Vehicle',vehicles.map(v => v.registration))}{field('quantityLitres','Fuel quantity (litres)','number',true,{min:.01,step:.01})}{field('pricePerLitre','Price per litre (₹)','number',true,{min:0,step:.01})}{field('odometerKm','Odometer (km)','number',false,{min:0})}{field('station','Fuel station','text',false)}{field('filledAt','Filled on','datetime-local',false)}</>;
    if (tab === 'attendance') return <>{select('driverId','Driver',drivers.map(d => ({ value:d._id, label:d.name })))}{field('date','Attendance date','date',true)}{select('status','Attendance',['Present','Absent','Leave','Half day'])}{field('checkIn','Check in','datetime-local',false)}{field('checkOut','Check out','datetime-local',false)}{field('notes','Notes','text',false)}</>;
    if (tab === 'invoices') return <>{select('shipmentId','Shipment',shipments.map(s => ({ value:s._id, label:`${s.trackingNumber} · ${s.customer}` })))}{field('gstin','Customer GSTIN','text',false,{maxLength:20})}{field('description','Invoice line description','text',true)}{field('quantity','Quantity','number',true,{min:.01,step:.01})}{field('unitPrice','Unit price (₹)','number',true,{min:0,step:.01})}{field('gstRate','GST rate (%)','number',false,{min:0,max:100,step:.1})}{field('dueDate','Due date','date',false)}</>;
    if (tab === 'pod') return <>{select('shipmentId','Shipment',shipments.filter(s => ['In Transit','Out for Delivery'].includes(s.status)).map(s => ({ value:s._id, label:`${s.trackingNumber} · ${s.customer}` })))}{field('receiverName','Received by')}{field('receiverPhone','Receiver phone','tel',false)}{field('notes','Delivery notes','text',false)}{field('documentUrl','POD document URL','url',false)}<label className="form-field">Attach POD file (PDF/JPG/PNG/WEBP, max 10 MB)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setPodFile(e.target.files?.[0]||null)}/></label>{field('signatureUrl','Signature URL','url',false)}</>;
    if (tab === 'users') return <>{field('name','Full name')}{field('email','Work email','email')}{field('password','Temporary password','password',true,{minLength:12})}{select('role','Role',['admin','dispatcher','operator','viewer','customer'])}</>;
    return null;
  };
  const isManager = ['admin','dispatcher'].includes(user?.role);
  const canCreate = (['maintenance','compliance','attendance','invoices'].includes(tab) && isManager) || (['fuel','pod'].includes(tab) && ['admin','dispatcher','operator'].includes(user?.role)) || (tab === 'users' && user?.role === 'admin');
  const heading = sections.find(x => x[0] === tab)?.[1];
  if (mode !== 'api') return <div className="panel"><h2>Operations centre requires backend access</h2><p className="muted">Sign in through the FleetFlow API to manage maintenance, fuel, attendance, invoices, proof of delivery, audit records and user access. The local demo keeps data in this browser and does not write to MongoDB.</p></div>;
  return <><div className="page-heading"><div><div className="eyebrow">OPERATIONS / CONTROL CENTRE</div><h1>Operations centre</h1><p>Maintain fleet assets, fuel costs, driver attendance, billing and operational accountability.</p></div><button className="btn btn-ghost" onClick={load}>Refresh records</button></div>
    <div className="panel" style={{marginBottom:18}}><div className="toolbar" style={{display:'flex',flexWrap:'wrap',gap:8}}>{sections.filter(([key]) => key !== 'users' || user?.role === 'admin').filter(([key]) => key !== 'audit' || ['admin','dispatcher'].includes(user?.role)).filter(([key]) => key !== 'attendance' || isManager).map(([key,label])=><button key={key} className={`btn ${tab===key?'btn-primary':'btn-ghost'}`} onClick={()=>{setTab(key);setForm({});}}>{label}</button>)}</div></div>
    <div className="panel"><div className="panel-head"><div><h3>{heading}</h3><p>Records are loaded from the authenticated FleetFlow API.</p></div><span className="updated">{busy?'Working…':`${tab==='users'?users.length:items.length} records`}</span></div>
      {error&&<div className="login-error" role="alert">{error}</div>}
      {canCreate&&<form onSubmit={submit} className="form-grid" style={{marginBottom:22}}><div className="form-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>{formFields()}</div><div className="form-actions"><button className="btn btn-primary" disabled={busy}>Save {tab==='pod'?'proof of delivery':tab==='users'?'user':'record'}</button></div></form>}
      {tab==='compliance'&&<><p className="muted">Documents expiring within the next 60 days. Add or update the document register above.</p><DataTable headers={['Vehicle','Document','Number','Expiry date','Document link']} rows={items.map(x=>[x.vehicle,x.kind,x.number||'—',date(x.expiresAt),x.documentUrl?<button type="button" className="btn btn-ghost" onClick={()=>downloadDocument(x.documentUrl)}>Download document</button>:'—'])}/></>}
      {tab==='maintenance'&&<DataTable headers={isManager?['Vehicle','Work','Vendor','Cost','Scheduled','Status','Action']:['Vehicle','Work','Vendor','Cost','Scheduled','Status']} rows={items.map(x=>[x.vehicle,x.description,x.vendor||'—',money(x.cost),date(x.scheduledAt),x.status,...(isManager?[<select value={x.status} onChange={e=>patch(`/operations/maintenance/${x._id}`,{status:e.target.value})}><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select>]:[])])}/> }
      {tab==='fuel'&&<><p className="muted">Total fuel: {(items.reduce((n,x)=>n+Number(x.quantityLitres||0),0)).toFixed(2)} L · Total spend: {money(items.reduce((n,x)=>n+Number(x.totalCost||0),0))}</p><DataTable headers={['Vehicle','Litres','Rate','Total cost','Odometer','Station','Date']} rows={items.map(x=>[x.vehicle,x.quantityLitres, money(x.pricePerLitre),money(x.totalCost),`${x.odometerKm||0} km`,x.station||'—',date(x.filledAt)])}/></>}
      {tab==='attendance'&&<DataTable headers={['Driver','Date','Status','Check in','Check out','Notes']} rows={items.map(x=>[x.driverName||x.driver?.name||'—',date(x.date),x.status,date(x.checkIn),date(x.checkOut),x.notes||'—'])}/>}
      {tab==='invoices'&&<DataTable headers={isManager?['Invoice','Customer','Shipment','Subtotal','GST','Total','Paid','Status','Action']:['Invoice','Customer','Shipment','Subtotal','GST','Total','Paid','Status']} rows={items.map(x=>[x.invoiceNumber,x.customer,x.shipment?.trackingNumber||'—',money(x.subtotal),money(x.gstAmount),money(x.total),money(x.paidAmount),x.status,...(isManager?[<div style={{display:'grid',gap:6}}><select value={x.status} onChange={e=>patch(`/operations/invoices/${x._id}`,{status:e.target.value})}><option>Draft</option><option>Issued</option><option>Overdue</option><option>Void</option></select>{!['Paid','Void'].includes(x.status)&&<button className="btn btn-ghost" onClick={async()=>{const raw=window.prompt(`Outstanding: ${money(x.total-x.paidAmount)}. Enter payment amount in INR`);if(raw===null)return;const amount=Number(raw);if(!Number.isFinite(amount)||amount<=0){notify('Enter a valid payment amount');return;}try{await api.post(`/operations/invoices/${x._id}/payments`,{amount,method:'UPI'});notify('Payment recorded');await load();}catch(e){setError(getError(e));}}}>Record payment</button>}</div>]:[])])}/> }
      {tab==='pod'&&<><p className="muted">Proof of delivery is stored against the shipment and changes its status to Delivered.</p><DataTable headers={['Tracking no.','Customer','Receiver','Delivered at','Notes']} rows={items.map(x=>[x.trackingNumber,x.customer,x.pod?.receiverName||'—',date(x.pod?.deliveredAt),x.pod?.notes||'—'])}/></>}
      {tab==='notifications'&&<><p className="muted">Unread notifications: {unread}</p><div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}><button className="btn btn-ghost" onClick={()=>patch('/operations/notifications/read-all',{})}>Mark all read</button></div><DataTable headers={['Notification','Message','Type','Date','Action']} rows={items.map(x=>[x.title,x.message,x.type,date(x.createdAt),x.readAt?'Read':<button className="btn btn-ghost" onClick={()=>patch(`/operations/notifications/${x._id}/read`,{})}>Mark read</button>])}/></>}
      {tab==='audit'&&<DataTable headers={['Action','Entity','Summary','User','IP','Date']} rows={items.map(x=>[x.action,x.entity,x.summary,x.actor?.name||x.actorName||'System',x.ip||'—',date(x.createdAt)])}/>}
      {tab==='users'&&<DataTable headers={['Name','Email','Role','Account review','Status','Action']} rows={users.map(x=>[x.name,x.email,x.role,x.role==='customer'?(x.onboardingStatus||'pending'):'—',x.active?'Active':'Disabled',<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{x.role==='customer'&&x.onboardingStatus!=='approved'&&<button className="btn btn-primary" onClick={()=>patch(`/people/users/${x._id}`,{onboardingStatus:'approved',active:true})}>Approve</button>}{x.role==='customer'&&x.onboardingStatus!=='rejected'&&<button className="btn btn-ghost" onClick={()=>patch(`/people/users/${x._id}`,{onboardingStatus:'rejected',active:false})}>Reject</button>}<select value={x.role} onChange={e=>patch(`/people/users/${x._id}`,{role:e.target.value})}><option>admin</option><option>dispatcher</option><option>operator</option><option>viewer</option><option>customer</option></select><button className="btn btn-ghost" onClick={()=>patch(`/people/users/${x._id}`,{active:!x.active})}>{x.active?'Disable':'Enable'}</button>{String(x._id)!==String(user?.id)&&<button className="btn btn-ghost" onClick={async()=>{const password=window.prompt('Set a temporary password (at least 12 characters)');if(!password)return;try{await api.patch(`/people/users/${x._id}/password`,{password});notify('Password reset; existing sessions revoked');}catch(e){setError(getError(e));}}}>Reset password</button>}</div>])}/>}
      {!busy&&tab!=='users'&&!items.length&&<div className="empty-state">No records yet. Use the form above to create the first record.</div>}
    </div>
  </>;
}
function DataTable({headers,rows}) { return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="empty-state">No records found.</div>}</div>; }
