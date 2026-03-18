import 'dotenv/config';
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: 'smtp.fastmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'filip@vandenit.be',
        pass: process.env.EMAIL_PASSWORD
    }
});
transporter.verify().then(() => {
    console.log('SMTP connection verified');
    return transporter.sendMail({
        from: 'filip@vandenit.be',
        to: 'filip@vandenit.be',
        subject: 'Test SMTP',
        text: 'This is a test.'
    });
}).then(info => console.log('Sent:', info.messageId))
.catch(err => console.error('Error:', err));
