import './config/env.js';import mongoose from 'mongoose';import bcrypt from 'bcryptjs';import {connectDB} from './config/db.js';import User from './models/User.js';import Shipment from './models/Shipment.js';import Vehicle from './models/Vehicle.js';import Driver from './models/Driver.js';
const etaIn=(hours)=>new Date(Date.now()+hours*60*60*1000).toISOString();
const shipments=[
['FF-IN-20481','Aravali Agro Foods','Sitapura Industrial Area, Jaipur, Rajasthan','Gurugram, Haryana','In Transit','High','RJ14-GA-4821','Amit Choudhary',etaIn(4),68],
['FF-IN-20480','Shree Medical Supplies','Bhiwadi, Rajasthan','South Delhi, Delhi','Out for Delivery','Urgent','DL1L-AB-9172','Pooja Sharma',etaIn(1),92],
['FF-IN-20479','Kaveri Textiles','Surat, Gujarat','Ahmedabad, Gujarat','Delivered','Normal','GJ05-RZ-6304','Rohit Meena','Delivered',100],
['FF-IN-20478','Western Components India','Pimpri-Chinchwad, Pune, Maharashtra','Indore, Madhya Pradesh','Delayed','High','MH12-QX-5520','Neeraj Singh',etaIn(8),46],
['FF-IN-20477','Blue Neem Consumer Goods','Bengaluru, Karnataka','Hyderabad, Telangana','In Transit','Normal','KA03-MN-1188','Kavita Yadav',etaIn(10),38],
['FF-IN-20476','Marwar Ceramics','Morbi, Gujarat','Jaipur, Rajasthan','Pending','Low','','',etaIn(30),0]
];
const vehicles=[
['RJ14-GA-4821','Heavy truck','Amit Choudhary','16 MT','On route','NH-48 · Shahpura, Rajasthan',78],
['DL1L-AB-9172','LCV','Pooja Sharma','3.5 MT','On route','Okhla, New Delhi',64],
['GJ05-RZ-6304','Container truck','Rohit Meena','20 MT','Available','Narol Transport Nagar, Ahmedabad',92],
['MH12-QX-5520','Heavy truck','Neeraj Singh','18 MT','Attention','NH-52 · Dhule, Maharashtra',31],
['KA03-MN-1188','Refrigerated truck','Kavita Yadav','12 MT','On route','Anantapur, Andhra Pradesh',56],
['RJ19-BC-7740','Pickup','Suresh Jat','1.2 MT','Available','Transport Nagar, Jodhpur',88]
];
const drivers=[
['Amit Choudhary','+91 98765 41021','amit.driver@example.in','RJ1420160012345','On duty','RJ14-GA-4821'],
['Pooja Sharma','+91 98765 41022','pooja.driver@example.in','DL0420180098765','On duty','DL1L-AB-9172'],
['Rohit Meena','+91 98765 41023','rohit.driver@example.in','GJ0520170043210','Available','GJ05-RZ-6304'],
['Neeraj Singh','+91 98765 41024','neeraj.driver@example.in','MH1220190076543','On duty','MH12-QX-5520'],
['Kavita Yadav','+91 98765 41025','kavita.driver@example.in','KA0320200024680','On duty','KA03-MN-1188'],
['Suresh Jat','+91 98765 41026','suresh.driver@example.in','RJ1920150067890','Available','RJ19-BC-7740']
];
if(process.env.NODE_ENV==='production'){console.error('Refusing to run the demo seed script in production.');process.exit(1)}try{await connectDB();const passwordHash=await bcrypt.hash('FleetFlowDemo!2026',Number(process.env.BCRYPT_ROUNDS)||12);await User.findOneAndUpdate({email:'admin@fleetflow.demo'},{$set:{name:'Operations Admin',email:'admin@fleetflow.demo',passwordHash,role:'admin',active:true}},{upsert:true,new:true,setDefaultsOnInsert:true});await Shipment.deleteMany({});await Vehicle.deleteMany({});await Shipment.insertMany(shipments.map(([trackingNumber,customer,origin,destination,status,priority,vehicle,driver,eta,progress])=>({trackingNumber,customer,origin,destination,status,priority,vehicle,driver,eta,progress,events:[{status,location:destination,note:'Demo seed event',occurredAt:new Date()}]})));await Vehicle.insertMany(vehicles.map(([registration,type,driver,capacity,status,location,fuel])=>({registration,type,driver,capacity,status,location,fuel})));await Driver.deleteMany({});await Driver.insertMany(drivers.map(([name,phone,email,license,status,vehicle])=>({name,phone,email,license,status,vehicle})));console.log('Seed complete. Demo login: admin@fleetflow.demo / FleetFlowDemo!2026');}catch(e){console.error(e);process.exitCode=1}finally{await mongoose.disconnect();}