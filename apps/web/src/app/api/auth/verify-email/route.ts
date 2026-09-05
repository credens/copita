import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/auth-tokens";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (userId) await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.redirect(new URL(userId ? "/panel?email=verified" : "/login?email=invalid", request.url));
}
