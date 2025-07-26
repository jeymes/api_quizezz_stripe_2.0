import { Request, Response } from 'express';
import stripe from '../utils/stripe';

export const renewSubscriptionInvoice = async (req: Request, res: Response) => {
    const { subscriptionId } = req.body;

    try {
        const openInvoices = await stripe.invoices.list({
            subscription: subscriptionId,
            status: 'open',
            limit: 1,
        });

        const draftInvoices = await stripe.invoices.list({
            subscription: subscriptionId,
            status: 'draft',
            limit: 1,
        });

        const existingInvoice = draftInvoices.data[0] || openInvoices.data[0];

        if (!existingInvoice) {
            res.status(404).json({ error: 'Nenhuma fatura aberta ou rascunho encontrada.' });
            return;
        }

        let finalizedInvoice = existingInvoice;

        if (finalizedInvoice.status === 'draft') {
            if (finalizedInvoice.id) {
                finalizedInvoice = await stripe.invoices.finalizeInvoice(finalizedInvoice.id);
            } else {
                throw new Error('Invoice ID is undefined');
            }
        }

        res.json({
            invoiceId: finalizedInvoice.id,
            hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
            status: finalizedInvoice.status,
        });
    } catch (error: any) {
        console.error('Erro ao renovar fatura:', error.message);
        res.status(500).json({ error: error.message });
    }
};