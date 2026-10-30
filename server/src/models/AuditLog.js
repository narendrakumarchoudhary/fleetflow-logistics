import mongoose from 'mongoose';
const schema=new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},actorName:{type:String,default:''},action:{type:String,required:true,index:true},entity:{type:String,required:true,index:true},entityId:{type:String,default:''},summary:{type:String,required:true,maxLength:300},metadata:{type:mongoose.Schema.Types.Mixed,default:{}},ip:{type:String,default:''}},{timestamps:true});schema.index({createdAt:-1});export default mongoose.model('AuditLog',schema);
