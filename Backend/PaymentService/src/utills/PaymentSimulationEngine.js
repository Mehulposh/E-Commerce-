/**
 * Payment Simulator
 *
 * Simulates a real payment gateway (Stripe-like).
 * Adds realistic delays, failure scenarios, and card validation.
 */

const FAILURE_RATE = parseFloat(process.env.SIMULATED_FAILURE_RATE || '0.1');

// Test cards that always succeed or fail (like Stripe test cards)
const TEST_CARDS = {
  '4242424242424242': { brand: 'Visa', result: 'success' },
  '4000000000000002': { brand: 'Visa', result: 'declined' },
  '4000000000009995': { brand: 'Visa', result: 'insufficient_funds' },
  '5555555555554444': { brand: 'Mastercard', result: 'success' },
  '378282246310005':  { brand: 'Amex', result: 'success' },
};

/**
 * Simulate processing delay (200ms - 800ms)
 */
const simulateDelay = () => new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));


/**
 * Process a payment simulation
 * Returns { success, transactionId, cardBrand, cardLast4, failureReason }
 */

const processPayment = async ({ amount, currency='USD', cardNumber, method='simulated' }) => {
    await simulateDelay()

    // If a specific test card number is provided
    if(cardNumber){
        const clean = cardNumber.replace(/\s/g, '');
        const testCard = TEST_CARDS[clean];

        const last4 = clean.slice(-4);
        const brand = testCard?.brand || detectCardBrand(clean);

        if(testCard){
            if(testCard.result === 'success'){  
                return buildSuccess({last4, brand})
            }else{
                return buildFailure(testCard.result, last4, brand)
            }
        }

        // Unknown card — use random failure rate
        if (Math.random() < FAILURE_RATE) {
            return buildFailure('card_declined', last4, brand);
        }
        return buildSuccess({ last4, brand });
    }


    // No card — simulate generic payment method
    if (Math.random() < FAILURE_RATE) {
        const reasons = ['insufficient_funds', 'card_declined', 'processing_error', 'expired_card'];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        return buildFailure(reason, null, method);
    }

    return buildSuccess({ last4: null, brand: method });
}



/**
 * Simulate a refund
 */
const processRefund = async ({ transactionId, amount }) => {
  await simulateDelay();
  // Refunds almost always succeed
  if (Math.random() < 0.02) {
    return { success: false, failureReason: 'refund_processing_error' };
  }
  return {
    success: true,
    refundTransactionId: `ref_${Date.now()}`,
    amount,
  };
};


// ── Helpers ──────────
const buildSuccess = ({ last4, brand }) => ({
  success: true,
  transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  cardLast4: last4,
  cardBrand: brand,
  failureReason: null,
});

const buildFailure = (reason, last4, brand) => ({
  success: false,
  transactionId: null,
  cardLast4: last4,
  cardBrand: brand,
  failureReason: reason,
});


const detectCardBrand = (number) => {
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  if (/^6/.test(number)) return 'Discover';
  return 'Unknown';
};


export {
    processPayment,
    processRefund
}