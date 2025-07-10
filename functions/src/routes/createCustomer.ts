import { Router } from 'express';
import { createCustomerAndSetupIntent } from '../controllers/createCustomer';

const createCustomerRouter = Router();

createCustomerRouter.post('/create-customer-and-setup-intent', createCustomerAndSetupIntent);

export default createCustomerRouter;
