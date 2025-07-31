import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const saveDefaultPaymentMethod = async (req: Request, res: Response) => {
    const { customerId, paymentMethodId, subscriptionId } = req.body;

    if (!customerId || !paymentMethodId || !subscriptionId) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    try {
        // 0. Anexar o método de pagamento ao cliente
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // 1. Definir o método como padrão do cliente
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // 2. Definir o método como padrão da assinatura
        await stripe.subscriptions.update(subscriptionId, {
            default_payment_method: paymentMethodId,
        });

        return res.json({ success: true });
    } catch (err: any) {
        console.error('Erro ao salvar método de pagamento:', err.message);
        return res.status(500).json({ error: 'Erro ao salvar método de pagamento.' });
    }
};