import { Request, Response } from 'express';
import { createSubscriptionService } from '../services/subscription';

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { priceId, name, email, userId } = req.body;

        if (!priceId || !name || !email || !userId) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        }

        const result = await createSubscriptionService({ priceId, name, email, userId });
        return res.json(result);
    } catch (error: any) {
        console.error('Erro ao criar assinatura:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
