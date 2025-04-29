import React, { useEffect, useRef } from 'react';
import Scrollbar from 'smooth-scrollbar';

const ScrollableContainer = ({ 
  children, 
  className = '', 
  style = {}, 
  options = {} 
}) => {
  const scrollContainerRef = useRef(null);
  const scrollbarRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Initialize smooth scrollbar with custom options
      scrollbarRef.current = Scrollbar.init(scrollContainerRef.current, {
        damping: 0.07,
        thumbMinSize: 20,
        renderByPixels: true,
        alwaysShowTracks: false,
        continuousScrolling: true,
        ...options
      });

      // Cleanup function to destroy scrollbar when component unmounts
      return () => {
        if (scrollbarRef.current) {
          scrollbarRef.current.destroy();
          scrollbarRef.current = null;
        }
      };
    }
  }, [options]);

  return (
    <div 
      ref={scrollContainerRef} 
      className={`scrollable-container ${className}`}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      {children}
    </div>
  );
};

export default ScrollableContainer;