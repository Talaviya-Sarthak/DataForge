"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Faq, FaqCategory, FaqData } from "./types";

const FAQ = ({
  title = "Frequently Asked Questions",
  subtitle = "Let's answer some questions",
  categories,
  faqData,
}: {
  title?: string;
  subtitle?: string;
  categories: FaqCategory;
  faqData: FaqData;
}) => {
  const keys = Object.keys(categories);
  const [selected, setSelected] = useState(keys[0]);

  return (
    <section className="relative overflow-hidden bg-black px-4 py-20 text-white">
      {/* background glow */}

      <FAQHeader title={title} subtitle={subtitle} />
      <FAQTabs
        categories={categories}
        selected={selected}
        setSelected={setSelected}
      />
      <FAQList faqData={faqData} selected={selected} />
    </section>
  );
};

/* ---------------- HEADER ---------------- */

const FAQHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="relative z-10 mb-14 flex flex-col items-center text-center">
    <span className="mb-4 text-sm text-gray-400">{subtitle}</span>
    <h2 className="text-4xl font-bold md:text-5xl">{title}</h2>
  </div>
);

/* ---------------- TABS ---------------- */

const FAQTabs = ({
  categories,
  selected,
  setSelected,
}: {
  categories: FaqCategory;
  selected: string;
  setSelected: (key: string) => void;
}) => (
  <div className="relative z-10 mb-12 flex flex-wrap justify-center gap-4">
    {Object.entries(categories).map(([key, label]) => {
      const active = selected === key;

      return (
        <button
          key={key}
          onClick={() => setSelected(key)}
          className={`relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition ${
            active
              ? "text-black"
              : "text-gray-400 hover:text-white border border-white/10"
          }`}
        >
          <span className="relative z-10">{label as React.ReactNode}</span>

          <AnimatePresence>
            {active && (
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 z-0 bg-gradient-to-r from-teal-400 to-cyan-400"
              />
            )}
          </AnimatePresence>
        </button>
      );
    })}
  </div>
);

/* ---------------- LIST ---------------- */

const FAQList = ({
  faqData,
  selected,
}: {
  faqData: FaqData;
  selected: string;
}) => (
  <div className="relative z-10 mx-auto max-w-3xl">
    <AnimatePresence mode="wait">
      {Object.entries(faqData).map(([key, items]) =>
        key === selected ? (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {(items as Faq[]).map((faq, i) => (
              <FAQItem key={i} {...faq} />
            ))}
          </motion.div>
        ) : null
      )}
    </AnimatePresence>
  </div>
);

/* ---------------- ITEM ---------------- */

const FAQItem = ({ question, answer }: Faq) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f0f] transition-colors">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span
          className={`text-lg font-medium transition-colors ${
            isOpen ? "text-white" : "text-gray-400"
          }`}
        >
          {question}
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <Plus
            className={`h-5 w-5 ${
              isOpen ? "text-white" : "text-gray-400"
            }`}
          />
        </motion.span>
      </button>

      {/* Answer */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? contentRef.current?.scrollHeight : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.25, ease: "easeInOut" },
          opacity: { duration: 0.15 },
        }}
        className="overflow-hidden px-4"
      >
        <div ref={contentRef} className="pb-4">
          <p className="text-gray-400 leading-relaxed">
            {answer}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQ;
