import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AboutUs1 from '../../components/ui/about-us-1';
import { BorderBeam } from '../../components/ui/border-beam';
import { 
  Users, 
  Code2, 
  Zap, 
  Trophy,
  TrendingUp,
  Award,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';
import Header from '@/components/layouts/Header';

const AboutPage: React.FC = () => {
  const statsRef = useRef(null);
  const teamRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const teamInView = useInView(teamRef, { once: true, amount: 0.3 });

  const stats = [
    { label: 'Data Processing Speed', value: '10x', icon: Users },
    { label: 'ML Algorithms', value: '15+', icon: Code2 },
    { label: 'Processing Accuracy', value: '99%', icon: Zap },
    { label: 'Feature Types', value: '20+', icon: Trophy },
  ];

  const team = [
    {
      name: 'Data Processing Engine',
      role: 'Core Component',
      bio: 'FastAPI-based backend handling CSV uploads, data preview, and statistical analysis.',
      icon: Award,
    },
    {
      name: 'Frontend Interface',
      role: 'User Experience',
      bio: 'React + TypeScript interface with TanStack Query for efficient data fetching.',
      icon: Code2,
    },
    {
      name: 'ML Pipeline',
      role: 'Processing Engine',
      bio: 'Structured workflows for data cleaning, feature engineering, and model preparation.',
      icon: Trophy,
    },
    {
      name: 'Analytics Dashboard',
      role: 'Data Insights',
      bio: 'Comprehensive statistics including min, max, mean, median, and standard deviation.',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Header />

      <AboutUs1 />

      {/* Statistics Section */}
      <section ref={statsRef} className="relative w-full overflow-hidden py-20 bg-black">
        
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Platform Capabilities
            </h2>
            <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto leading-relaxed">
              Key metrics showcasing DataForge's data processing and machine learning capabilities.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-8 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
                  <BorderBeam
                    duration={8}
                    size={300}
                    className="via-blue-500/20 from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                      <Icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </p>
                    <p className="text-white/60 text-sm font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="relative w-full overflow-hidden py-20 bg-black">

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Core Components
            </h2>
            <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto leading-relaxed">
              The essential building blocks that power DataForge's data processing capabilities.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member, index) => {
              const Icon = member.icon;
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={teamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-6 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
                  <BorderBeam
                    duration={8}
                    size={300}
                    className="via-blue-500/20 from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                      <Icon className="h-7 w-7 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-sm text-blue-400 font-medium mb-3">{member.role}</p>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">{member.bio}</p>
                    
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                      <motion.a
                        href="#"
                        whileHover={{ scale: 1.1 }}
                        className="text-white/40 hover:text-blue-400 transition-colors"
                      >
                        <Github className="h-4 w-4" />
                      </motion.a>
                      <motion.a
                        href="#"
                        whileHover={{ scale: 1.1 }}
                        className="text-white/40 hover:text-blue-400 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </motion.a>
                      <motion.a
                        href="#"
                        whileHover={{ scale: 1.1 }}
                        className="text-white/40 hover:text-blue-400 transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="relative w-full overflow-hidden py-20 bg-black">
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Data Processing Features
            </h2>
            <p className="text-gray-300 mx-auto max-w-2xl text-lg leading-relaxed">
              Comprehensive tools for CSV data analysis and machine learning preparation.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'CSV Upload & Preview',
                description: 'Drag-and-drop CSV files with instant data preview and validation.',
                icon: Code2
              },
              {
                title: 'Statistical Analysis',
                description: 'Comprehensive statistics including min, max, mean, median, and standard deviation.',
                icon: Users
              },
              {
                title: 'Data Cleaning Pipeline',
                description: 'Structured workflows for missing value handling and outlier detection.',
                icon: Users
              },
              {
                title: 'Feature Engineering',
                description: 'Automated feature selection and transformation tools for ML preparation.',
                icon: Code2
              },
              {
                title: 'ML Model Training',
                description: 'Multiple algorithm support with performance evaluation and comparison.',
                icon: Zap
              },
              {
                title: 'Export & Download',
                description: 'Export processed datasets and trained models for production use.',
                icon: Trophy
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-6 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
                  <BorderBeam
                    duration={8}
                    size={300}
                    className="via-blue-500/20 from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                      <Icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="relative w-full overflow-hidden py-20 bg-black">
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-gray-300 mx-auto max-w-2xl text-lg leading-relaxed">
              DataForge leverages cutting-edge technologies for optimal data processing performance.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'React + TypeScript', description: 'Type-safe frontend development' },
              { name: 'FastAPI', description: 'High-performance Python backend' },
              { name: 'TanStack Query', description: 'Efficient data fetching and caching' },
              { name: 'Tailwind CSS', description: 'Modern utility-first styling' },
              { name: 'Pandas', description: 'Powerful data manipulation' },
              { name: 'Scikit-learn', description: 'Machine learning algorithms' },
              { name: 'Framer Motion', description: 'Smooth UI animations' },
              { name: 'MySQL', description: 'Reliable data persistence' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-6 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
                <BorderBeam
                  duration={8}
                  size={300}
                  className="via-blue-500/20 from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />

                <div className="relative z-10 text-center">
                  <h3 className="text-lg font-bold text-white mb-2">{tech.name}</h3>
                  <p className="text-white/60 text-sm">{tech.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative w-full overflow-hidden py-20 bg-black">
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Perfect For Data Professionals
            </h2>
            <p className="text-gray-300 mx-auto max-w-2xl text-lg leading-relaxed">
              DataForge adapts to your data science workflow, from learning to production.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: 'Students & Researchers',
                items: ['Learn data science concepts', 'Experiment with ML algorithms', 'Practice with real datasets']
              },
              {
                title: 'Data Scientists',
                items: ['Rapid data exploration', 'Feature engineering workflows', 'Model performance comparison']
              },
              {
                title: 'ML Engineers',
                items: ['Production-ready pipelines', 'Automated preprocessing', 'Model export capabilities']
              },
              {
                title: 'Business Analysts',
                items: ['Statistical insights', 'Data quality assessment', 'Automated reporting']
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-8 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/5 transition-all duration-300" />
                <BorderBeam
                  duration={8}
                  size={300}
                  className="via-blue-500/20 from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-4">{useCase.title}</h3>
                  <ul className="space-y-3">
                    {useCase.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20">
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                        </div>
                        <span className="text-white/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full overflow-hidden py-20 bg-black">

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Ready to Transform Your Data Workflow?
            </h2>
            <p className="text-gray-300 mt-6 text-lg leading-relaxed">
              Join data professionals using DataForge to streamline their ML preparation and analysis workflows.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              >
                Get Started
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border border-blue-500/30 text-white font-semibold rounded-lg hover:border-blue-400/60 hover:bg-blue-500/10 transition-all duration-300"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
