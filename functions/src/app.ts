import express from 'express';
import cors from 'cors';
import subscriptionRoutes from './routes/subscription';
import productsRoutes from './routes/products';
import webhookRoutes from './routes/webhook';
import createCustomerRouter from './routes/createCustomer';
import renewSubscriptionInvoiceRoutes from './routes/renewSubscriptionInvoice';
import cancelSubscriptionRoutes from './routes/cancelSubscription';


const app = express();

// Webhook precisa ser tratado com raw ANTES dos outros middlewares
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Middlewares globais
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'quizezz.com.br',
    'https://hosting-quizezz--quizezz-b0738.us-central1.hosted.app',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());

// Rotas
app.use('/api', subscriptionRoutes);
app.use('/api', productsRoutes);
app.use('/api', webhookRoutes);
app.use('/api', createCustomerRouter);
app.use('/api', renewSubscriptionInvoiceRoutes);
app.use('/api', cancelSubscriptionRoutes);

export default app;

// [1] Cria customer + setup intent-- > backend: /create-customer-and-setup-intent
// [2] Mostra PaymentElement no front-- > <Elements />
// [3] User insere o cartão e envia-- > form.handleSubmit()
// [4] Usa paymentMethod + customerId-- > backend: /create-subscription
// [5] Stripe cria assinatura + invoice-- > retorna clientSecret da invoice.payment_intent
