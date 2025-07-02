import express from 'express';
import cors from 'cors';
import subscriptionRoutes from './routes/subscription';
import productsRoutes from './routes/products';
import webhookRoutes from './routes/webhook';
import paymentStatusRoutes from './routes/paymentStatus';


const app = express();

// Webhook precisa ser tratado com raw ANTES dos outros middlewares
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Middlewares globais
app.use(cors({ origin: true }));
app.use(express.json());

// Rotas
app.use('/api', subscriptionRoutes);
app.use('/api', productsRoutes);
app.use('/api', webhookRoutes);
app.use('/api', paymentStatusRoutes);

export default app;
