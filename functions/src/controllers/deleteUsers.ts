import { Request, Response } from "express";
import admin from "../utils/firebase";
import stripe from "../utils/stripe";

const auth = admin.auth();
const db = admin.firestore();
const bucket = admin.storage().bucket();

export const DeleteUsers = async (req: Request, res: Response) => {
  try {
    const { uid, subscriptionId, customerId } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "uid é obrigatório" });
    }


    if (subscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscriptionId);
      } catch (err: any) {
        console.error("Erro ao cancelar assinatura:", err.message);
        // não bloqueia o fluxo
      }
    }

   
    if (customerId) {
      try {
        await stripe.customers.del(customerId);
      } catch (err: any) {
        console.error("Erro ao deletar customer Stripe:", err.message);
        // não bloqueia o fluxo
      }
    }

    const batch = db.batch();

    batch.delete(db.doc(`users/${uid}`));
    batch.delete(db.doc(`dashboard/${uid}`));
    batch.delete(db.doc(`quizzes/${uid}`));
    batch.delete(db.doc(`responses/${uid}`));

    if (subscriptionId) {
      batch.delete(db.doc(`subscriptions/${subscriptionId}`));
    }

    await batch.commit();

    await Promise.all([
      bucket.deleteFiles({ prefix: `users/${uid}` }),
      bucket.deleteFiles({ prefix: `quizzes/${uid}` }),
    ]);
   
    await auth.deleteUser(uid);

    return res.status(200).json({
      message: "Usuário, assinatura e customer removidos com sucesso",
    });

  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error);
    return res.status(500).json({
      message: "Erro ao deletar usuário",
      error: error.message,
    });
  }
};