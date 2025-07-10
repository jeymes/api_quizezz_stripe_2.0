import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import Stripe from 'stripe';

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { priceId, customerId, paymentMethodId } = req.body;

        // 🔒 Validação antes de qualquer chamada
        if (!priceId || !customerId || !paymentMethodId) {
            res.status(400).json({ error: 'Campos obrigatórios ausentes' });
            return;
        }

        // 🔗 Vincula o cartão ao customer
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

        // 🔧 Define o cartão como padrão
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // 📦 Cria a assinatura
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            default_payment_method: paymentMethodId,
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card'],
            },
            expand: ['latest_invoice.payment_intent'],
            // automatic_payment_methods: { enabled: true }
        });

        console.log('subscription', subscription);

        const latestInvoiceId =
            typeof subscription.latest_invoice === 'string'
                ? subscription.latest_invoice
                : subscription.latest_invoice?.id;

        if (!latestInvoiceId) {
            res.status(400).json({ error: 'Invoice ID não encontrado.' });
            return;
        }

        // 🔁 Recupera a invoice já com payment_intent expandido
        const invoice = await stripe.invoices.retrieve(latestInvoiceId, {
            expand: ['payment_intent'],
        });
        console.log('invoice', invoice)
        //@ts-ignore
        let paymentIntent = invoice.payment_intent as Stripe.PaymentIntent | undefined;

        // 🔧 NOVA CONDIÇÃO: tenta finalizar se ainda não tem paymentIntent
        if (!paymentIntent && (invoice.status === 'open' || invoice.status === 'draft')) {
            const finalizedInvoice = await stripe.invoices.finalizeInvoice(latestInvoiceId, {
                expand: ['payment_intent'],
            });
            console.log('finalizedInvoice', finalizedInvoice)
            //@ts-ignore
            paymentIntent = finalizedInvoice.payment_intent as Stripe.PaymentIntent | undefined;
        }

        // Verificação final
        if (!paymentIntent) {
            return res.status(400).json({ error: 'PaymentIntent não encontrado ou inválido.' });
        }


        console.log('🧾 Invoice ID:', latestInvoiceId);
        console.log('💳 PaymentIntent:', paymentIntent?.id);
        console.log('🔐 Client Secret:', paymentIntent?.client_secret);

        // Retorna clientSecret para frontend usar no Elements
        return res.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
            isSetupIntent: false,
        });

    } catch (error: any) {
        console.error('Erro ao criar assinatura:', error.message);
        res.status(500).json({ error: error.message });
        return;
    }
};