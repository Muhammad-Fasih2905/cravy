"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const FAQS = [
  ["How do I place an order?", "Pick your items from the menu, choose a size and extras, add them to your cart and press Checkout. Fill in your delivery details and confirm."],
  ["Which payment methods can I use?", "Cash on Delivery, Easypaisa and bank transfer, depending on what is currently enabled. Transfer details appear on your order page after you order."],
  ["How is my Easypaisa or bank payment confirmed?", "After you transfer, submit your transaction ID on the order page. Our team checks it and marks the payment as paid."],
  ["Is my payment information safe?", "We never ask for card details, PINs or passwords, and we never store them."],
  ["Can I track my order?", "Yes. Your order page shows each step from confirmation to delivery."],
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" aria-labelledby="faq-h" className="mx-auto max-w-3xl">
      <h2 id="faq-h" className="mb-6 text-center text-3xl">Questions? We have answers</h2>
      <div className="space-y-3">
        {FAQS.map(([q, a], i) => (
          <div key={q} className="card overflow-hidden">
            <button className="flex min-h-[56px] w-full items-center justify-between gap-3 px-5 py-3 text-left font-bold text-forest"
              aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {q}<motion.span animate={{ rotate: open === i ? 180 : 0 }} aria-hidden><FiChevronDown /></motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-5 pb-4">{a}</motion.p>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
