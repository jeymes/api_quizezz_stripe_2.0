import { Router } from 'express';
import { saveDefaultPaymentMethod } from '../controllers/saveDefaultPaymentMethod';

const saveDefaultPaymentMethodRoutes = Router();

saveDefaultPaymentMethodRoutes.post('/set-default-payment-method', saveDefaultPaymentMethod);

export default saveDefaultPaymentMethodRoutes;
