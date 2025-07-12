import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import Stripe from 'stripe';

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { priceId, customerId } = req.body;

        if (!priceId || !customerId) {
            res.status(400).json({ error: 'Campos obrigatórios ausentes' });
            return;
        }

        // Cria a assinatura incompleta e expande confirmation_secret
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card'],
            },
            expand: ['latest_invoice.confirmation_secret'],
        });

        const latestInvoice = subscription.latest_invoice as Stripe.Invoice;

        if (!latestInvoice?.confirmation_secret?.client_secret) {
            res.status(400).json({ error: 'Client secret não encontrado na confirmação da fatura.' });
            return;
        }

        const clientSecret = latestInvoice.confirmation_secret.client_secret;

        res.json({
            subscriptionId: subscription.id,
            clientSecret,
            isSetupIntent: false,
        });

    } catch (error: any) {
        console.error('Erro ao criar assinatura:', error.message);
        res.status(500).json({ error: error.message });
        return;
    }
};