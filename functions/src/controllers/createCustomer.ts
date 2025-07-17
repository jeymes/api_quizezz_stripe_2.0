import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const createCustomerAndSetupIntent = async (req: Request, res: Response) => {
    try {
        const setupIntent = await stripe.setupIntents.create({
        });

        res.json({
            clientSecret: setupIntent.client_secret,
            customerId: null,
            isSetupIntent: true,
        });
    } catch (error: any) {
        console.error('Erro ao criar cliente/SetupIntent:', error.message);
        res.status(500).json({ error: error.message });
    }
};