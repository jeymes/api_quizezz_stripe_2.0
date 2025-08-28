import { Request, Response } from 'express';
import { createSubscriptionPaid } from '../services/createSubscriptionPaid';
import { createSubscriptionWithTrial } from '../services/createSubscriptionWithTrial';

const BASIC_PLAN_PRICE_ID = process.env.BASIC_PLAN_PRICE_ID!;

export const createSubscription = async (req: Request, res: Response) => {
    const { email, name, priceId } = req.body;
    if (!email || !name || !priceId) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    if (!BASIC_PLAN_PRICE_ID) {
        throw new Error('BASIC_PLAN_PRICE_ID não está definido no ambiente.');
    }

    try {
        if (priceId === BASIC_PLAN_PRICE_ID) {
            return createSubscriptionWithTrial(req, res);
        } else {
            return createSubscriptionPaid(req, res);
        }
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};