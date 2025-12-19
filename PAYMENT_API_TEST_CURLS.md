# Razorpay Payment Link API - cURL Test Commands

## Prerequisites

1. Make sure your Next.js server is running (default: `http://localhost:3000`)
2. Set your Razorpay credentials in `.env`:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

**Note:** Session authentication has been temporarily removed for testing purposes.

## Create a Payment Link

### Basic Payment Link (Minimum Required Fields)

```bash
curl -X POST http://localhost:3000/api/payments/create-link \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "INR",
    "description": "Payment for Invoice #12345"
  }' \
  -v
```

### Payment Link with Customer Details

```bash
curl -X POST http://localhost:3000/api/payments/create-link \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "INR",
    "description": "Payment for Project XYZ",
    "customer": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "contact": "9876543210"
    },
    "reminderEnable": true
  }' \
  -v
```

### Payment Link with All Options

```bash
curl -X POST http://localhost:3000/api/payments/create-link \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "INR",
    "description": "Payment for Invoice #INV-2024-001",
    "customer": {
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "contact": "9876543210"
    },
    "notes": {
      "invoice_id": "INV-2024-001",
      "project_id": "proj_123",
      "workspace_id": "ws_456"
    },
    "expireBy": 1735689599,
    "reminderEnable": true,
    "callbackUrl": "https://yourdomain.com/payment-callback",
    "callbackMethod": "post"
  }' \
  -v
```

**Note:** 
- `amount` is in rupees (will be converted to paise automatically)
- `expireBy` is a Unix timestamp (seconds since epoch)
- `callbackUrl` should be a valid URL where Razorpay will redirect after payment

## Fetch Payment Link Details

After creating a payment link, you'll receive a `shortUrl` and `id`. Use the `id` to fetch details:

```bash
# Replace plink_xxxxxxxxxxxxx with the actual payment link ID from the create response
curl -X GET http://localhost:3000/api/payments/link/plink_xxxxxxxxxxxxx \
  -H "Content-Type: application/json" \
  -v
```

## Example Response

### Create Payment Link Response

```json
{
  "data": {
    "id": "plink_xxxxxxxxxxxxx",
    "shortUrl": "https://rzp.io/i/xxxxx",
    "status": "created",
    "amount": 1000,
    "currency": "INR",
    "description": "Payment for Invoice #12345",
    "customer": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "contact": "9876543210"
    },
    "notes": {
      "invoice_id": "INV-2024-001"
    },
    "expireBy": 1735689599,
    "reminderEnable": true,
    "createdAt": 1703001234
  }
}
```

### Fetch Payment Link Response

```json
{
  "data": {
    "id": "plink_xxxxxxxxxxxxx",
    "shortUrl": "https://rzp.io/i/xxxxx",
    "status": "paid",
    "amount": 1000,
    "currency": "INR",
    "description": "Payment for Invoice #12345",
    "customer": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "contact": "9876543210"
    },
    "notes": {
      "invoice_id": "INV-2024-001"
    },
    "expireBy": 1735689599,
    "reminderEnable": true,
    "createdAt": 1703001234
  }
}
```

## Error Responses

### Missing Credentials (500)
```json
{
  "error": "Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
}
```

### Validation Error (400)
```json
{
  "error": "Amount must be greater than 0"
}
```

## Quick Test Script

Save this as `test-payment-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "Creating payment link..."
RESPONSE=$(curl -X POST "$BASE_URL/api/payments/create-link" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "INR",
    "description": "Test Payment Link"
  }' \
  -s)

echo "$RESPONSE" | jq '.'

# Extract payment link ID (requires jq)
PAYMENT_LINK_ID=$(echo "$RESPONSE" | jq -r '.data.id')

if [ "$PAYMENT_LINK_ID" != "null" ] && [ -n "$PAYMENT_LINK_ID" ]; then
  echo -e "\n\nFetching payment link details..."
  curl -X GET "$BASE_URL/api/payments/link/$PAYMENT_LINK_ID" \
    -H "Content-Type: application/json" \
    -s | jq '.'
fi

echo -e "\n\nDone!"
```

Make it executable and run:
```bash
chmod +x test-payment-api.sh
./test-payment-api.sh
```

## Windows PowerShell Alternative

For Windows users, here's a PowerShell script:

```powershell
$baseUrl = "http://localhost:3000"

# Create Payment Link
Write-Host "Creating payment link..."
$createResponse = Invoke-RestMethod -Uri "$baseUrl/api/payments/create-link" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    amount = 1000
    currency = "INR"
    description = "Test Payment Link"
  } | ConvertTo-Json)

$createResponse | ConvertTo-Json -Depth 10

# Fetch Payment Link
if ($createResponse.data.id) {
  Write-Host "`nFetching payment link details..."
  $fetchResponse = Invoke-RestMethod -Uri "$baseUrl/api/payments/link/$($createResponse.data.id)" `
    -Method GET `
    -ContentType "application/json"
  
  $fetchResponse | ConvertTo-Json -Depth 10
}

Write-Host "`nDone!"
```
