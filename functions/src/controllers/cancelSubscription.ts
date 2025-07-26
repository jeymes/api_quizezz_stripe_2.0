import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const cancelSubscription = async (req: Request, res: Response) => {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        res.status(400).json({ error: 'subscriptionId é obrigatório' });
        return;
    }

    try {
        const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

        res.json({
            message: 'Assinatura cancelada com sucesso',
            subscription: canceledSubscription,
        });
    } catch (error: any) {
        console.error('Erro ao cancelar assinatura:', error.message);
        res.status(500).json({ error: error.message });
    }
};
