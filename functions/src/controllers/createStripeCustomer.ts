import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const createStripeCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await stripe.customers.create({
            description: 'Usuário anônimo',
            // Se tiver email no frontend, pode enviar aqui também:
            // email: req.body.email
        });

        res.json({ customerId: customer.id });
    } catch (err: any) {
        console.error('Erro ao criar customer:', err.message);
        res.status(500).json({ error: err.message });
    }
};