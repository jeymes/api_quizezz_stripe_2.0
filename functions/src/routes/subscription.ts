import { Router } from 'express';
import { createSubscription } from '../controllers/subscription';

const subscriptionRoutes = Router();

subscriptionRoutes.post('/create-subscription', createSubscription);

export default subscriptionRoutes;
