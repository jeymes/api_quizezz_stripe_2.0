import { Request, Response } from 'express';
import { saveSubscriptionToFirestore } from '../services/saveSubscription';
import stripe from '../utils/stripe';
import Stripe from 'stripe';

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { priceId, name, email, userId } = req.body;

        if (!priceId || !name || !email || !userId) {
            res.status(400).json({ error: 'Campos obrigatórios ausentes' });
            return;
        }

        const customer = await stripe.customers.create({ name, email });

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        const latestInvoice = subscription.latest_invoice as Stripe.Invoice & {
            payment_intent: Stripe.PaymentIntent;
        };

        console.log('latestInvoice:', latestInvoice);

        if (!latestInvoice || typeof latestInvoice === 'string') {
            res.status(422).json({ error: 'Fatura inválida' });
            return;
        }

        const paymentIntent = latestInvoice.payment_intent;

        console.log('paymentIntent:', paymentIntent);

        if (!paymentIntent || typeof paymentIntent === 'string') {
            res.status(422).json({ error: 'PaymentIntent não encontrado ou inválido na resposta da Stripe.' });
            return;
        }

        await saveSubscriptionToFirestore({
            customerId: customer.id,
            subscriptionId: subscription.id,
        });

        res.json({
            userId,
            subscriptionId: subscription.id,
            paymentIntentClientSecret: paymentIntent.client_secret,
            customerId: customer.id,
            publishableKey: process.env.PUBLISHABLE_KEY,
        });
        return;

    } catch (error: any) {
        console.error('Erro ao criar assinatura:', error.message);
        res.status(500).json({ error: error.message });
        return;
    }
};
