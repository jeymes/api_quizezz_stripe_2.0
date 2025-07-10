import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const createSetupIntent = async (req: Request, res: Response) => {
    const { customerId } = req.body;

    if (!customerId) {
        res.status(400).json({ error: 'customerId é obrigatório' });
        return;
    }

    try {
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
        });

        res.json({ clientSecret: setupIntent.client_secret });
        return;
    } catch (error: any) {
        console.error('Erro ao criar SetupIntent:', error.message);
        res.status(500).json({ error: error.message });
        return;
    }
};
