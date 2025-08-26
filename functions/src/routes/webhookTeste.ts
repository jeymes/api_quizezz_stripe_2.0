import { Router } from 'express';
import { webhookHandlerTeste } from '../controllers/webhookTeste';

const webhookRoutesTeste = Router();

// LEMBRE: webhook precisa ser tratado com express.raw() antes
webhookRoutesTeste.post('/', webhookHandlerTeste);

export default webhookRoutesTeste;
