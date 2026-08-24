import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import mobileAppAnimationData from '../assets/images/mobile-apps.json';

interface MobileAppAnimationProps {
  className?: string;
}

export const MobileAppAnimation: React.FC<MobileAppAnimationProps> = ({ className = 'w-full h-full' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance if any
    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: mobileAppAnimationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        },
      });

      // Explicitly trigger play to ensure autoplay starts across all browsers
      animRef.current.play();
    } catch (err) {
      console.error('Failed to load Lottie animation:', err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`${className} flex items-center justify-center pointer-events-none select-none`}
    />
  );
};
