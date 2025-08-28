import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import { saveSubscriptionToFirestore } from './saveSubscription';
import admin from '../utils/firebase';

export const createSubscriptionWithTrial = async (req: Request, res: Response) => {
    const { email, name, priceId } = req.body;

    if (!email || !name || !priceId) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        let customer = (await stripe.customers.list({ email, limit: 1 })).data[0];

        if (!customer) {
            customer = await stripe.customers.create({ email, name });
            if (!customer || !customer.id) throw new Error('Falha ao criar cliente no Stripe.');
        }


        // Verifica se já usou trial
        const previousSubs = await stripe.subscriptions.list({ customer: customer.id, limit: 10, status: 'all' });
        const hasUsedTrial = previousSubs.data.some(sub => sub.trial_end !== null);

        const userDoc = await admin.firestore().collection('users')
            .where('email', '==', email)
            .where('hasUsedTrial', '==', true)
            .limit(1)
            .get();

        if (hasUsedTrial || !userDoc.empty) {
            return res.status(403).json({
                error: 'Você já usou seu período de teste gratuito.'
            });
        }

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            trial_period_days: 7,
            payment_behavior: 'default_incomplete',
            expand: ['pending_setup_intent'],
        });

        if (!subscription || !subscription.id) {
            throw new Error('Falha ao criar assinatura.');
        }


        const setupIntent = subscription.pending_setup_intent;
        if (!setupIntent || typeof setupIntent === 'string' || !setupIntent.client_secret) {
            throw new Error('Falha ao obter SetupIntent da assinatura.');
        }

        await saveSubscriptionToFirestore({
            customerId: customer.id,
            subscriptionId: subscription.id,
            email,
            name
        });

        return res.json({
            clientSecret: setupIntent.client_secret,
            subscriptionId: subscription.id,
            customerId: customer.id,
        });

    } catch (err: any) {
        console.error('[Trial] Erro ao criar assinatura trial:', err);
        return res.status(500).json({ error: err.message || 'Erro interno no servidor.' });
    }
};