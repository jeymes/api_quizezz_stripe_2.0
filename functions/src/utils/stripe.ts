import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config(); // Carrega variáveis do .env

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    throw new Error('Stripe secret key is not defined in .env file.');
}

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-06-30.basil',
});

export default stripe;
