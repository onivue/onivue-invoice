import { passkey } from "@better-auth/passkey";
import { db } from "@onivue-invoice/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { Resend } from "resend";

const isDev = process.env.NODE_ENV === "development";
const baseURL = isDev ? "http://localhost:3000" : "https://invoice.onivue.ch";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("[auth] RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export const auth = betterAuth({
  appName: "Onivue Invoice",
  database: drizzleAdapter(db, { provider: "pg" }),
  trustedOrigins: isDev
    ? ["http://localhost:3000", "http://localhost:3001"]
    : ["https://invoice.onivue.ch"],
  advanced: {
    useSecureCookies: !isDev,
  },
  plugins: [
    passkey({
      rpID: isDev ? "localhost" : "invoice.onivue.ch",
      rpName: "Onivue Invoice",
      origin: isDev
        ? ["http://localhost:3000", "http://localhost:3001"]
        : "https://invoice.onivue.ch",
      registration: {
        requireSession: true,
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        const resend = getResend();
        const { error } = await resend.emails.send({
          from: "Onivue Invoice <noreply@mail.onivue.ch>",
          to: email,
          subject: "Dein Login-Code",
          html: `
            <p>Hallo,</p>
            <p>Dein Einmal-Code für Onivue Invoice lautet:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace;">${otp}</p>
            <p>Der Code ist 5 Minuten gültig.</p>
            <p>Falls du diese Email nicht angefordert hast, kannst du sie ignorieren.</p>
          `,
        });
        if (error) {
          console.error("[auth] Resend error:", error);
          throw new Error(error.message);
        }
      },
    }),
    organization({
      sendInvitationEmail: async (data) => {
        const resend = getResend();
        const invitationUrl = `${baseURL}/accept-invitation/${data.invitation.id}`;
        const { error } = await resend.emails.send({
          from: "Onivue Invoice <noreply@mail.onivue.ch>",
          to: data.email,
          subject: `Einladung zu ${data.organization.name}`,
          html: `
            <p>Hallo,</p>
            <p><strong>${data.inviter.user.email}</strong> hat dich zu <strong>${data.organization.name}</strong> auf Onivue Invoice eingeladen.</p>
            <p><a href="${invitationUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Einladung annehmen</a></p>
            <p>Falls du diese Einladung nicht erwartet hast, kannst du diese Email ignorieren.</p>
          `,
        });
        if (error) {
          console.error("[auth] Resend error:", error);
          throw new Error(error.message);
        }
      },
    }),
  ],
});

export type Auth = typeof auth;
