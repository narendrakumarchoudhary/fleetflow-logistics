import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
export async function audit(req,{action,entity,entityId='',summary,metadata={}}){
  await AuditLog.create({...(req.tenantId?{tenantId:req.tenantId}:{}),actor:req.user?._id,actorName:req.user?.name||'System',action,entity,entityId:String(entityId||''),summary,metadata,ip:req.ip||''});
}
export async function notifyAdmins({title,message,type='info',link='',tenantId=null}){
  const User=(await import('../models/User.js')).default;
  const admins=await User.find({active:true,role:{$in:['admin','dispatcher']},...(tenantId?{tenantId}:{})}).select('_id').lean();
  if(admins.length) await Notification.insertMany(admins.map(u=>({...(tenantId?{tenantId}:{}),user:u._id,title,message,type,link})));
}
