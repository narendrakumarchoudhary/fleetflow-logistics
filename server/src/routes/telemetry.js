import { Router } from 'express';
import { z } from 'zod';
import Vehicle from '../models/Vehicle.js';
import VehicleLocation from '../models/VehicleLocation.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
const router = Router();
router.use(protect);
const tenantFilter = (req, filter = {}) => req.tenantId ? { ...filter, tenantId: req.tenantId } : filter;
router.post('/locations', allowRoles('admin','dispatcher','operator'), asyncHandler(async (req,res) => {
  const p = z.object({ vehicle:z.string().min(2).max(30), latitude:z.coerce.number().min(-90).max(90), longitude:z.coerce.number().min(-180).max(180), speedKph:z.coerce.number().min(0).max(300).optional(), heading:z.coerce.number().min(0).max(360).optional(), recordedAt:z.coerce.date().optional(), source:z.enum(['device','manual','simulator']).default('device') }).safeParse(req.body);
  if (!p.success) return res.status(400).json({message:'Invalid vehicle coordinates',errors:p.error.issues});
  const vehicle = await Vehicle.findOne(tenantFilter(req,{registration:p.data.vehicle.toUpperCase(),active:true}));
  if (!vehicle) return res.status(404).json({message:'Active vehicle not found'});
  const recordedAt = p.data.recordedAt || new Date();
  const latest = await VehicleLocation.findOne(tenantFilter(req,{vehicle:vehicle.registration})).sort({recordedAt:-1}).lean();
  if (latest && recordedAt < latest.recordedAt) return res.status(409).json({message:'Location timestamp is older than the latest recorded position'});
  const location = await VehicleLocation.create({...p.data,vehicle:vehicle.registration,recordedAt,...(req.tenantId?{tenantId:req.tenantId}:{})});
  vehicle.location = `${p.data.latitude.toFixed(5)}, ${p.data.longitude.toFixed(5)}`;
  await vehicle.save();
  await audit(req,{action:'vehicle.location_recorded',entity:'vehicle',entityId:vehicle._id,summary:`Location updated for ${vehicle.registration}`});
  res.status(201).json({location});
}));
router.get('/locations/latest', asyncHandler(async(req,res)=>{
  const match = tenantFilter(req,req.query.vehicle ? {vehicle:String(req.query.vehicle).toUpperCase()} : {});
  const rows = await VehicleLocation.aggregate([{$match:match},{$sort:{recordedAt:-1}},{$group:{_id:'$vehicle',location:{$first:'$$ROOT'}}},{$replaceRoot:{new:'$location'}},{$sort:{recordedAt:-1}},{$limit:500}]);
  res.json({items:rows,total:rows.length});
}));
router.get('/locations/:vehicle/history', asyncHandler(async(req,res)=>{
  const vehicle = String(req.params.vehicle).toUpperCase();
  const items = await VehicleLocation.find(tenantFilter(req,{vehicle})).sort({recordedAt:-1}).limit(Math.min(Number(req.query.limit)||100,500)).lean();
  res.json({items,total:items.length});
}));
export default router;
