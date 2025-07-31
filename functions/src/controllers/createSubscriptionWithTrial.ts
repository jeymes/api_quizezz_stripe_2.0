import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import { saveSubscriptionToFirestore } from '../services/saveSubscription';

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
