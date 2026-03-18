import 'dotenv/config';
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: 'smtp.fastmail.com',
    port: 587,
    secure: false, // TLS requires secureConnection: false for 587
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
}).then(info => {
    console.log('Sent:', info.messageId);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
