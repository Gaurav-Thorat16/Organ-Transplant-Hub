import nodemailer from "nodemailer";
import twilio from "twilio";
import type { OrganType } from "@shared/schema";

type NotificationPatient = {
  name: string;
  email?: string;
};

type NotificationHospital = {
  name: string;
};

type RequestStatus = "ACCEPTED" | "REJECTED";

let transporter: nodemailer.Transporter | null | undefined;
let twilioClient: ReturnType<typeof twilio> | null | undefined;

function getEmailTransporter() {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

function getTwilioClient() {
  if (twilioClient !== undefined) return twilioClient;

  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;

  if (!sid || !token) {
    twilioClient = null;
    return twilioClient;
  }

  twilioClient = twilio(sid, token);
  return twilioClient;
}

export async function sendRequestReceivedEmail(
  patient: NotificationPatient,
  hospital: NotificationHospital,
  organType: OrganType,
): Promise<void> {
  if (!patient.email) return;

  const emailTransporter = getEmailTransporter();
  if (!emailTransporter) return;

  await emailTransporter.sendMail({
    from: process.env.SMTP_USER,
    to: patient.email,
    subject: "Transplant request received",
    text: `Hi ${patient.name}, your request for ${organType} at ${hospital.name} has been received and is pending review.`,
  });
}

export async function sendRequestStatusEmail(
  patient: NotificationPatient,
  status: RequestStatus,
  organType: OrganType,
  hospitalName: string,
): Promise<void> {
  if (!patient.email) return;

  const emailTransporter = getEmailTransporter();
  if (!emailTransporter) return;

  const statusText = status === "ACCEPTED" ? "accepted" : "rejected";

  await emailTransporter.sendMail({
    from: process.env.SMTP_USER,
    to: patient.email,
    subject: `Transplant request ${statusText}`,
    text: `Hi ${patient.name}, your ${organType} request at ${hospitalName} has been ${statusText}.`,
  });
}

export async function sendRequestStatusSMS(
  phone: string,
  status: RequestStatus,
  organType: OrganType,
  hospitalName: string,
): Promise<void> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_FROM;

  if (!client || !from || !phone) return;

  const statusText = status === "ACCEPTED" ? "ACCEPTED" : "REJECTED";

  await client.messages.create({
    from,
    to: phone,
    body: `Transplant update: Your ${organType} request at ${hospitalName} is ${statusText}.`,
  });
}
