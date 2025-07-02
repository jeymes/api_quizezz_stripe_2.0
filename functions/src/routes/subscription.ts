import { Router } from 'express';
import { createSubscription } from '../controllers/subscription';

const subscriptionRoutes = Router();

subscriptionRoutes.post('/payment-sheet', createSubscription);

export default subscriptionRoutes;
