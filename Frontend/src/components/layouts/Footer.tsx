'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MdOutlineEmail } from "react-icons/md";
import { FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";
import { FrameIcon } from 'lucide-react';
interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

// Footer navigation links organized by sections
const footerLinks: FooterSection[] = [
  {
    label: 'Product',
    links: [
      { title: 'Features', href: '#features' },
      { title: 'How It Works', href: '#how-it-works' },
      { title: 'Model Leaderboard', href: '#models' },
      { title: 'Security', href: '/security' },
    ],
  },
  {
    label: 'Solutions',
    links: [
      { title: 'Data Cleaning', href: '/solutions/data-cleaning' },
      { title: 'Feature Engineering', href: '/solutions/feature-engineering' },
      { title: 'ML Model Training', href: '/solutions/model-training' },
      { title: 'Analytics Acceleration', href: '/solutions/analytics' },
    ],
  },
  {
    label: 'Company',
    links: [
      { title: 'About Us', href: '/about' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
      { title: 'Contact', href: '/contact' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { title: 'Documentation', href: '/docs' },
      { title: 'Guides', href: '/guides' },
      { title: 'Release Notes', href: '/changelog' },
      { title: 'Support', href: '/help' },
    ],
  },
  {
    label: "Connect",
    links: [
      {
        title: "LinkedIn",
        href: "https://www.linkedin.com/in/krish-ramanandi-83622b30b",
        icon: FaLinkedin,
      },
      {
        title: "GitHub",
        href: "https://github.com/Talaviya-Sarthak/DataForge",
        icon: FaGithub,
      },
      {
        title: "Twitter",
        href: "https://twitter.com/dataforge",
        icon: FaTwitter,
      },
      {
        title: "Email",
        href: "mailto:krishramanandi30@gmail.com",
        icon: MdOutlineEmail,
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="md:rounded-t-6xl relative w-full flex flex-col items-center justify-center rounded-t-4xl border-t bg-black text-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <AnimatedContainer className="space-y-4">
          <FrameIcon className="size-8 text-white" />
          <p className="text-white mt-4 text-sm md:mt-0">
            © {new Date().getFullYear()} Asme. All rights reserved.
          </p>
        </AnimatedContainer>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 col-span-1 sm:col-span-1 lg:col-span-4">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-6 md:mb-0">
                <h3 className="text-xs text-white">{section.label}</h3>
                <ul className="text-white mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-1 hover:text-gray-200 transition-all duration-300"
                      >
                        {link.icon ? <link.icon className="w-4 h-4 opacity-90" /> : null}
                        <span>{link.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
};

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};