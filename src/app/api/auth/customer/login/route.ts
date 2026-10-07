import { prisma } from "@/lib/prisma";
import { supabaseSignIn } from "@/lib/supabase-auth";
import { setCustomerSessionCookie } from "@/lib/customer-auth";
import { handleCustomerLogin } from "@/lib/customer-login";
import {
  enforceRateLimits,
  getClientIp,
  getEmailRateLimitIdentifier,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const emailIdentifier = await getEmailRateLimitIdentifier(request);
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "customerLoginIp", identifier: getClientIp(request) },
    ...(emailIdentifier
      ? [
          {
            policy: "customerLoginAccount" as const,
            identifier: emailIdentifier,
          },
        ]
      : []),
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  return handleCustomerLogin(request, {
    db: prisma,
    authenticate: supabaseSignIn,
    issueSession: setCustomerSessionCookie,
  });
}
