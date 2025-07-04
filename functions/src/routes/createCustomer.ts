import { Router } from 'express';
import { createCustomerAndSetupIntent } from '../controllers/createCustomer';

const createCustomerRouter = Router();

createCustomerRouter.post('/create-customer', createCustomerAndSetupIntent);

export default createCustomerRouter;
