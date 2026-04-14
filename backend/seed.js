'use strict';
if (process.env.NODE_ENV === 'production') { process.exit(1); }
const { query } = require('./src/config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function run() {
  const biz = await query(`
    INSERT INTO businesses (name, slug, accent_color, sla_default_minutes, timezone)
    VALUES ('Trajex Demo','trajex-demo','#00e5cc',45,'Asia/Kolkata')
    ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`);
  const BID = biz.rows[0].id;
  console.log('  business_id:', BID);

  const USERS = [
    { name:'Arjun Reddy',  email:'admin@trajex.io',   pw:'Admin@2024!',   role:'owner'   },
    { name:'Priya Sharma', email:'manager@trajex.io', pw:'Manager@2024!', role:'manager' },
    { name:'Rohith Kumar', email:'staff@trajex.io',   pw:'Staff@2024!',   role:'staff'   },
  ];
  for (const u of USERS) {
    const h = await bcrypt.hash(u.pw, 10);
    await query(`INSERT INTO users (business_id,email,password_hash,name,role,is_active)
      VALUES ($1,$2,$3,$4,$5,true)
      ON CONFLICT (business_id,email) DO UPDATE SET password_hash=$3,name=$4,role=$5`,
      [BID,u.email,h,u.name,u.role]);
  }
  console.log('  users seeded');

  const storeRes = await query(`
    INSERT INTO stores (business_id,name,address,lat,lng,phone,type,is_active)
    VALUES ($1,'Trajex Hyderabad Hub','Road No. 2, Banjara Hills, Hyderabad',
            17.4156,78.4347,'+914023456789','warehouse',true)
    ON CONFLICT DO NOTHING RETURNING id`,[BID]);
  let SID = storeRes.rows[0]?.id;
  if (!SID) { const r = await query(`SELECT id FROM stores WHERE business_id=$1 LIMIT 1`,[BID]); SID=r.rows[0]?.id; }

  await query(`DELETE FROM delivery_partners WHERE business_id=$1`,[BID]);
  const RIDERS = [
    { name:'Ravi Kumar',   phone:'+919900112233', vehicle:'bike',    score:4.8, lat:17.4325, lng:78.4071 },
    { name:'Suresh Nair',  phone:'+919900112244', vehicle:'bike',    score:4.6, lat:17.4478, lng:78.3914 },
    { name:'Kiran Das',    phone:'+919900112255', vehicle:'scooter', score:4.9, lat:17.4435, lng:78.4483 },
    { name:'Vikram Singh', phone:'+919900112266', vehicle:'bike',    score:4.5, lat:17.4008, lng:78.4800 },
    { name:'Anita Bose',   phone:'+919900112277', vehicle:'scooter', score:4.7, lat:17.3616, lng:78.4747 },
  ];
  for (const r of RIDERS) {
    await query(`INSERT INTO delivery_partners
      (business_id,name,phone,vehicle_type,status,active_orders,reliability_score,last_lat,last_lng,last_seen_at)
      VALUES ($1,$2,$3,$4,'available',0,$5,$6,$7,NOW())`,
      [BID,r.name,r.phone,r.vehicle,r.score,r.lat,r.lng]);
  }
  console.log('  5 riders seeded (Hyderabad)');

  await query(`DELETE FROM orders WHERE business_id=$1`,[BID]);
  const ADDR = [
    '8-2-293 Road No. 78, Jubilee Hills, Hyderabad',
    '3-6-370 Himayatnagar, Hyderabad',
    '6-3-249 Road No. 1, Banjara Hills, Hyderabad',
    '1-8-303 Begumpet, Hyderabad',
    '23-5-802 Charminar Area, Hyderabad',
    '5-9-22 Basheerbagh, Hyderabad',
    '12-13-657 Tarnaka, Hyderabad',
    'Plot 45, Madhapur HITEC City, Hyderabad',
  ];
  const COORDS = [
    [17.4325,78.4071],[17.4285,78.4622],[17.4156,78.4347],[17.4375,78.4483],
    [17.3604,78.4736],[17.3960,78.4744],[17.4478,78.5273],[17.4478,78.3914],
  ];
  const STATUSES = ['pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed'];
  const rid = await query(`SELECT id FROM delivery_partners WHERE business_id=$1 LIMIT 1`,[BID]);
  const RID = rid.rows[0]?.id;
  for (let i=0;i<8;i++) {
    const needsRider = ['assigned','picked_up','in_transit','delivered'].includes(STATUSES[i]);
    await query(`INSERT INTO orders
      (business_id,store_id,rider_id,customer_name,customer_phone,channel,
       pickup_lat,pickup_lng,drop_lat,drop_lng,drop_address,priority,status,sla_minutes,tracking_token,total_amount)
      VALUES ($1,$2,$3,$4,'+919876543210','app',$5,$6,$7,$8,$9,$10,$11,45,$12,(random()*800+200)::numeric(10,2))`,
      [BID,SID,needsRider?RID:null,`Customer ${i+1}`,
       COORDS[i][0],COORDS[i][1],COORDS[(i+3)%8][0],COORDS[(i+3)%8][1],
       ADDR[i],i<2?'high':'normal',STATUSES[i],crypto.randomBytes(16).toString('hex')]);
  }
  console.log('  8 orders seeded (Hyderabad)');
  console.log('\nSeed complete. Login: admin@trajex.io / Admin@2024!');
  process.exit(0);
}
run().catch(e=>{ console.error(e.message); process.exit(1); });
