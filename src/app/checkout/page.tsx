"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  Landmark,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { FormEvent, useRef, useState } from "react";

import { useCart } from "@/context/CartContext";
import { DELIVERY_FEE } from "@/lib/payment";

import type {
  CustomerDetails,
  DeliveryMethod,
  PaymentMethod,
} from "@/types/order";

type FormData = CustomerDetails;

type CreateOrderResponse = {
  error?: string;
  payment?: {
    redirectUrl?: string | null;
    checkoutFields?: Record<string, string> | null;
  };
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
  };
};

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  district: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const checkoutAttempt = useRef<{ requestBody: string; key: string } | null>(
    null
  );

  const {
    items,
    subtotal,
    clearCart,
  } = useCart();

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cod");

  const [formData, setFormData] =
    useState<FormData>(initialFormData);

  const [error, setError] =
    useState("");

  const [authenticationRequired, setAuthenticationRequired] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const deliveryFee =
    deliveryMethod === "delivery"
      ? DELIVERY_FEE
      : 0;

  const total =
    subtotal + deliveryFee;

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setAuthenticationRequired(false);

    if (items.length === 0) {
      setError(
        "Your cart is empty. Please add products before checkout."
      );

      return;
    }

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim()
    ) {
      setError(
        "Please enter your first name and last name."
      );

      return;
    }

    if (!formData.phone.trim()) {
      setError(
        "Please enter your phone number."
      );

      return;
    }

    if (
      deliveryMethod === "delivery" &&
      (
        !formData.address.trim() ||
        !formData.city.trim() ||
        !formData.district.trim()
      )
    ) {
      setError(
        "Please complete your delivery address."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = JSON.stringify({
        customer: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address:
            deliveryMethod === "delivery"
              ? formData.address.trim()
              : "",
          city:
            deliveryMethod === "delivery"
              ? formData.city.trim()
              : "",
          district:
            deliveryMethod === "delivery"
              ? formData.district.trim()
              : "",
          postalCode:
            deliveryMethod === "delivery"
              ? formData.postalCode.trim()
              : "",
        },
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryMethod,
        paymentMethod,
      });

      if (checkoutAttempt.current?.requestBody !== requestBody) {
        checkoutAttempt.current = {
          requestBody,
          key: crypto.randomUUID(),
        };
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutAttempt.current.key,
        },
        body: requestBody,
      });

      const data =
        (await response.json()) as CreateOrderResponse;

      if (response.status === 401) {
        setAuthenticationRequired(true);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to place your order."
        );
      }

      if (!data.order?.id || !data.order.orderNumber) {
        throw new Error("The order was created but its confirmation could not be loaded.");
      }

      clearCart();

      router.push(
        `/order-success?order=${encodeURIComponent(
          data.order.orderNumber
        )}`
      );
    } catch (error) {
      console.error(
        "Failed to create order:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order. Please try again."
      );

      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#030505] text-white/90">
        <section className="container-primezora flex min-h-[70vh] items-center justify-center py-20">
          <div className="w-full max-w-lg rounded-xl border border-orange-500/25 bg-white/[0.02] p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/[0.07] text-orange-400">
              <Package size={25} />
            </span>

            <p className="mt-5 font-display text-[9px] font-bold uppercase tracking-[0.25em] text-orange-500">
              Checkout
            </p>

            <h1 className="mt-2 font-display text-2xl font-bold uppercase text-white">
              Your cart is empty
            </h1>

            <p className="mt-2 text-xs leading-5 text-white/50">
              Add products to your cart before continuing to checkout.
            </p>

            <Link
              href="/shop"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-5 text-[10px] font-bold uppercase tracking-wide text-black transition hover:bg-orange-400"
            >
              <ArrowRight size={13} />
              Browse products
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <section className="relative isolate overflow-hidden border-b border-orange-500/35 bg-[#030505]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-[58%_53%] md:bg-center"
          style={{
            backgroundImage:
              'url("/banners/hero%20section%20background%20image.png")',
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,5,5,0.97)_0%,rgba(3,5,5,0.85)_36%,rgba(3,5,5,0.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/55 via-transparent to-[#030505]/10" />
        <div className="container-primezora flex min-h-[240px] items-center justify-between gap-6 py-9 sm:min-h-[270px] sm:py-12">
          <div className="max-w-lg">
            <p className="flex items-center gap-2 font-display text-[9px] font-bold uppercase tracking-[0.24em] text-orange-400">
              <span className="h-px w-6 bg-orange-500" />
              Secure checkout
            </p>
            <h1 className="mt-3 font-display text-3xl font-black uppercase leading-[0.98] tracking-tight text-white sm:text-5xl">
              Complete your
              <br />
              <span className="text-orange-500">order.</span>
            </h1>
            <p className="mt-3 max-w-sm text-[11px] leading-5 text-white/70 sm:text-xs">
              Enter your details and choose how you would like to receive your
              order.
            </p>
            <Link
              href="/cart"
              className="mt-4 inline-flex items-center gap-2 text-[10px] font-medium text-white/75 transition hover:text-orange-400"
            >
              <ArrowLeft size={13} className="text-orange-500" />
              Back to cart
            </Link>
          </div>
          <div className="hidden shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-wide text-white/65 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-black">
              1
            </span>
            <span className="text-orange-300">Details</span>
            <span className="mx-1 h-px w-5 bg-white/20" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-white/55">
              2
            </span>
            <span>Payment</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
      </section>

      <form
        onSubmit={handleSubmit}
        className="container-primezora py-5 sm:py-7"
      >
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-5">
          {/* LEFT */}
          <div className="space-y-4">
            {/* Customer Information */}
            <section className="rounded-xl border border-white/[0.1] bg-white/[0.02]">
              <div className="border-b border-white/[0.08] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.06] text-orange-500">
                    <UserRound size={16} />
                  </div>

                  <div>
                    <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                      Step 01
                    </p>

                    <h2 className="mt-1 font-display text-sm font-bold uppercase">
                      Customer Information
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <InputField
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(value) =>
                    updateField(
                      "firstName",
                      value
                    )
                  }
                  placeholder="John"
                />

                <InputField
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(value) =>
                    updateField(
                      "lastName",
                      value
                    )
                  }
                  placeholder="Doe"
                />

                <InputField
                  label="Phone Number"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value
                    )
                  }
                  placeholder="07X XXX XXXX"
                />

                <InputField
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value
                    )
                  }
                  placeholder="you@example.com"
                />
              </div>
            </section>

            {/* Delivery Method */}
            <section className="rounded-xl border border-white/[0.1] bg-white/[0.02]">
              <div className="border-b border-white/[0.08] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.06] text-orange-500">
                    <Truck size={16} />
                  </div>

                  <div>
                    <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                      Step 02
                    </p>

                    <h2 className="mt-1 font-display text-sm font-bold uppercase">
                      Delivery Method
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <DeliveryOption
                  selected={
                    deliveryMethod ===
                    "delivery"
                  }
                  onClick={() =>
                    setDeliveryMethod(
                      "delivery"
                    )
                  }
                  icon={<Truck size={17} />}
                  title="Islandwide Delivery"
                  description="Get your order delivered anywhere in Sri Lanka."
                  price={`LKR ${DELIVERY_FEE}`}
                />

                <DeliveryOption
                  selected={
                    deliveryMethod ===
                    "pickup"
                  }
                  onClick={() =>
                    setDeliveryMethod(
                      "pickup"
                    )
                  }
                  icon={<Store size={17} />}
                  title="Store Pickup"
                  description="Visit our store and collect your order."
                  price="FREE"
                />
              </div>
            </section>

            {/* Address */}
            {deliveryMethod === "delivery" && (
              <section className="rounded-xl border border-white/[0.1] bg-white/[0.02]">
                <div className="border-b border-white/[0.08] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.06] text-orange-500">
                      <MapPin size={16} />
                    </div>

                    <div>
                      <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                        Delivery
                      </p>

                      <h2 className="mt-1 font-display text-sm font-bold uppercase">
                        Delivery Address
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Address"
                      required
                      value={
                        formData.address
                      }
                      onChange={(value) =>
                        updateField(
                          "address",
                          value
                        )
                      }
                      placeholder="House number, street name"
                    />
                  </div>

                  <InputField
                    label="City"
                    required
                    value={formData.city}
                    onChange={(value) =>
                      updateField(
                        "city",
                        value
                      )
                    }
                    placeholder="Ratnapura"
                  />

                  <InputField
                    label="District"
                    required
                    value={
                      formData.district
                    }
                    onChange={(value) =>
                      updateField(
                        "district",
                        value
                      )
                    }
                    placeholder="Ratnapura"
                  />

                  <InputField
                    label="Postal Code"
                    value={
                      formData.postalCode
                    }
                    onChange={(value) =>
                      updateField(
                        "postalCode",
                        value
                      )
                    }
                    placeholder="70000"
                  />
                </div>
              </section>
            )}

            {/* Pickup */}
            {deliveryMethod === "pickup" && (
              <section className="rounded-xl border border-orange-500/25 bg-orange-500/[0.04] p-5 sm:p-6">
                <div className="flex gap-4">
                  <Store
                    size={20}
                    className="mt-1 shrink-0 text-orange-500"
                  />

                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                      Store Pickup
                    </p>

                    <p className="mt-2 text-sm leading-7 text-white/50">
                      Contact us to confirm the collection location before
                      visiting the store.
                    </p>

                    <Link
                      href="/contact"
                      className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-orange-400 underline underline-offset-4 transition hover:text-orange-300"
                    >
                      Contact us about store pickup
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Payment */}
            <section className="rounded-xl border border-white/[0.1] bg-white/[0.02]">
              <div className="border-b border-white/[0.08] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.06] text-orange-500">
                    <Banknote size={16} />
                  </div>

                  <div>
                    <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                      Step 03
                    </p>

                    <h2 className="mt-1 font-display text-sm font-bold uppercase">
                      Payment Method
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <PaymentOption
                  selected={
                    paymentMethod ===
                    "cod"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "cod"
                    )
                  }
                  icon={
                    <Banknote size={17} />
                  }
                  title="Cash on Delivery"
                  description="Pay when your order arrives."
                />

                <PaymentOption
                  selected={
                    paymentMethod ===
                    "bank"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "bank"
                    )
                  }
                  icon={
                    <Landmark size={17} />
                  }
                  title="Bank Transfer"
                  description="Transfer to our bank account and use the unique payment reference shown after checkout."
                />

              </div>
            </section>

            {/* Error */}
            {authenticationRequired ? (
              <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.06] px-5 py-4 text-xs leading-6 text-orange-300">
                <p>Your session expired. Sign in to place your order; your cart is still saved.</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  <Link
                    href="/login?next=%2Fcheckout"
                    className="font-semibold text-orange-300 underline underline-offset-4 hover:text-orange-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register?next=%2Fcheckout"
                    className="font-semibold text-orange-300 underline underline-offset-4 hover:text-orange-200"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-xs leading-6 text-red-300">
                {error}
              </div>
            ) : null}
          </div>

          {/* RIGHT */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <section className="overflow-hidden rounded-xl border border-orange-500/35 bg-[#030505]">
              <div className="border-b border-white/[0.08] px-4 py-3.5">
                <p className="font-display text-[9px] uppercase tracking-[0.2em] text-orange-400">
                  Order Summary
                </p>

                <h2 className="mt-1 font-display text-base font-bold uppercase text-white">
                  Your Order
                </h2>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 border-b border-white/[0.08] p-3.5"
                  >
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.08] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1),transparent_65%),#060808]">
                      <Image
                        src={item.product.image}
                        alt={
                          item.product.name
                        }
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs leading-5 text-white/70">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-[10px] text-white/35">
                        Qty:{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-bold text-orange-400">
                      LKR{" "}
                      {(
                        item.product.price *
                        item.quantity
                      ).toLocaleString(
                        "en-LK"
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4">
                <SummaryRow
                  label="Subtotal"
                  value={`LKR ${subtotal.toLocaleString(
                    "en-LK"
                  )}`}
                />

                <SummaryRow
                  label="Delivery"
                  value={
                    deliveryFee === 0
                      ? "FREE"
                      : `LKR ${deliveryFee.toLocaleString(
                          "en-LK"
                        )}`
                  }
                />

                <div className="my-4 border-t border-white/[0.1]" />

                <div className="flex items-end justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                    Total
                  </span>

                  <span className="font-display text-xl font-bold text-orange-500">
                    LKR{" "}
                    {total.toLocaleString(
                      "en-LK"
                    )}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-3 text-[10px] font-bold uppercase tracking-wide text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <Check size={15} />
                      Place Order
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 pt-3 text-[9px] uppercase tracking-[0.12em] text-white/25">
                  <ShieldCheck size={13} className="text-orange-500" />
                  Secure checkout
                </div>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </main>
  );
}

/* ----------------------------- */
/* Input Field */
/* ----------------------------- */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-white/[0.1] bg-white/[0.03] px-3.5 text-xs text-white/90 outline-none transition placeholder:text-white/25 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
      />
    </label>
  );
}

