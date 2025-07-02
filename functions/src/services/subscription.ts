// import Stripe from 'stripe';
// import { saveSubscriptionToFirestore } from './saveSubscription';
// import stripe from '../utils/stripe';

// export const createSubscriptionService = async ({
//     priceId,
//     name,
//     email,
//     userId,
// }: {
//     priceId: string;
//     name: string;
//     email: string;
//     userId: string;
// }) => {
//     const customer = await stripe.customers.create({ name, email });

//     const subscription = await stripe.subscriptions.create({
//         customer: customer.id,
//         items: [{ price: priceId }],
//         payment_behavior: 'default_incomplete',
//         payment_settings: { save_default_payment_method: 'on_subscription' },
//         expand: ['latest_invoice.payment_intent'],
//     });

//     const latestInvoice = subscription.latest_invoice as Stripe.Invoice & {
//         payment_intent: Stripe.PaymentIntent;
//     };

//     console.log('latestInvoice:', latestInvoice);

//     if (!latestInvoice || typeof latestInvoice === 'string') {
//         throw new Error('Fatura inválida');
//     }

//     if (!latestInvoice || typeof latestInvoice === 'string') {
//         throw new Error('Fatura inválida');
//     }

//     const paymentIntent = latestInvoice.payment_intent;

//     console.log('paymentIntent:', paymentIntent);

//     if (!paymentIntent || typeof paymentIntent === 'string') {
//         throw new Error('PaymentIntent inválido');
//     }

//     await saveSubscriptionToFirestore({
//         customerId: customer.id,
//         subscriptionId: subscription.id,
//     });

//     return {
//         userId,
//         subscriptionId: subscription.id,
//         paymentIntentClientSecret: paymentIntent.client_secret,
//         customerId: customer.id,
//         publishableKey: process.env.PUBLISHABLE_KEY,
//     };
// };
