import express from 'express';
import cors from 'cors';
import subscriptionRoutes from './routes/subscription';
import productsRoutes from './routes/products';
import webhookRoutes from './routes/webhook';
import paymentStatusRoutes from './routes/paymentStatus';
import createCustomerRouter from './routes/createCustomer';


const app = express();

// Webhook precisa ser tratado com raw ANTES dos outros middlewares
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Middlewares globais
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173'
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
app.use('/api', paymentStatusRoutes);
app.use('/api', createCustomerRouter);

export default app;