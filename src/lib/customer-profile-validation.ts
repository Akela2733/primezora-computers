import { INPUT_LIMITS } from "@/lib/input-limits";

export const CUSTOMER_PROFILE_FIELD_MAX_LENGTHS = {
  firstName: INPUT_LIMITS.customer.firstName,
  lastName: INPUT_LIMITS.customer.lastName,
  phone: INPUT_LIMITS.customer.phone,
  address: INPUT_LIMITS.customer.address,
  city: INPUT_LIMITS.customer.city,
  province: INPUT_LIMITS.customer.province,
  postalCode: INPUT_LIMITS.customer.postalCode,
} as const;
