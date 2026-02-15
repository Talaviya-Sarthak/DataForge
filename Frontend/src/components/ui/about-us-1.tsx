'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Spotlight } from '@/components/ui/spotlight';
import { BorderBeam } from '@/components/ui/border-beam';
import {
  Globe,
  Users,
  Heart,
  Lightbulb,
  Sparkles,
  Rocket,
  Target,
  ArrowRight,
} from 'lucide-react';

interface AboutUsProps {
  title?: string;
  subtitle?: string;
  mission?: string;
  vision?: string;
  values?: Array<{
    title: string;
    description: string;
    icon: keyof typeof iconComponents;
  }>;
  className?: string;
}

const iconComponents = {
  Users: Users,
  Heart: Heart,
  Lightbulb: Lightbulb,
  Globe: Globe,
  Sparkles: Sparkles,
  Rocket: Rocket,
  Target: Target,
};

const defaultValues: AboutUsProps['values'] = [
  {
    title: 'Data Processing',
    description:
      'Comprehensive CSV data handling with preview, statistics, and metadata analysis capabilities.',
    icon: 'Lightbulb',
  },
  {
    title: 'ML Workflows',
    description:
      'Structured pipelines for data cleaning, feature engineering, and machine learning preparation.',
    icon: 'Users',
  },
  {
    title: 'Developer Focus',
    description:
      'Built with React, TypeScript, and FastAPI to provide a modern, type-safe development experience.',
    icon: 'Sparkles',
  },
  {
    title: 'Learning Platform',
    description:
      'Designed for experimentation and education, making data science accessible to students and developers.',
    icon: 'Globe',
  },
];

function AboutUs1() {
  const aboutData = {
    title: 'About DataForge',
    subtitle:
      'A desktop-first data processing and ML preparation platform designed for developers and students.',
    mission:
      'Our mission is to streamline the data science workflow by providing a comprehensive platform for CSV data processing, statistical analysis, and machine learning preparation with an intuitive interface.',
    vision:
      'We envision empowering developers and students with production-style ML workflows, making data preprocessing and feature engineering accessible through structured pipelines and automated insights.',
    values: defaultValues,
    className: 'relative overflow-hidden py-20',
  };

  const missionRef = useRef(null);
  const valuesRef = useRef(null);

  const missionInView = useInView(missionRef, { once: true, amount: 0.3 });
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.3 });

  return (
    <section className="relative w-full overflow-hidden py-20 bg-black">
      <Spotlight
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(220, 100%, 50%, 0.15) 0, hsla(220, 100%, 55%, 0.08) 50%, hsla(220, 100%, 45%, 0) 80%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(220, 100%, 85%, 0.12) 0, hsla(220, 100%, 55%, 0.06) 80%, transparent 100%)"
        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(220, 100%, 85%, 0.10) 0, hsla(220, 100%, 85%, 0.08) 80%, transparent 100%)"
      />

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            {aboutData.title}
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            {aboutData.subtitle}
          </p>
        </motion.div>

        {/* Mission & Vision Section */}
        <div ref={missionRef} className="relative mx-auto mb-24 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={
              missionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative z-10 grid gap-8 md:grid-cols-2"
          >
            {/* Mission Card */}
            <motion.div
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/5 via-blue-600/5 to-black/50 p-12 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
            >
              <BorderBeam
                duration={8}
                size={300}
                className="via-blue-500/30 from-transparent to-transparent"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/5 transition-all duration-300" />

              <div className="relative z-10">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                  <Rocket className="h-8 w-8 text-blue-400" />
                </div>

                <h2 className="mb-4 text-3xl font-bold text-white">
                  Our Mission
                </h2>

                <p className="text-gray-300 text-lg leading-relaxed">
                  {aboutData.mission}
                </p>

                <motion.button
                  whileHover={{ x: 5 }}
                  className="mt-6 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/5 via-blue-700/5 to-black/50 p-12 backdrop-blur-xl hover:border-blue-600/30 transition-all duration-300"
            >
              <BorderBeam
                duration={8}
                size={300}
                className="via-blue-600/30 from-transparent to-transparent"
                reverse
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-blue-600/5 transition-all duration-300" />

              <div className="relative z-10">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/10 backdrop-blur-sm">
                  <Target className="h-8 w-8 text-blue-400" />
                </div>

                <h2 className="mb-4 text-3xl font-bold text-white">
                  Our Vision
                </h2>

                <p className="text-gray-300 text-lg leading-relaxed">
                  {aboutData.vision}
                </p>

                <motion.button
                  whileHover={{ x: 5 }}
                  className="mt-6 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div ref={valuesRef} className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Platform Features
            </h2>
            <p className="text-gray-300 mx-auto max-w-2xl text-lg leading-relaxed">
              The core capabilities that make DataForge a powerful data processing platform.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {aboutData.values?.map((value, index) => {
              const IconComponent = iconComponents[value.icon];

              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={
                    valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                  }
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1 + 0.2,
                    ease: 'easeOut',
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-black/50 p-6 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
                >
                  <BorderBeam
                    duration={8}
                    size={300}
                    className="via-blue-500/20 from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />

                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                      <IconComponent className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutUs1;