/* ----------------------------- */
/* Delivery Option */
/* ----------------------------- */

function DeliveryOption({
  selected,
  onClick,
  icon,
  title,
  description,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 ${
        selected
          ? "border-orange-500/50 bg-orange-500/[0.07]"
          : "border-white/[0.1] bg-white/[0.02] hover:border-orange-500/30"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-black">
          <Check size={11} />
        </div>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
          selected
            ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
            : "border-white/10 text-white/40"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold text-white/80">
        {title}
      </p>

      <p className="mt-2 text-[10px] leading-5 text-white/35">
        {description}
      </p>

      <p
        className={`mt-3 font-display text-[10px] font-bold ${
          selected
            ? "text-orange-400"
            : "text-white/40"
        }`}
      >
        {price}
      </p>
    </button>
  );
}

/* ----------------------------- */
/* Payment Option */
/* ----------------------------- */

function PaymentOption({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 ${
        selected
          ? "border-orange-500/50 bg-orange-500/[0.07]"
          : "border-white/[0.1] bg-white/[0.02] hover:border-orange-500/30"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-black">
          <Check size={11} />
        </div>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
          selected
            ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
            : "border-white/10 text-white/40"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold text-white/80">
        {title}
      </p>

      <p className="mt-2 text-[10px] leading-5 text-white/35">
        {description}
      </p>
    </button>
  );
}

/* ----------------------------- */
/* Summary Row */
/* ----------------------------- */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </span>

      <span className="text-xs font-medium text-white/65">
        {value}
      </span>
    </div>
  );
}