import { Router } from 'express';
import { createSubscriptionWithTrial } from '../controllers/createSubscriptionWithTrial';

const createSubscriptionWithTrialRoutes = Router();

createSubscriptionWithTrialRoutes.post('/create-subscription-with-trial', createSubscriptionWithTrial);

export default createSubscriptionWithTrialRoutes;