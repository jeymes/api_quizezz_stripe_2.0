import { Router } from 'express';
import { getProductsWithPrices } from '../controllers/getProductsWithPrices';

const productsRoutes = Router();

productsRoutes.get('/products-with-prices', getProductsWithPrices);

export default productsRoutes;
