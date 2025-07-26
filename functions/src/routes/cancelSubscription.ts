import express from 'express';
import { cancelSubscription } from '../controllers/cancelSubscription';

const cancelSubscriptionRoutes = express.Router();

cancelSubscriptionRoutes.post('/cancel-subscription', cancelSubscription);

export default cancelSubscriptionRoutes;
