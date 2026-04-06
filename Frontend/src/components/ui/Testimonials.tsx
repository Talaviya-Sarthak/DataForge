// This is a demo of a preview
'use client';
import { Component } from "@/components/ui/typewriter-testimonial";

const Testimonials = () => {
  const testimonials = [
    {
      image: 'https://plus.unsplash.com/premium_photo-1691784781482-9af9bce05096?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTd8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D',
      audio: 'audio_1.mp3',
      text: 'This product has revolutionized my workflow. The intuitive interface and powerful features make it an indispensable tool for my daily tasks. Highly recommended for anyone looking to boost productivity.',
      name: 'Rosy Richard',
      jobtitle: 'Software Engineer',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1689977807477-a579eda91fa2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTN8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D',
      audio: 'audio_2.mp3',
      text: 'An exceptional experience from start to finish. The customer support is top-notch, and the product consistently exceeds my expectations. I can confidently say this is the best in its class.',
      name: 'Jane Smith',
      jobtitle: 'Marketing Manager',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D',
      audio: 'audio_3.mp3',
      text: 'The design is sleek, and the performance is unparalleled. It truly stands out among competitors. This investment has paid off exponentially in terms of efficiency and results.',
      name: 'Alex Johnson',
      jobtitle: 'UX Designer',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1690395794791-e85944b25c0f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTIyfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
      audio: 'audio_4.mp3',
      text: 'I was skeptical at first, but this product delivered beyond my wildest dreams. It is robust, reliable, and has become an essential part of my professional toolkit. Simply amazing!',
      name: 'Emily White',
      jobtitle: 'Project Lead',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1689977871600-e755257fb5f8?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTEwfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
      audio: 'audio_5.mp3',
      text: 'This tool is a game-changer for data analysis. The visualisations are clear, and the insights gained are invaluable. It has transformed how we approach our business decisions.',
      name: 'David Lee',
      jobtitle: 'Data Scientist',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1691784778805-e1067ac42e01?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMwfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
      audio: 'audio_6.mp3',
      text: 'I appreciate the continuous updates and improvements. The team behind this product clearly listens to user feedback. It keeps getting better with every release. Fantastic!',
      name: 'Sarah Chen',
      jobtitle: 'Operations Manager',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1689747698547-271d2d553cee?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTQyfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
      audio: 'audio_7.mp3',
      text: 'The support I received was outstanding. They quickly resolved my issue and went above and beyond. It is comforting to know such dedicated professionals are behind this software.',
      name: 'Michael Brown',
      jobtitle: 'Customer Support Lead',
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1689565611422-b2156cc65e47?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTUwfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
      audio: 'audio_8.mp3',
      text: 'This is exactly what I needed! It simplified complex tasks and allowed me to focus on what truly matters. The seamless integration with my existing tools was a huge plus.',
      name: 'Chris Taylor',
      jobtitle: 'Entrepreneur',
      },
    {
  image: 'https://plus.unsplash.com/premium_photo-1688740375397-34605b6abe48?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTM4fHxwZXJzb258ZW58MHx8MHx8fDA%3D',
  audio: 'audio_9.mp3',
  text: 'DataForge helped us streamline our data workflows instantly. What previously required complicated scripting now takes just a few clicks. It’s become an essential part of our stack.',
  name: 'Ava Reynolds',
  jobtitle: 'Head of Data Strategy',
},
{
  image: 'https://plus.unsplash.com/premium_photo-1690397038570-7ec0cacb37f2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU4fHxwZXJzb258ZW58MHx8MHx8fDA%3D',
  audio: 'audio_10.mp3',
  text: 'The ability to clean data and train models in one place is a massive advantage. Our experimentation cycle has become dramatically faster and more organized.',
  name: 'Michael Chan',
  jobtitle: 'Machine Learning Engineer',
},
{
  image: 'https://plus.unsplash.com/premium_photo-1688739352540-a75b102d8551?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjEwfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
  audio: 'audio_11.mp3',
  text: 'What impressed me most was how intuitive the platform felt. Even complex transformations and feature engineering are visually clear and easy to manage.',
  name: 'Sofia Martinez',
  jobtitle: 'Senior Data Analyst',
},
{
  image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjExfHxwZXJzb258ZW58MHx8MHx8fDA%3D',
  audio: 'audio_12.mp3',
  text: 'Our team was able to collaborate more effectively than ever before. DataForge keeps everything organized, transparent, and simple — without sacrificing power.',
  name: 'Ethan Walker',
  jobtitle: 'Product Operations Lead',
},
{
  image: 'https://images.unsplash.com/photo-1545115224-c57403dc8fc6?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  audio: 'audio_13.mp3',
  text: 'From automated cleaning to model selection, the platform feels like a true assistant for data teams. It has saved us countless hours on every project.',
  name: 'Isabella Rossi',
  jobtitle: 'Analytics Director',
},

  ];

  return (
   <section className="w-full py-12 sm:py-20 md:py-28 bg-transparent">
  <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

    {/* Section Badge */}
    <span className="inline-flex items-center gap-2 px-4 py-1.5
      rounded-full text-s tracking-wide
      bg-white/5 border border-white/10 text-gray-300
    ">
      Testimonials
    </span>

    {/* Heading */}
    <h2 className="mt-6 text-4xl md:text-5xl tracking-tight text-white font-extrabold">
      Trusted by Teams Who Work With Data
    </h2>

    {/* Sub Text */}
    <p className="mt-4 text-gray-400 max-w-3xl mx-auto leading-relaxed">
      Real stories from data scientists, engineers, and leaders using DataForge
      to clean data, build features, and ship reliable models faster.
    </p>

    {/* Divider Accent */}
    <div className="mt-10 w-28 h-0.5 mx-auto 
      bg-gradient-to-r from-transparent via-yellow-200 to-transparent" 
    />

    {/* Avatar Ring Row */}
    <div className="mt-14 flex justify-center">
      <Component testimonials={testimonials} />
    </div>

  </div>
</section>

  );
};

export default Testimonials;
