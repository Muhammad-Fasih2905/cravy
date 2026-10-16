import { FiCreditCard, FiShoppingBag, FiTruck } from "react-icons/fi";
import { Reveal } from "@/components/Reveal";

const steps = [
  { icon: FiShoppingBag, title: "Choose your treats", text: "Pick your size and extras, then add everything to your cart." },
  { icon: FiCreditCard, title: "Pay your way", text: "Cash on delivery, Easypaisa or bank transfer. Never your PIN or password." },
  { icon: FiTruck, title: "Track it to your door", text: "Follow every step from confirmation to delivery on your order page." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-h">
      <div className="mb-10 text-center"><p className="chip">Easy ordering</p><h2 id="how-h" className="mt-3 text-3xl sm:text-5xl">Three steps to happy</h2></div>
      <ol className="relative grid gap-6 md:grid-cols-3">
        <div aria-hidden className="absolute left-[16%] right-[16%] top-14 hidden border-t-2 border-dashed border-vanilla-deep md:block" />
        {steps.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.1}>
            <li className="card relative h-full p-7 text-center">
              <span className="absolute right-5 top-3 font-display text-6xl font-extrabold text-vanilla" aria-hidden>{i + 1}</span>
              <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-3xl text-mango shadow-lift"><Icon aria-hidden /></span>
              <h3 className="mt-5 text-xl">{title}</h3><p className="mt-2 text-sm">{text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}