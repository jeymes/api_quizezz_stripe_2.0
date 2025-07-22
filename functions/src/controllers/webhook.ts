import admin from '../utils/firebase';
import stripe from '../utils/stripe';

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
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody,
            stripeSignature,
            process.env.STRIPE_ENDPOINT_SECRET as string
        );

        console.log('Evento recebido:', event);

        const dataObject = event.data.object as { id: string };
        const { id } = dataObject;

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpsert(dataObject);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(dataObject);
                break;

            case 'invoice.created':
            case 'invoice.finalized':
            case 'invoice.paid':
            case 'invoice.payment_succeeded':
                await handleInvoicePaid(dataObject);
                await updatePaymentStatus(id, 'succeeded');
                break;

            case 'invoice.updated':
                await updatePaymentStatus(id, 'processing');
                break;

            case 'invoice.payment_failed':
            case 'invoice.overdue':
            case 'invoice.voided':
                await handleInvoiceOverdue(dataObject);
                await updatePaymentStatus(id, 'failed');
                break;

            default:
                console.warn('Evento não tratado:', event.type);
        }

        res.sendStatus(200);
    } catch (err: any) {
        console.error('Erro ao verificar assinatura do webhook:', err.message);
        res.status(400).json({ error: 'Erro ao processar webhook', details: err.message });
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

// Funções auxiliares SEM receber o `res` e SEM enviar resposta HTTP
async function handleSubscriptionUpsert(subscription: any) {
    const subscriptionId = subscription.id;

    const snapshot = await admin.firestore()
        .collection('subscriptions')
        .where('subscriptionId', '==', subscriptionId)
        .get();

    if (snapshot.empty) {
        console.warn(`[Webhook] Assinatura ${subscriptionId} ainda não encontrada no Firestore. Ignorando por agora.`);
        return; // Silenciosamente ignora e responde com 200 OK
    }

    if (snapshot.empty) {
        await admin.firestore().collection('subscriptions').add({
            subscriptionId,
            subscription,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Assinatura ${subscriptionId} criada.`);
    } else {
        const docRef = snapshot.docs[0].ref;
        await docRef.update({
            subscription,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Assinatura ${subscriptionId} atualizada.`);
    }
}

async function handleSubscriptionDeleted(subscription: any) {
    const subscriptionId = subscription.id;

    const snapshot = await admin.firestore()
        .collection('subscriptions')
        .where('subscriptionId', '==', subscriptionId)
        .get();

    if (snapshot.empty) {
        console.warn(`[Webhook] Assinatura ${subscriptionId} ainda não encontrada no Firestore. Ignorando por agora.`);
        return; // Silenciosamente ignora e responde com 200 OK
    }

    const subscriptionDoc = snapshot.docs[0];
    await subscriptionDoc.ref.update({
        subscription,
    });

}

async function handleInvoicePaid(invoice: any) {
    const subscriptionId = invoice.subscription;

    const snapshot = await admin.firestore()
        .collection('subscriptions')
        .where('subscriptionId', '==', subscriptionId)
        .get();

    if (snapshot.empty) {
        console.warn(`[Webhook] Assinatura ${subscriptionId} ainda não encontrada no Firestore. Ignorando por agora.`);
        return; // Silenciosamente ignora e responde com 200 OK
    }

    const subscriptionDoc = snapshot.docs[0];
    await subscriptionDoc.ref.update({
        invoice,
    });

}

async function handleInvoiceOverdue(invoice: any) {
    const subscriptionId = invoice.subscription;

    const snapshot = await admin.firestore()
        .collection('subscriptions')
        .where('subscriptionId', '==', subscriptionId)
        .get();

    if (snapshot.empty) {
        console.warn(`[Webhook] Assinatura ${subscriptionId} ainda não encontrada no Firestore. Ignorando por agora.`);
        return; // Silenciosamente ignora e responde com 200 OK
    }

    const subscriptionDoc = snapshot.docs[0];
    await subscriptionDoc.ref.update({
        invoice,
    });

}