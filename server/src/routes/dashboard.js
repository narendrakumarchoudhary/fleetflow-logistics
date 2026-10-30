import {Router} from 'express';
import Shipment from '../models/Shipment.js';
import Vehicle from '../models/Vehicle.js';
import {protect,allowRoles} from '../middleware/auth.js';
import {asyncHandler} from '../utils/asyncHandler.js';
const router=Router();router.use(protect);
router.get('/summary',allowRoles('admin','dispatcher','operator','viewer'),asyncHandler(async(req,res)=>{
  const shipmentMatch=req.tenantId?{$match:{tenantId:req.tenantId}}:{$match:{}};
  const vehicleMatch={$match:{active:true,...(req.tenantId?{tenantId:req.tenantId}:{})}};
  const [shipmentCounts,vehicleCounts,recentShipments]=await Promise.all([
    Shipment.aggregate([shipmentMatch,{$group:{_id:'$status',count:{$sum:1}}}]),
    Vehicle.aggregate([vehicleMatch,{$group:{_id:'$status',count:{$sum:1}}}]),
    Shipment.find(req.tenantId?{tenantId:req.tenantId}:{}).sort({updatedAt:-1}).limit(8).lean()
  ]);
  res.json({shipments:Object.fromEntries(shipmentCounts.map(x=>[x._id,x.count])),vehicles:Object.fromEntries(vehicleCounts.map(x=>[x._id,x.count])),recentShipments});
}));
export default router;
