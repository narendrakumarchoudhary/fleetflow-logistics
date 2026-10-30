import mongoose from 'mongoose';
const schema=new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },vehicle:{type:String,required:true,index:true,uppercase:true,trim:true},quantityLitres:{type:Number,required:true,min:0.01},pricePerLitre:{type:Number,required:true,min:0},totalCost:{type:Number,required:true,min:0},odometerKm:{type:Number,min:0,default:0},station:{type:String,trim:true,default:''},receiptUrl:{type:String,trim:true,default:''},filledAt:{type:Date,default:Date.now},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
schema.index({vehicle:1,filledAt:-1});export default mongoose.model('FuelEntry',schema);
