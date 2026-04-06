import React from 'react';
import { GradientCard } from '@/components/ui/gradient-card';

// Platform features data
const features = [
  {
    title: "CSV Upload",
    description:
      "Upload your dataset and explore it instantly with a clean, intuitive data view.",
  },
  {
    title: "AI Cleaning",
    description:
      "Fix missing values, detect outliers, and resolve formatting issues automatically.",
  },
  {
    title: "Smart Hints",
    description:
      "Get AI-powered suggestions like generating Age from Date of Birth — instantly.",
  },
  {
    title: "Feature Build",
    description:
      "Create new features without coding to improve model quality and insight depth.",
  },
  {
    title: "Model Runner",
    description:
      "Train multiple ML models automatically including regression and XGBoost.",
  },
  {
    title: "Model Board",
    description:
      "View a ranked leaderboard comparing accuracy and performance across models.",
  },
  {
    title: "Model Export",
    description:
      "Download the best-performing trained model — ready to use in production.",
  },
  {
    title: "Secure Data",
    description:
      "Your data stays protected with encryption and secure handling throughout.",
  },
];


const Features: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 md:py-20 bg-black mt-12 sm:mt-16 md:mt-20">
      <div className="max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADING */}
        <div className="text-center mb-14">
          <div className="inline-block">
            <span className="px-4 py-1 font-bold text-gray-900 bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-200 border border-violet-400/30 rounded-full text-xs tracking-wide uppercase">
              Platform Features
            </span>
          </div>

          <h2 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(139,92,246,0.35)]">
              Built For Data Intelligence
            </span>
          </h2>

          <p className="mt-4 text-lg text-white/70 max-w-3xl mx-auto">
            Everything you need — from data cleaning to model training — unified in one powerful workspace.
          </p>

          <div className="mt-8 w-24 h-[2px] mx-auto bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
        </div>

        {/* GRID (unchanged) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <GradientCard
              key={index}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
