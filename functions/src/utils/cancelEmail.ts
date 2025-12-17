import nodemailer from "nodemailer";

export const sendCancelFeedbackEmail = async (email: string, name: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"Quizezz" <no-reply@quizezz.com>',
    replyTo: "suporte@quizezz.com",
    to: email,
    subject: "Lamentamos ver você partir 😢",
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #333;">Olá, ${name}</h2>
        <p>Recebemos o seu cancelamento e gostaríamos de agradecer por ter feito parte da Quizezz 💚</p>
        <p>Seu feedback é muito importante para nós. Você pode enviar o motivo diretamente pelo app.</p>
        <p>Se desejar voltar no futuro, estaremos de braços abertos para recebê-lo novamente!</p>
        <p>Abraços,<br><strong>Equipe Quizezz</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};