'use strict';
const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        logger.warn('SMTP not configured — emails will only be logged in dev');
        return null;
    }
    _transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    return _transporter;
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
    const t = getTransporter();
    if (!t) {
        logger.info({ to, resetUrl }, 'DEV password reset link');
        return;
    }
    await t.sendMail({
        from: '"Trajex" <' + env.SMTP_FROM + '>',
        to,
        subject: 'Reset your Trajex password',
        html: '<p>Hi ' + name + ', <a href="' + resetUrl + '">Reset Password</a>. Expires in 1 hour.</p>',
    });
}

async function sendInviteEmail({ to, name, tempPassword }) {
    const t = getTransporter();
    if (!t) {
        logger.info({ to, tempPassword }, 'DEV invite link');
        return;
    }
    await t.sendMail({
        from: '"Trajex" <' + env.SMTP_FROM + '>',
        to,
        subject: "You've been invited to join a workspace on Trajex",
        text: `Hi ${name},\n\nYou've been invited to join a delivery workspace on Trajex.\nLogin at ${env.FRONTEND_URL}/login\nEmail: ${to}\nTemporary password: ${tempPassword}\nPlease change your password after first login.`,
    });
}

module.exports = { sendPasswordResetEmail, sendInviteEmail };
