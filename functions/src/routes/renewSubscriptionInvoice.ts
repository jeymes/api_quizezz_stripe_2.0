import { Router } from 'express';
import { renewSubscriptionInvoice } from '../controllers/renewSubscriptionInvoice';

const renewSubscriptionInvoiceRoutes = Router();

renewSubscriptionInvoiceRoutes.post('/renew-subscription-invoice', renewSubscriptionInvoice);

export default renewSubscriptionInvoiceRoutes;
