"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  Landmark,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Truck,
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
      <main className="min-h-screen bg-[#05090f] text-white">
        <section className="container-primezora flex min-h-[70vh] items-center justify-center py-20">
          <div className="w-full max-w-lg border border-white/[0.08] bg-[#080d13] p-8 text-center">
            <Package
              size={38}
              className="mx-auto text-orange-400"
            />

            <p className="mt-6 font-display text-[10px] uppercase tracking-[0.3em] text-orange-400">
              Checkout
            </p>

            <h1 className="mt-3 font-display text-2xl font-bold uppercase">
              Your Cart Is Empty
            </h1>

            <p className="mt-4 text-sm leading-7 text-white/45">
              Add some products to your cart before
              continuing to checkout.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex h-12 items-center justify-center bg-orange-500 px-7 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-orange-400"
            >
              Browse Products
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      {/* Header */}
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Back to Cart
          </Link>

          <div className="mt-8">
            <p className="font-display text-[9px] uppercase tracking-[0.32em] text-orange-400">
              Primezora Checkout
            </p>

            <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Complete Your Order
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
              Enter your details and choose how you
              would like to receive your order.
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="container-primezora py-10 lg:py-14"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Customer Information */}
            <section className="border border-white/[0.07] bg-[#080d13]">
              <div className="border-b border-white/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
                    <CreditCard size={16} />
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

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
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
            <section className="border border-white/[0.07] bg-[#080d13]">
              <div className="border-b border-white/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
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

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
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
              <section className="border border-white/[0.07] bg-[#080d13]">
                <div className="border-b border-white/[0.06] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
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

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
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
              <section className="border border-orange-500/20 bg-orange-500/[0.04] p-5 sm:p-6">
                <div className="flex gap-4">
                  <Store
                    size={20}
                    className="mt-1 shrink-0 text-orange-400"
                  />

                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                      Store Pickup
                    </p>

                    <p className="mt-2 text-sm leading-7 text-white/50">
                      Place your order online and
                      visit the Primezora store to
                      collect your items.
                    </p>

                    <div className="mt-4 border-t border-white/[0.07] pt-4">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-white/30">
                        Store Address
                      </p>

                      <p className="mt-2 text-sm text-white/70">
                        Primezora Technologies
                      </p>

                      <p className="mt-1 text-xs leading-6 text-white/40">
                        Store address will be added
                        here.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Payment */}
            <section className="border border-white/[0.07] bg-[#080d13]">
              <div className="border-b border-white/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-orange-500/10 text-orange-400">
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

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
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
                  description="Payment instructions will be provided."
                />
              </div>
            </section>

            {/* Error */}
            {authenticationRequired ? (
              <div className="border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-xs leading-6 text-amber-200">
                <p>Your session expired. Sign in to place your order; your cart is still saved.</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  <Link
                    href="/login?next=%2Fcheckout"
                    className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register?next=%2Fcheckout"
                    className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            ) : error ? (
              <div className="border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-xs leading-6 text-red-300">
                {error}
              </div>
            ) : null}
          </div>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <section className="border border-white/[0.07] bg-[#080d13]">
              <div className="border-b border-white/[0.06] p-5">
                <p className="font-display text-[9px] uppercase tracking-[0.25em] text-orange-400">
                  Order Summary
                </p>

                <h2 className="mt-2 font-display text-lg font-bold uppercase">
                  Your Order
                </h2>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 border-b border-white/[0.05] p-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-white/[0.07] bg-black/20">
                      <img
                        src={item.product.image}
                        alt={
                          item.product.name
                        }
                        className="h-full w-full object-contain p-1"
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

              <div className="space-y-3 p-5">
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

                <div className="my-4 border-t border-white/[0.07]" />

                <div className="flex items-end justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                    Total
                  </span>

                  <span className="font-display text-xl font-bold text-orange-400">
                    LKR{" "}
                    {total.toLocaleString(
                      "en-LK"
                    )}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 flex h-14 w-full items-center justify-center gap-2 bg-orange-500 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <ShieldCheck size={13} />
                  Secure Checkout
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
          <span className="ml-1 text-orange-400">
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
        className="h-12 w-full border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/15 focus:border-orange-500/50"
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
      onClick={onClick}
      className={`relative text-left border p-4 transition ${
        selected
          ? "border-orange-500/60 bg-orange-500/[0.07]"
          : "border-white/[0.07] bg-black/10 hover:border-white/15"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-black">
          <Check size={11} />
        </div>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center border ${
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
      onClick={onClick}
      className={`relative text-left border p-4 transition ${
        selected
          ? "border-orange-500/60 bg-orange-500/[0.07]"
          : "border-white/[0.07] bg-black/10 hover:border-white/15"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-black">
          <Check size={11} />
        </div>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center border ${
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