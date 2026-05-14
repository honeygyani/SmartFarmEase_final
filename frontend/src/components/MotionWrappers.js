import React from 'react';
import { motion } from 'framer-motion';

/**
 * FadeIn wrapper for components
 * @param {object} props 
 * @param {number} props.delay - Animation delay in seconds
 * @param {number} props.direction - 'up' | 'down' | 'left' | 'right'
 * @param {number} props.distance - Slide distance in pixels
 */
export const FadeIn = ({ children, delay = 0, direction = 'up', distance = 20, duration = 0.5, ...props }) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1.0] 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer for child animations
 */
export const StaggerContainer = ({ children, staggerDelay = 0.1, delayChildren = 0, ...props }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * HoverLift wrapper for cards or buttons
 */
export const HoverLift = ({ children, ...props }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn animation for icons or chips
 */
export const ScaleIn = ({ children, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.4, 
        delay, 
        type: 'spring', 
        stiffness: 260, 
        damping: 20 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
