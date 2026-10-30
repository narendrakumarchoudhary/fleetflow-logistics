import mongoose from 'mongoose';
const schema=new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },name:{type:String,required:true,trim:true,maxLength:100},phone:{type:String,trim:true,maxLength:40,default:''},email:{type:String,trim:true,lowercase:true,maxLength:254,default:''},license:{type:String,required:true,trim:true,maxLength:80,index:true},status:{type:String,enum:['Available','On duty','Off duty','On leave'],default:'Available'},vehicle:{type:String,trim:true,uppercase:true,default:''},active:{type:Boolean,default:true}},{timestamps:true});
schema.index({name:1,status:1});schema.index({tenantId:1,license:1},{unique:true,partialFilterExpression:{tenantId:{$exists:true}}});export default mongoose.model('Driver',schema);
