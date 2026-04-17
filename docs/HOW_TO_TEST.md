# Trajex — How to Test Everything

## Start the stack
## Test accounts
| Email | Password | Role | What they can do |
|-------|----------|------|-----------------|
| admin@trajex.io | Admin@2024! | Owner | Everything |
| manager@trajex.io | Manager@2024! | Manager | Orders, riders, settings — no workspace deletion |
| staff@trajex.io | Staff@2024! | Staff | Create/update orders, see My Deliveries |

## Customer tracking
1. Login as admin, create an order
2. Copy the tracking_token from the API or from the Orders table
3. Open `http://localhost:5173/track/{token}` — no login needed
4. Update the order status in the dashboard — the tracking page updates live via socket

## Rider location (real GPS — desktop)
1. Login as staff (staff@trajex.io)
2. Go to My Deliveries
3. Click "Send my location" — browser asks for GPS permission
4. Allow it — your coordinates are sent to the backend and broadcast via socket
5. Open Live Map in another tab — you'll see the position update

## Rider location (simulated — for testing without GPS)
```bash
# Get a rider ID first
TOKEN=$(curl -s -c /tmp/zv.txt -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trajex.io","password":"Admin@2024!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

RIDER_ID=$(curl -s http://127.0.0.1:4000/api/v1/riders \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['riders'][0]['id'])")

# Simulate location ping (Jubilee Hills, Hyderabad)
curl -s -X PATCH http://127.0.0.1:4000/api/v1/riders/$RIDER_ID/location \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat": 17.4317, "lng": 78.4071}'

# Simulate second rider moving (Banjara Hills)
RIDER2=$(curl -s http://127.0.0.1:4000/api/v1/riders \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['riders'][1]['id'])")

curl -s -X PATCH http://127.0.0.1:4000/api/v1/riders/$RIDER2/location \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat": 17.4156, "lng": 78.4347}'
```
Open Live Map at http://localhost:5173/map — pins move in real time.

## Full order lifecycle test
```bash
# 1. Login
TOKEN=$(curl -s -c /tmp/zv.txt -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trajex.io","password":"Admin@2024!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# 2. Create order
ORDER=$(curl -s -X POST http://127.0.0.1:4000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Priya Sharma","customerPhone":"+919876543210","dropAddress":"Road No. 12, Banjara Hills, Hyderabad","priority":"high","pickupLat":17.4065,"pickupLng":78.4772}')
ORDER_ID=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
TRACK=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['tracking_token'])")
echo "Order: $ORDER_ID  Track: $TRACK"

# 3. Get assignment suggestions
curl -s "http://127.0.0.1:4000/api/v1/assignment/suggest?orderId=$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 4. Assign best rider
RIDER_ID=$(curl -s "http://127.0.0.1:4000/api/v1/assignment/suggest?orderId=$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['suggestions'][0]['id'])")
curl -s -X POST http://127.0.0.1:4000/api/v1/orders/$ORDER_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"riderId\":\"$RIDER_ID\"}"

# 5. Open tracking page
echo "Customer tracking: http://localhost:5173/track/$TRACK"

# 6. Progress order through statuses
for STATUS in picked_up in_transit delivered; do
  curl -s -X PATCH http://127.0.0.1:4000/api/v1/orders/$ORDER_ID/status \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"$STATUS\"}"
  echo "Status updated to: $STATUS"
  sleep 2
done
```

## What social login would need
Google OAuth requires: Google Cloud Console project, OAuth 2.0 credentials, redirect URI. 
This is an infrastructure decision, not a code problem. It requires a domain and real OAuth app setup.
Currently not implemented — standard email/password auth is production-ready as-is.

## What profile picture upload would need
Requires Cloudinary or S3 — free tiers exist on both. Currently not implemented.

## API documentation
http://localhost:4000/api/docs
