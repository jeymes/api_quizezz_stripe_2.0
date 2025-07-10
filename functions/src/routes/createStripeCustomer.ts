import { Router } from 'express';
import { createStripeCustomer } from '../controllers/createStripeCustomer';

const createStripeCustomerRouter = Router();

createStripeCustomerRouter.post('/create-stripe-customer', createStripeCustomer);

export default createStripeCustomerRouter;
