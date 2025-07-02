import { Router } from 'express';
import { getPaymentStatusHandler } from '../controllers/getPaymentStatus';

const paymentStatusRoutes = Router();

paymentStatusRoutes.post('/payment-status', getPaymentStatusHandler);

export default paymentStatusRoutes;
