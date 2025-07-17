import { FieldValue } from "firebase-admin/firestore";
import admin from "../utils/firebase";

interface SaveSubscriptionInput {
    customerId: string;
    subscriptionId: string;
    email: string;
    name: string;
}

export const saveSubscriptionToFirestore = async ({
    customerId,
    subscriptionId,
    email,
    name,
}: SaveSubscriptionInput) => {
    const auth = admin.auth();
    const db = admin.firestore();

    try {
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log(`Usuário já existe no Auth: ${userRecord.uid}, atualizando dados.`);
        } catch (err: any) {
            if (err.code === "auth/user-not-found") {
                userRecord = await auth.createUser({ email });
                console.log(`Usuário criado no Auth: ${userRecord.uid}`);
            } else {
                throw err;
            }
        }

        const uid = userRecord.uid;

        // Atualiza ou cria dados do usuário no Firestore
        await db.collection("users").doc(uid).set(
            {
                email,
                name,
                id: uid,
                customerId,
                subscriptionId,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        // Atualiza ou cria a assinatura vinculada ao uid
        await db.collection("subscriptions").doc(uid).set(
            {
                userId: uid,
                customerId,
                subscriptionId,
                email,
                name,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        console.log(`Assinatura ${subscriptionId} salva/atualizada com sucesso para o usuário ${email}`);
    } catch (error) {
        console.error("Erro ao salvar assinatura e criar/atualizar usuário:", error);
        throw error;
    }
};