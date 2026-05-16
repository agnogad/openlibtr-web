import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';

// Register service worker for PWA
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
);
