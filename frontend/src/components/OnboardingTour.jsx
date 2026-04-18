import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Rocket, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';

const STEPS = [
  {
    targetId: 'nav-dashboard',
    title: 'Operations Overview',
    content: 'Welcome to your main dashboard. Monitor real-time fleet efficiency and delivery performance at a glance.',
    placement: 'right'
  },
  {
    targetId: 'nav-live-map',
    title: 'Live Logistics Map',
    content: 'Watch your riders move in real-time. Track optimized routes and ensure timely delivery drops.',
    placement: 'right'
  },
  {
    targetId: 'nav-orders',
    title: 'Dispatch Management',
    content: 'Efficiently assign, track, and manage all outgoing orders from this centralized queue.',
    placement: 'right'
  },
  {
    targetId: 'dashboard-kpi',
    title: 'Operational Metrics',
    content: 'Analyze throughput, delivery times, and rider reliability with our automated reporting cards.',
    placement: 'bottom'
  }
];

export default function OnboardingTour() {
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user && !user.tour_completed) {
      setTimeout(() => setIsVisible(true), 1500); // Wait for page hydrate
    }
  }, [user]);

  useEffect(() => {
    if (isVisible) {
      const target = document.getElementById(STEPS[currentStep].targetId);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    }
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = async () => {
    setIsVisible(false);
    try {
      await api.patch('/auth/profile', { tour_completed: true });
      setUser({ ...user, tour_completed: true });
    } catch (err) {
      console.error('Failed to save tour state', err);
    }
  };

  if (!isVisible || !targetRect) return null;

  const step = STEPS[currentStep];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {/* Target Highlight Overlay */}
      <div style={{ 
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'auto',
        clipPath: `polygon(
          0% 0%, 0% 100%, 100% 100%, 100% 0%, 
          ${targetRect.left}px 0%, ${targetRect.left}px ${targetRect.top}px, 
          ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, 
          ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 0%
        )`
      }} onClick={completeTour} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: step.placement === 'right' ? targetRect.top : targetRect.bottom + 20,
          left: step.placement === 'right' ? targetRect.right + 20 : targetRect.left + (targetRect.width / 2) - 150,
          width: '320px', pointerEvents: 'auto',
          background: 'var(--bg-surface)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-xl)', padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={18} color="var(--accent)" />
            <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.title}</span>
          </div>
          <button onClick={completeTour} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.content}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentStep ? 'var(--accent)' : 'var(--border)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button 
              onClick={handleNext}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
