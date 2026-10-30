"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const FAQS = [
  ["How do I place an order?", "Pick your items from the menu, choose a size and extras, add them to your cart and press Checkout. Fill in your delivery details and confirm."],
  ["Which payment methods can I use?", "Cash on Delivery and Easypaisa, depending on what is currently enabled. With Cash on Delivery you simply pay in cash when your order arrives."],
  ["How is my Easypaisa payment confirmed?", "After you pay, submit your transaction ID on the order page. Our team checks it and marks the payment as paid."],
  ["How much is delivery?", "Delivery depends on how far you are from the shop: free up to 1 km, then Rs. 79 for 1-2 km, Rs. 99 for 2-3 km, Rs. 149 for 3-4 km, Rs. 199 for 4-5 km, Rs. 219 for 5-6 km, Rs. 239 for 6-7 km, Rs. 249 for 7-8 km, Rs. 269 for 8-9 km and Rs. 299 for 9-10 km. We deliver within 10 km."],
  ["Is my payment information safe?", "We never ask for card details, PINs or passwords, and we never store them."],
  ["Can I track my order?", "Yes. Your order page shows whether your order is received or completed, and updates by itself."],
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