import { Router } from 'express';
import { webhookHandler } from '../controllers/webhook';

const webhookRoutes = Router();

// LEMBRE: webhook precisa ser tratado com express.raw() antes
webhookRoutes.post('/webhook', webhookHandler);

export default webhookRoutes;
