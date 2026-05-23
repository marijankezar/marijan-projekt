import { NextResponse } from 'next/server';
import pool from '@/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
  }

  // Immer gleiche Antwort zurückgeben — kein User-Enumeration-Leak
  const ok = NextResponse.json({ success: true });

  const result = await pool.query(
    'SELECT id, username FROM personlogin WHERE LOWER(email) = $1',
    [email]
  );
  if (result.rowCount === 0) return ok;

  const user = result.rows[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Stunde

  // Alte Token für diesen User löschen
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  );

  const appUrl = process.env.APP_URL ?? 'https://kezar.at';
  const resetUrl = `${appUrl}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"Kežar App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Passwort zurücksetzen',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Passwort zurücksetzen</h2>
        <p style="color: #374151;">Hallo <strong>${user.username}</strong>,</p>
        <p style="color: #374151;">Du hast eine Passwort-Zurücksetzung angefordert. Klicke auf den Button um ein neues Passwort zu setzen:</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">
          Neues Passwort setzen
        </a>
        <p style="color: #6b7280; font-size: 14px;">Der Link ist <strong>1 Stunde</strong> gültig.</p>
        <p style="color: #6b7280; font-size: 14px;">Falls du keine Zurücksetzung angefordert hast, ignoriere diese E-Mail.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Kežar App · kezar.at</p>
      </div>
    `,
  });

  return ok;
}
