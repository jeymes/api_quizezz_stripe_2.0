import stripe from "../utils/stripe";

export const getProductsWithPrices = async (req: any, res: any) => {
    try {
        // 1. Buscar produtos
        const products = await stripe.products.list({ limit: 10 }); // Você pode ajustar o limite

        // 2. Para cada produto, buscar os preços associados
        const productsWithPrices = await Promise.all(
            products.data.map(async (product) => {
                const prices = await stripe.prices.list({
                    product: product.id,
                });

                return {
                    ...product,
                    prices: prices.data, // Associando os preços ao produto
                };
            })
        );

        return res.status(200).json(productsWithPrices);
    } catch (error) {
        console.error('Erro ao buscar produtos com preços:', error);
        return res.status(500).send('Erro ao buscar produtos e preços');
    }
};
