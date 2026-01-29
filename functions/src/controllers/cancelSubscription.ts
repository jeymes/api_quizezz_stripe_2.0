import { Request, Response } from "express";
import stripe from "../utils/stripe";
import { sendCancelFeedbackEmail } from "../utils/cancelEmail";
import { FieldValue } from "firebase-admin/firestore";
import admin from "../utils/firebase";

export const cancelSubscription = async (req: Request, res: Response) => {
  const db = admin.firestore();

  const { subscriptionId, email, name, userId, reason } = req.body;

  if (!subscriptionId || !email || !name || !userId || !reason) {
    res
      .status(400)
      .json({
        error:
          "Campos obrigatórios: subscriptionId, email, name, userId e reason",
      });
    return;
  }

  try {
    const canceledSubscription =
      await stripe.subscriptions.cancel(subscriptionId);

    sendCancelFeedbackEmail(email, name).catch((err) => {
      console.error("Erro ao enviar e-mail de cancelamento:", err);
    });

    await sendCancelFeedbackEmail(email, name);

    await db.collection("cancelFeedback").doc(userId).set({
      userId,
      name,
      email,
      reason,
      createdAt: FieldValue.serverTimestamp(),
    },{ merge: true });

    res.json({
      message: "Assinatura cancelada com sucesso",
      subscription: canceledSubscription,
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error.message);
    res.status(500).json({ error: error.message });
  }
};
