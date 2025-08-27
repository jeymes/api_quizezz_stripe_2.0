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
        // Buscar ou criar cliente
        let customer = (await stripe.customers.list({ email, limit: 1 })).data[0];
        if (!customer) {
            customer = await stripe.customers.create({ email, name });
        }

        // Antes de criar assinatura:
        const previousSubs = await stripe.subscriptions.list({ customer: customer.id, limit: 10, status: 'all' });
        const hasUsedTrial = previousSubs.data.some(sub => sub.trial_end !== null);

        if (hasUsedTrial) {
            return res.status(403).json({
                error: 'Você já usou seu período de teste gratuito. Faça a renovação para continuar aproveitando nossos recursos.'
            });
        }

        const userDoc = await admin.firestore().collection('users')
            .where('email', '==', email)
            .where('hasUsedTrial', '==', true)
            .limit(1)
            .get();

        if (!userDoc.empty) {
            return res.status(403).json({
                error: 'Você já usou seu período de teste gratuito. Faça a renovação para continuar aproveitando nossos recursos.'
            });
        }

        // Criar assinatura com 7 dias de teste (trial)
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            trial_period_days: 7,
            payment_behavior: 'default_incomplete', // Espera confirmação do método de pagamento
            expand: ['pending_setup_intent'], // Pega o setup intent para salvar cartão
        });

        const setupIntent = subscription.pending_setup_intent;
        if (!setupIntent || typeof setupIntent === 'string') {
            return res.status(500).json({ error: 'Não foi possível obter o SetupIntent da assinatura.' });
        }

        await saveSubscriptionToFirestore({
            customerId: customer.id,
            subscriptionId: subscription.id,
            email,
            name
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        return res.json({
            clientSecret: setupIntent.client_secret,
            subscriptionId: subscription.id,
            customerId: customer.id,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};