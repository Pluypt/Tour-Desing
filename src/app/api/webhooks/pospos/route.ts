import { NextResponse } from 'next/server';

/**
 * POSPOS Webhook Handler Endpoint
 * Receives real-time notifications from POSPOS (e.g. sale completed, order created)
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Log incoming POSPOS Webhook Event
    console.log('[POSPOS Webhook Received]:', JSON.stringify(payload, null, 2));

    // Event type handling (e.g., transaction.created, sale.completed)
    const eventType = payload.event || payload.type || 'transaction.created';

    switch (eventType) {
      case 'transaction.created':
      case 'sale.completed': {
        const transactionData = payload.data || payload;
        console.log(`Processing sale transaction ${transactionData.id || transactionData.transaction_no}`);
        // Here you can add logic to record transaction in local database or update customer tour booking status
        break;
      }
      default:
        console.log(`Received POSPOS unhandled event type: ${eventType}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('POSPOS Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'POSPOS Webhook Endpoint',
    time: new Date().toISOString(),
  });
}
