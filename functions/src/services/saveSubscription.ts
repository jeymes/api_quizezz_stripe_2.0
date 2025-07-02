import admin from "../utils/firebase";

const db = admin.firestore();

interface SaveSubscriptionParams {
    subscriptionId: string;
    customerId: string;
}

export const saveSubscriptionToFirestore = async ({ subscriptionId, customerId }: SaveSubscriptionParams) => {
    try {
        await db.collection('subscriptions').doc(subscriptionId).set({
            customerId,
            subscriptionId,
            created: new Date(),
        });
        console.log('Assinatura salva no Firestore');
    } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
    }
};
