import admin from '../utils/firebase';
import { stripe } from '../utils/stripe';

export const webhookHandler = async (req: any, res: any) => {
    let event;

    const stripeSignature = req.headers['stripe-signature'];

    if (typeof stripeSignature !== 'string') {
        console.error('Erro: Stripe signature não encontrada ou não é uma string.');
        return res.status(400).json({ error: 'Stripe signature não encontrada ou não é uma string' });
    }

    if (!process.env.STRIPE_ENDPOINT_SECRET) {
        console.error('A chave STRIPE_ENDPOINT_SECRET não está configurada.');
        return res.status(500).json({ error: 'STRIPE_ENDPOINT_SECRET não está configurada' });
    }

    try {
        // Verifica a assinatura do webhook
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody,  // Cast para any para ignorar o erro de tipo
            stripeSignature,
            process.env.STRIPE_ENDPOINT_SECRET as string
        );

        console.log('Evento recebido:', event);

        // Trabalhe com o objeto de evento
        const dataObject = event.data.object as { id: string };
        const { id } = dataObject;

        // Verifique os tipos de evento do Stripe que você deseja tratar
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionCreated(dataObject, res);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(dataObject, res);
                break;

            case 'invoice.created':
            case 'invoice.finalized':
            case 'invoice.paid':
            case 'invoice.payment_succeeded':
                await handleInvoicePaid(dataObject, res);
                await updatePaymentStatus(id, 'succeeded');
                break;

            case 'invoice.updated':
                await updatePaymentStatus(id, 'processing');
                break;

            case 'invoice.payment_failed':
            case 'invoice.overdue':
            case 'invoice.voided':
                handleInvoiceOverdue
                await handleInvoiceOverdue(dataObject, res);
                await updatePaymentStatus(id, 'failed');
                break;

            default:
                console.warn('Evento não tratado:', event.type);
        }

        res.sendStatus(200);
    } catch (err: any) {
        console.error('Erro ao verificar assinatura do webhook:', err.message);
        return res.status(400).json({ error: 'Erro ao processar webhook', details: err.message });
    }
};

const paymentStatus = {} as any;

const updatePaymentStatus = (paymentIntentId: any, status: any) => {
    paymentStatus[paymentIntentId] = status;
};

export const getPaymentStatus = async (paymentIntentId: string) => {
    try {
        const status = paymentStatus[paymentIntentId];

        if (status !== undefined) {
            return { success: true, paymentIntentId, status };
        } else {
            return { success: false, error: 'Informações de pagamento não encontradas', paymentIntentId };
        }
    } catch (error) {
        console.error('Erro ao processar o status do pagamento:', error);
        return { success: false, error: 'Erro ao processar o status do pagamento' };
    }
};

// Funções de manipulação de eventos
async function handleSubscriptionCreated(subscription: any, res: any) {
    const subscriptionId = subscription.id;

    console.log(`Assinatura criada: ${subscriptionId}`);

    try {
        // Buscar o documento da assinatura no Firestore com base no subscriptionId
        const snapshot = await admin.firestore().collection('subscriptions').where('subscriptionId', '==', subscriptionId).get();

        if (snapshot.empty) {
            console.error(`Assinatura não encontrada para o ID ${subscriptionId}`);
            return res.status(404).send({ error: `Assinatura não encontrada para o ID ${subscriptionId}` });
        }

        // Atualiza o status da assinatura
        const subscriptionDoc = snapshot.docs[0];
        await subscriptionDoc.ref.update({
            subscription: subscription,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),  // Armazenar data de criação
        });

        res.status(200).send({ message: 'Assinatura criada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar a assinatura:', error);
        res.status(500).send({ error: 'Erro ao processar a assinatura criada' });
    }
}

async function handleSubscriptionDeleted(subscription: any, res: any) {
    const subscriptionId = subscription.id;

    try {
        // Buscar o documento da assinatura no Firestore com base no subscriptionId
        const snapshot = await admin.firestore().collection('subscriptions').where('subscriptionId', '==', subscriptionId).get();

        if (snapshot.empty) {
            console.error(`Assinatura não encontrada para o ID ${subscriptionId}`);
            return res.status(404).send({ error: `Assinatura não encontrada para o ID ${subscriptionId}` });
        }

        const subscriptionDoc = snapshot.docs[0];
        await subscriptionDoc.ref.update({
            subscription: subscription,
        });

        res.status(200).send({ message: 'Assinatura cancelada com sucesso' });
    } catch (error) {
        console.error('Erro ao processar exclusão de assinatura:', error);
        res.status(500).send({ error: 'Erro ao processar exclusão de assinatura' });
    }
}

async function handleInvoicePaid(invoice: any, res: any) {
    const subscriptionId = invoice.subscription;

    try {
        // Buscar o documento da assinatura no Firestore com base no subscriptionId
        const snapshot = await admin.firestore().collection('subscriptions').where('subscriptionId', '==', subscriptionId).get();

        if (snapshot.empty) {
            console.error(`Assinatura não encontrada para o ID ${subscriptionId}`);
            return res.status(404).send({ error: `Assinatura não encontrada para o ID ${subscriptionId}` });
        }

        const subscriptionDoc = snapshot.docs[0];
        await subscriptionDoc.ref.update({
            invoice: invoice,
        });

        res.status(200).send({ message: 'Fatura paga processada com sucesso' });
    } catch (error) {
        console.error('Erro ao processar fatura paga:', error);
        res.status(500).send({ error: 'Erro ao processar fatura paga' });
    }
}

async function handleInvoiceOverdue(invoice: any, res: any) {
    const subscriptionId = invoice.subscription;

    try {
        // Buscar o documento da assinatura no Firestore com base no subscriptionId
        const snapshot = await admin.firestore().collection('subscriptions').where('subscriptionId', '==', subscriptionId).get();

        if (snapshot.empty) {
            console.error(`Assinatura não encontrada para o ID ${subscriptionId}`);
            return res.status(404).send({ error: `Assinatura não encontrada para o ID ${subscriptionId}` });
        }

        const subscriptionDoc = snapshot.docs[0];
        await subscriptionDoc.ref.update({
            invoice: invoice,
        });

        res.status(200).send({ message: 'Fatura paga processada com sucesso' });
    } catch (error) {
        console.error('Erro ao processar fatura paga:', error);
        res.status(500).send({ error: 'Erro ao processar fatura paga' });
    }
}
