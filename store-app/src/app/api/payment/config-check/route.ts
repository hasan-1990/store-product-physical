import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to check Zarinpal configuration status
 * GET /api/payment/config-check
 */
export async function GET(request: NextRequest) {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  const isSandbox = process.env.ZARINPAL_SANDBOX === 'true';
  
  // Check if merchant ID is configured and not the default placeholder
  const hasMerchantId = merchantId && 
                        merchantId !== 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' &&
                        merchantId.length === 36;

  return NextResponse.json({
    sandbox: isSandbox,
    hasMerchantId: hasMerchantId,
    merchantIdFormat: merchantId ? `${merchantId.substring(0, 8)}...${merchantId.substring(28)}` : 'Not set',
  });
}
