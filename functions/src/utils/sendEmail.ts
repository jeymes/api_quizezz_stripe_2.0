import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (email: string, name: string, password: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: '"Quizezz" <no-reply@quizezz.com>',
    to: email,
    subject: "Bem-vindo ao nosso sistema",
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">Olá, ${name}!</h2>
      <p>Você foi registrado com sucesso em nosso sistema.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Senha temporária:</strong> <code style="background: #f4f4f4; padding: 4px;">${password}</code></p>
      <p style="margin-top: 20px;">
        Faça login clicando no botão abaixo ou copie e cole o link no navegador:
      </p>
      <a href="http://localhost:3000/signin" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
        Acessar sistema
      </a>
      <p>Link direto: <a href="http://localhost:3000/signin">http://localhost:3000/signin</a></p>
      <p>Recomendamos que altere sua senha após o primeiro acesso.</p>
      <p>Abraços,<br>Sua equipe</p>
  </div>
`,
  };

  await transporter.sendMail(mailOptions);
};