import { Request, Response } from 'express';
import { saveSubscriptionToFirestore } from '../services/saveSubscription';
import stripe from '../utils/stripe';
import Stripe from 'stripe';

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { priceId, customerId, userId } = req.body;

        if (!priceId || !customerId || !userId) {
            res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        }

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
        });

        const latestInvoice = subscription.latest_invoice as Stripe.Invoice & {
            payment_intent: Stripe.PaymentIntent;
        };

        const paymentIntent = latestInvoice.payment_intent;

        await saveSubscriptionToFirestore({
            customerId,
            subscriptionId: subscription.id,
        });

        res.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
            isSetupIntent: false,
        });
    } catch (error: any) {
        console.error('Erro ao criar assinatura:', error.message);
        res.status(500).json({ error: error.message });
    }
};
