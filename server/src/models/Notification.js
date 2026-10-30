import mongoose from 'mongoose';
const schema=new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },user:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},title:{type:String,required:true,maxLength:120},message:{type:String,required:true,maxLength:500},type:{type:String,enum:['info','success','warning','danger'],default:'info'},readAt:{type:Date,default:null},link:{type:String,default:''}},{timestamps:true});schema.index({user:1,createdAt:-1});export default mongoose.model('Notification',schema);
