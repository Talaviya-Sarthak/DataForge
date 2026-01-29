'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { motion, AnimatePresence } from 'framer-motion';

type Testimonial = {
  image: string;
  audio: string;
  text: string;
  name: string;
  jobtitle: string;
};

type ComponentProps = {
  testimonials: Testimonial[];
};

export const Component: React.FC<ComponentProps> = ({ testimonials }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null); 
  const [typedText, setTypedText] = useState('');
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef('');

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause(); 
      audioPlayerRef.current.currentTime = 0; 
      audioPlayerRef.current.src = ''; 
      audioPlayerRef.current.load(); 
      audioPlayerRef.current = null; 
    }
  }, []); 

  const startTypewriter = useCallback((text: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setTypedText('');
    currentTextRef.current = text;
    
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setTypedText(text.slice(0, i));
        i++;
        typewriterTimeoutRef.current = setTimeout(type, 50);
      }
    };
    type();
  }, []);
  const stopTypewriter = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setTypedText('');
    currentTextRef.current = '';
  }, []); 
  const handleMouseEnter = useCallback((index: number) => {
    
    stopAudio(); 

    setHoveredIndex(index);
  
    // const newAudio = new Audio(`/audio/${testimonials[index].audio}`);
    // audioPlayerRef.current = newAudio; 
    // newAudio.play().catch(e => {
    //     console.warn("Audio playback prevented or failed:", e);
      
    // });
    
    
    startTypewriter(testimonials[index].text);
  }, [testimonials, stopAudio, startTypewriter]); 

  
  const handleMouseLeave = useCallback(() => {
    stopAudio(); 
    setHoveredIndex(null);
    stopTypewriter();
  }, [stopAudio, stopTypewriter]);
  useEffect(() => {
    return () => {
      stopAudio(); 
      stopTypewriter(); 
    };
  }, [stopAudio, stopTypewriter]); 

  return (
    <div className="flex justify-center items-center gap-4 flex-wrap">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          className="relative flex flex-col items-center"
          onMouseEnter={() => handleMouseEnter(index)} 
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
         <motion.div
  className="
    relative 
    w-16 h-16 
    rounded-full 
    flex items-center justify-center
    bg-[#0B0F14]
    border border-white/10
  "
  animate={{
    scale: hoveredIndex === index ? 1.06 : 1.0,
    borderColor:
      hoveredIndex === index
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.12)",
    boxShadow: "none"
  }}
  transition={{ duration: 0.25 }}
>
  <img
    src={testimonial.image}
    alt={`Testimonial ${index}`}
    className="w-14 h-14 rounded-full object-cover"
  />

  {/* inner soft stroke */}
  <div
    className="
      absolute inset-0
      rounded-full 
      border border-white/10
      pointer-events-none
    "
  />
</motion.div>

          <AnimatePresence>
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-20 
bg-[#0B0F14]/95 
backdrop-blur-md 
text-gray-200 
text-sm 
px-5 py-4 
rounded-2xl 
border border-white/10
shadow-[0_0_25px_rgba(0,255,255,0.08)]
max-w-xs w-64"
              >
               <div className="h-24 overflow-hidden whitespace-pre-wrap text-gray-300 leading-relaxed">
  {typedText}
  <span className="animate-blink text-cyan-300">|</span>
</div>

                <p className="mt-2 text-right font-semibold text-white">
  {testimonial.name}
</p>
<p className="text-right text-gray-400 text-xs">
  {testimonial.jobtitle}
</p>

                <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-5">
  <div className="w-3 h-3 bg-cyan-400/70 rounded-full shadow-lg" />
  <div className="w-2 h-2 bg-cyan-400/60 rounded-full shadow-md mt-1 mx-auto" />
  <div className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full shadow-sm mt-1 mx-auto" />
</div>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};