import { Router } from 'express';
import { createSubscriptionWithTrial } from '../controllers/createSubscriptionWithTrial';

const createSubscriptionWithTrialRoutes = Router();

createSubscriptionWithTrialRoutes.post('/create-subscription-free', createSubscriptionWithTrial);

export default createSubscriptionWithTrialRoutes;
