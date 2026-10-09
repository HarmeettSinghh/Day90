import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <motion.div
        className="loading-screen__inner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="loading-screen__logo">Day 90</div>
        <div className="loading-screen__ink">
          <div className="loading-screen__dot" />
          <div className="loading-screen__dot" />
          <div className="loading-screen__dot" />
        </div>
        <p className="loading-screen__message">{message}</p>
      </motion.div>

      <style>{`
        .loading-screen {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream);
        }
        .loading-screen__inner {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-6);
        }
        .loading-screen__logo {
          font-family: var(--font-display);
          font-size: var(--text-4xl);
          font-weight: 300;
          color: var(--ink);
          letter-spacing: -0.02em;
        }
        .loading-screen__ink {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }
        .loading-screen__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--forest);
          animation: ink-dot 1.2s ease-in-out infinite;
        }
        .loading-screen__dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-screen__dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ink-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .loading-screen__message {
          font-size: var(--text-sm);
          color: var(--ink-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
