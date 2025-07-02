import { Request, Response } from 'express';
import { getPaymentStatus } from './webhook';

export const getPaymentStatusHandler = async (req: Request, res: Response) => {
    const { paymentIntentId } = req.body;

    const result = await getPaymentStatus(paymentIntentId);

    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
};
