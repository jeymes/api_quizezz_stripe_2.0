import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const createCustomerAndSetupIntent = async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        }

        // Cria cliente
        const customer = await stripe.customers.create({ name, email });

        // Cria SetupIntent
        const setupIntent = await stripe.setupIntents.create({
            customer: customer.id,
        });

        res.json({
            clientSecret: setupIntent.client_secret,
            customerId: customer.id,
            isSetupIntent: true,
        });
    } catch (error: any) {
        console.error('Erro ao criar cliente/SetupIntent:', error.message);
        res.status(500).json({ error: error.message });
    }
};