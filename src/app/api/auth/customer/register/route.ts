import { prisma } from "@/lib/prisma";
import { supabaseSignUp } from "@/lib/supabase-auth";
import { handleCustomerRegistration } from "@/lib/customer-registration";
import {
  enforceRateLimits,
  getClientIp,
  getEmailRateLimitIdentifier,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const emailIdentifier = await getEmailRateLimitIdentifier(request);
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "customerRegistrationIp", identifier: getClientIp(request) },
    ...(emailIdentifier
      ? [
          {
            policy: "customerRegistrationAccount" as const,
            identifier: emailIdentifier,
          },
        ]
      : []),
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  return handleCustomerRegistration(request, {
    db: prisma,
    signUp: supabaseSignUp,
  });
}
