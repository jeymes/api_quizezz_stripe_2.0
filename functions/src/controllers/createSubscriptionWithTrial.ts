import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import { saveSubscriptionToFirestore } from '../services/saveSubscription';

export const createSubscriptionWithTrial = async (req: Request, res: Response) => {
  const { customerId, paymentMethodId, priceId, email, name } = req.body;

  if (!customerId || !paymentMethodId || !priceId) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
  }

  try {
    // 🔒 Verifica se já usou trial
    const previousSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const hasUsedTrial = previousSubs.data.some(sub => sub.trial_end !== null);

    if (hasUsedTrial) {
      return res.status(403).json({
        error: 'Você já usou seu período de teste gratuito.',
      });
    }

    // ✅ cria a subscription COM cartão já validado
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 7,
      default_payment_method: paymentMethodId,
      metadata: {
        email,
        name,
      },
    });

    await saveSubscriptionToFirestore({
      customerId,
      subscriptionId: subscription.id,
      email,
      name,
    });

    return res.json({
      subscriptionId: subscription.id,
      customerId,
    });

  } catch (err: any) {
    console.error('[ActivateTrial] Erro:', err);
    return res.status(500).json({ error: err.message });
  }
};
