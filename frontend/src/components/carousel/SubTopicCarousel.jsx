/**
 * SubTopicCarousel — horizontal swipe carousel of sub-topic cards
 * using Embla Carousel. Cards have glassmorphism style.
 * Clicking a sub-topic card opens the Quiz Modal.
 */

import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen } from 'phosphor-react';
import { useCallback } from 'react';

function SubTopicCard({ subTopic, accentColor, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      className="embla__slide"
      style={{ width: 'clamp(200px, 60vw, 260px)' }}
    >
      <button
        onClick={() => onClick(subTopic)}
        className="w-full text-left rounded-[20px] p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid rgba(255,255,255,0.10)`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          focusRingColor: accentColor,
          minHeight: '160px',
        }}
        aria-label={`Start: ${subTopic.title}`}
      >
        {/* Accent top bar */}
        <div
          className="h-0.5 w-10 rounded-full"
          style={{ background: accentColor }}
        />

        {/* Title */}
        <h4
          className="text-white text-base leading-tight font-semibold"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {subTopic.title}
        </h4>

        {/* Description */}
        <p
          className="text-gray-400 text-xs leading-relaxed flex-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {subTopic.description}
        </p>

        {/* CTA row */}
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} color={accentColor} weight="fill" />
          <span
            className="text-xs font-medium"
            style={{ color: accentColor, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Start learning
          </span>
        </div>
      </button>
    </motion.div>
  );
}

export default function SubTopicCarousel({ subTopics, accentColor, onSubTopicSelect }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="w-full">
      {/* Navigation arrows */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="text-xs text-gray-500 uppercase tracking-widest"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Swipe to explore
        </span>
        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Previous sub-topic"
          >
            <ArrowLeft size={14} color="#9CA3AF" />
          </button>
          <button
            onClick={scrollNext}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Next sub-topic"
          >
            <ArrowRight size={14} color="#9CA3AF" />
          </button>
        </div>
      </div>

      {/* Embla viewport */}
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {subTopics.map((subTopic, index) => (
            <SubTopicCard
              key={subTopic.id}
              subTopic={subTopic}
              accentColor={accentColor}
              onClick={onSubTopicSelect}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
