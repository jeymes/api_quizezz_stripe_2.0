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

        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(dataObject);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(dataObject);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(dataObject);
                break;

            case 'invoice.created':
            case 'invoice.finalized':
            case 'invoice.paid':
            case 'invoice.payment_succeeded':
                await handleInvoicePaid(dataObject);
                break;

            case 'invoice.updated':
                break;

            case 'invoice.payment_failed':
            case 'invoice.overdue':
            case 'invoice.voided':
                await handleInvoiceOverdue(dataObject);
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

async function handleSubscriptionCreated(subscription: any) {
    const subscriptionId = subscription.id;

    const snapshot = await admin.firestore()
        .collection('subscriptions')
        .where('subscriptionId', '==', subscriptionId)
        .get();

    if (!snapshot.empty) {
        console.log(`[Webhook] Assinatura ${subscriptionId} já existe. Ignorando criação para evitar sobrescrever dados.`);
        return; // Já existe, não cria de novo para não sobrescrever
    }

    // Se não existe, cria
    await admin.firestore().collection('subscriptions').add({
        subscriptionId,
        subscription,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Webhook] Assinatura ${subscriptionId} criada.`);
};

async function handleSubscriptionUpdated(subscription: any) {
    const subscriptionId = subscription.id;

    const snapshot = await admin.firestore()
        .collection('subscriptions')
        .where('subscriptionId', '==', subscriptionId)
        .get();

    if (snapshot.empty) {
        console.warn(`[Webhook] Assinatura ${subscriptionId} não encontrada no update. Criando...`);
        // Cria se não existir
        await admin.firestore().collection('subscriptions').add({
            subscriptionId,
            subscription,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
    }

    const docRef = snapshot.docs[0].ref;

    await docRef.update({
        subscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Webhook] Assinatura ${subscriptionId} atualizada.`);
};

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

};

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

};

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

};