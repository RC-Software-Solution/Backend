#!/usr/bin/env bash
# End-to-end check for notices + order status pushes.
# Usage: ADMIN_TOKEN=.. DELIVERY_TOKEN=.. CUSTOMER_TOKEN=.. ORDER_ID=<a pending order> scripts/notifications-smoke.sh
set -u
: "${ADMIN_TOKEN:?}" "${DELIVERY_TOKEN:?}" "${CUSTOMER_TOKEN:?}" "${ORDER_ID:?}"
USER_API=${USER_API:-http://localhost:4001}
ORDER_API=${ORDER_API:-http://localhost:4002}
DELIVERY_API=${DELIVERY_API:-http://localhost:4003/api/delivery}
fails=0

check() { # name expected_code method url token [json]
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$3" "$4" -H "Authorization: Bearer $5" -H 'Content-Type: application/json' ${6:+-d "$6"})
  if [ "$code" = "$2" ]; then echo "ok   $1"; else echo "FAIL $1 (expected $2, got $code)"; fails=$((fails+1)); fi
}

check "internal notify rejects missing key" 403 POST "$USER_API/api/internal/notify" "" '{"user_id":"x","title":"t","body":"b"}'
check "admin creates global notice"         201 POST "$USER_API/api/users/notices" "$ADMIN_TOKEN" '{"title":"Smoke test","body":"Ignore this notice"}'
check "customer cannot create notice"       403 POST "$USER_API/api/users/notices" "$CUSTOMER_TOKEN" '{"title":"x","body":"y"}'
check "customer lists notices"              200 GET  "$USER_API/api/users/notices" "$CUSTOMER_TOKEN"
check "illegal jump is rejected"            409 PUT  "$ORDER_API/api/orders/$ORDER_ID/status" "$ADMIN_TOKEN" '{"status":"delivered"}'
check "delivery person cannot cancel"       403 PUT  "$ORDER_API/api/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"cancelled"}'
check "pending -> preparing"                200 PUT  "$ORDER_API/api/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"preparing"}'
check "preparing -> delivering (proxy)"     200 PUT  "$DELIVERY_API/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"delivering"}'
check "delivery_failed needs reason"        400 PUT  "$DELIVERY_API/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"delivery_failed"}'
check "delivering -> delivery_failed"       200 PUT  "$DELIVERY_API/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"delivery_failed","failure_reason":"Customer unreachable"}'

echo "$fails failure(s)"
exit $fails
