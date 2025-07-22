import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import Stripe from 'stripe';
import { saveSubscriptionToFirestore } from '../services/saveSubscription';

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { priceId, name, email } = req.body;

        if (!priceId || !email || !name) {
            res.status(400).json({ error: 'Campos obrigatórios faltando' });
            return;
        }

        // 1. Busca o cliente pelo email
        const customers = await stripe.customers.list({
            email,
            limit: 1,
        });

        let customer = customers.data[0];

        // 2. Se não existe, cria novo cliente
        if (!customer) {
            customer = await stripe.customers.create({ email, name });
        }

        // 3. Busca assinaturas do cliente
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 1,
        });

        const existingSub = subscriptions.data[0];

        // 4. Verifica se o cliente já tem uma assinatura ativa
        if (
            existingSub &&
            existingSub.status === 'active' &&
            !existingSub.cancel_at_period_end
        ) {
            res.status(400).json({ error: 'Este e-mail já possui uma assinatura ativa.' });
            return;
        }

        // Cria a assinatura incompleta e expande confirmation_secret
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
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

        await saveSubscriptionToFirestore({
            customerId: customer.id,
            subscriptionId: subscription.id,
            email,
            name
        });

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