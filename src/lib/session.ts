import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("SESSION_SECRET must be set and at least 32 characters long");
}

export interface CustomerSessionData {
  customerId: string;
}

export interface AdminSessionData {
  adminId: string;
}

const customerSessionOptions = {
  cookieName: "malabi_customer_session",
  password: secret,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

const adminSessionOptions = {
  cookieName: "malabi_admin_session",
  password: secret,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getCustomerSession(): Promise<IronSession<CustomerSessionData>> {
  return getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions);
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(await cookies(), adminSessionOptions);
}
