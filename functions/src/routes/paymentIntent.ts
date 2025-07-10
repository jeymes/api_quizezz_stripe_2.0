import { Router } from 'express';
import { createSetupIntent } from '../controllers/paymentIntent';

const paymentIntentRouter = Router();

paymentIntentRouter.post('/create-payment-intent', createSetupIntent);

export default paymentIntentRouter;
