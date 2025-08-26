import { FieldValue } from "firebase-admin/firestore";
import admin from "../utils/firebase";
import { sendWelcomeEmail } from "../utils/sendEmail";
import { generateRandomPassword } from "../utils/passwordUtils";

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
                const password = generateRandomPassword(); // 🔑 Senha temporária
                userRecord = await auth.createUser({ email, password });
                console.log(`Usuário criado no Auth: ${userRecord.uid}`);

                await sendWelcomeEmail(email, name, password); // 📧 Envia e-mail com senha
            } else {
                throw err;
            }
        }

        const uid = userRecord.uid;

        // Salva dados do usuário no Firestore
        await db.collection("users").doc(uid).set(
            {
                email,
                name,
                id: uid,
                customerId,
                subscriptionId,
                hasUsedTrial: true,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        // Salva dados da assinatura no Firestore
        await db.collection("subscriptions").doc(subscriptionId).set(
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