/**
 * Webhook Routes
 * Handles payment webhooks from payment processors
 * 
 * SECURITY: Verifies webhook signatures to prevent spoofing
 */

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
// Dummy key is fine for constructEvent; real secrets are per-client webhook secrets
const stripe = new Stripe(process.env.STRIPE_DUMMY_API_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20'
});

/**
 * POST /api/webhooks/stripe/:client
 * Stripe webhook handler with per-client secret and signature verification
 * - Signature/parse failure -> 400 (do not retry)
 * - Event verified but processing failure -> 500 (Stripe retries)
 */
router.post('/stripe/:client', express.raw({ type: 'application/json' }), async (req, res) => {
  const client = req.params.client;
  const signature = req.headers['stripe-signature'];
  const envKey = `STRIPE_WEBHOOK_SECRET_${(client || '').toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const webhookSecret = process.env[envKey] || process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('[Webhook] Stripe signature or secret missing for client', client);
    return res.status(400).json({ error: 'Missing signature or secret' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('[Webhook] Stripe constructEvent failed (signature/parse):', err.message);
    return res.status(400).json({ error: 'Invalid signature or payload' });
  }

  const { id, type, data } = event;
  console.log('[Webhook] Stripe webhook received:', { id, type, client });

  try {
    if (type === 'checkout.session.completed') {
      const session = data.object;
      const paymentAttemptId = session.metadata?.paymentAttemptId;

      if (!paymentAttemptId) {
        console.warn('[Webhook] checkout.session.completed missing metadata.paymentAttemptId, session.id=', session.id);
        return res.status(200).json({ received: true });
      }

      await updatePaymentStatus(paymentAttemptId, 'completed', 'stripe', {
        stripeSessionId: session.id,
        paymentIntent: session.payment_intent
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Stripe webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/webhooks/wipay
 * WiPay webhook handler
 * TODO: Add WiPay signature verification when available
 */
router.post('/wipay', async (req, res) => {
  try {
    const { session_id, status, amount, currency, signature } = req.body;
    
    console.log('[Webhook] WiPay webhook received:', { session_id, status, amount, currency });

    // TODO: Verify WiPay webhook signature if available
    // const webhookSecret = process.env.WIPAY_WEBHOOK_SECRET;
    // if (webhookSecret && signature) {
    //   const isValid = verifyWiPaySignature(req.body, signature, webhookSecret);
    //   if (!isValid) {
    //     return res.status(400).json({ error: 'Invalid signature' });
    //   }
    // }

    // Update payment status in database
    await updatePaymentStatus(session_id, status, 'wipay');
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('[Webhook] WiPay webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * POST /api/webhooks/square
 * Square webhook handler
 * TODO: Add Square webhook signature verification
 */
router.post('/square', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-square-signature'];
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;

    // TODO: Verify Square webhook signature
    // Square uses HMAC-SHA256 with webhook URL + body
    // if (signature && webhookSecret) {
    //   const isValid = verifySquareSignature(req.body, signature, webhookSecret);
    //   if (!isValid) {
    //     return res.status(400).json({ error: 'Invalid signature' });
    //   }
    // }

    const event = JSON.parse(req.body.toString());
    console.log('[Webhook] Square webhook received:', event);

    // Handle Square webhook events
    if (event.type === 'payment.created' || event.type === 'payment.updated') {
      const paymentId = event.data?.object?.payment?.id;
      const status = event.data?.object?.payment?.status;
      if (paymentId && status) {
        await updatePaymentStatus(paymentId, status, 'square');
      }
    }

    res.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Square webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Update payment status in database
 * @param {string} paymentAttemptId - Our internal id (e.g. paymentAttemptId from metadata)
 * @param {string} status - 'completed' | 'failed' | 'refunded' etc.
 * @param {string} processor - 'stripe' | 'wipay' | 'square'
 * @param {Object} [extra] - Optional processor-specific data (e.g. { stripeSessionId, paymentIntent })
 */
async function updatePaymentStatus(paymentAttemptId, status, processor, extra = {}) {
  // TODO: Implement database update
  console.log(`[Webhook] Updating payment status: ${paymentAttemptId} -> ${status} (${processor})`, extra);
}

module.exports = router;
