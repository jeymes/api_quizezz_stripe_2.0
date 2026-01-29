import { Request, Response } from 'express';
import stripe from '../utils/stripe';
import admin from '../utils/firebase';

export const createTrialSetup = async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    let customer = (await stripe.customers.list({ email, limit: 1 })).data[0];

    if (!customer) {
      customer = await stripe.customers.create({ email, name });
    }

    // 🔒 Verifica se já usou trial
    const previousSubs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });

    const hasUsedTrial = previousSubs.data.some(sub => sub.trial_end !== null);

    const userDoc = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .where('hasUsedTrial', '==', true)
      .limit(1)
      .get();

    if (hasUsedTrial || !userDoc.empty) {
      return res.status(403).json({
        error: 'Você já usou seu período de teste gratuito.',
      });
    }

    // ✅ SOMENTE setup
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
    });

    return res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    });

  } catch (err: any) {
    console.error('[TrialSetup] Erro:', err);
    return res.status(500).json({ error: err.message });
  }
};
