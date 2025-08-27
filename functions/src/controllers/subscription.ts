import { Request, Response } from 'express';
import { createSubscriptionPaid } from '../services/createSubscriptionPaid';
import { createSubscriptionWithTrial } from '../services/createSubscriptionWithTrial';

const BASIC_PLAN_PRICE_ID = process.env.STRIPE_BASIC_PLAN_ID!;

export const createSubscription = async (req: Request, res: Response) => {
    const { email, name, priceId } = req.body;
    if (!email || !name || !priceId) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        if (priceId === BASIC_PLAN_PRICE_ID) {
            return createSubscriptionWithTrial(req, res);
        } else {
            return createSubscriptionPaid(req, res);
        }
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// export const createSubscription = async (req: Request, res: Response) => {
//     const { email, name, priceId } = req.body;
//     if (!email || !name || !priceId) {
//         return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
//     }
//     try {
//         // Pegar ou criar cliente
//         let customer = (await stripe.customers.list({ email, limit: 1 })).data[0];
//         if (!customer) {
//             customer = await stripe.customers.create({ email, name });
//         }

//         // Verificar uso de trial
//         const previousSubs = await stripe.subscriptions.list({
//             customer: customer.id,
//             limit: 10,
//             status: 'all',
//         });
//         const hasUsedTrial = previousSubs.data.some(sub => sub.trial_end !== null);

//         const userQuery = await admin.firestore().collection('users')
//             .where('email', '==', email)
//             .where('hasUsedTrial', '==', true)
//             .limit(1)
//             .get();
//         const alreadyUsedTrial = hasUsedTrial || !userQuery.empty;

//         if (priceId === BASIC_PLAN_PRICE_ID && alreadyUsedTrial) {
//             return res.status(403).json({
//                 error: 'Você já usou seu período de teste gratuito.',
//             });
//         }

//         const isBasicWithTrial = priceId === BASIC_PLAN_PRICE_ID && !alreadyUsedTrial;

//         const subParams: any = {
//             customer: customer.id,
//             items: [{ price: priceId }],
//             payment_behavior: 'default_incomplete',
//             expand: isBasicWithTrial
//                 ? ['pending_setup_intent']
//                 : ['latest_invoice.confirmation_secret'],
//         };

//         if (isBasicWithTrial) {
//             subParams.trial_period_days = 7;
//         } else {
//             subParams.payment_settings = {
//                 save_default_payment_method: 'on_subscription',
//                 payment_method_types: ['card'],
//             };
//         }

//         const subscription = await stripe.subscriptions.create(subParams);

//         let clientSecret: string = '';

//         if (isBasicWithTrial) {
//             // Plano grátis com trial
//             const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null;
//             if (!setupIntent) throw new Error('Não foi possível obter SetupIntent');
//             clientSecret = setupIntent.client_secret as string;
//         } else if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
//             // Plano pago
//             const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
//             const confirmationSecret = latestInvoice?.confirmation_secret?.client_secret;
//             if (!confirmationSecret) throw new Error('Não foi possível obter confirmation_secret');
//             clientSecret = confirmationSecret;
//         }

//         await saveSubscriptionToFirestore({
//             customerId: customer.id,
//             subscriptionId: subscription.id,
//             email,
//             name,
//         });

//         await new Promise(resolve => setTimeout(resolve, 300));

//         return res.json({
//             clientSecret,
//             subscriptionId: subscription.id,
//             customerId: customer.id,
//         });
//     } catch (err: any) {
//         console.error(err);
//         return res.status(500).json({ error: err.message });
//     }
// };
