import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { routineAPI } from '../api/client';

const CATEGORY_OPTIONS = [
  {
    id: 'hair_gummies',
    name: 'Hair Growth Gummies',
    desc: 'Nutritional support with Biotin, Zinc & multivitamins for hair vitality.',
    defaultGoal: 'reduce_hair_fall',
    icon: '🍬',
  },
  {
    id: 'hair_serum',
    name: 'Hair Growth Serum',
    desc: 'Topical peptide and Redensyl scalp therapy for follicle health.',
    defaultGoal: 'improve_density',
    icon: '💧',
  },
  {
    id: 'beard_minoxidil',
    name: 'Beard Growth Solution',
    desc: 'Targeted formulation to awaken dormant facial hair follicles.',
    defaultGoal: 'beard_growth',
    icon: '🧔',
  },
  {
    id: 'recovery_gummies',
    name: 'Sleep & Recovery Gummies',
    desc: 'Magnesium and L-Theanine for cellular restorative rest cycles.',
    defaultGoal: 'recovery_energy',
    icon: '🌙',
  },
];

const GOAL_OPTIONS = [
  { id: 'reduce_hair_fall', label: 'Reduce daily shedding & fallout' },
  { id: 'improve_density',   label: 'Improve follicle density and volume' },
  { id: 'beard_growth',     label: 'Fill in patchy areas & encourage beard growth' },
  { id: 'recovery_energy',   label: 'Consistent deep rest & daily vitality' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].id);
  const [goal, setGoal] = useState(CATEGORY_OPTIONS[0].defaultGoal);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [productPrice, setProductPrice] = useState('999');
  const [packDays, setPackDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectCategory = (catId) => {
    setCategory(catId);
    const cat = CATEGORY_OPTIONS.find((c) => c.id === catId);
    if (cat) setGoal(cat.defaultGoal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await routineAPI.create({
        category,
        goal,
        startDate,
        productPrice: productPrice ? Number(productPrice) : null,
        packDays: packDays ? Number(packDays) : null,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save routine. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <header className="onboarding-header">
          <span className="badge badge--accent">Day 90 Onboarding</span>
          <h1 className="h2" style={{ marginTop: 'var(--space-2)' }}>
            {step === 1 ? 'Which wellness routine are you committing to?' : 'Customize your 90-day tracking'}
          </h1>
          <p className="text-muted text-sm">
            {step === 1
              ? 'Select the category you want to objectively test over the next 3 months.'
              : 'Set your baseline parameters so we can calculate adherence and economic cost accurately.'}
          </p>
        </header>

        {error && (
          <div className="alert alert--danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="category-list"
          >
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`card category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectCategory(cat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSelectCategory(cat.id); }}
                >
                  <div className="category-icon">{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h3 className="category-title">{cat.name}</h3>
                    <p className="category-desc">{cat.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="category"
                    checked={isSelected}
                    onChange={() => handleSelectCategory(cat.id)}
                    aria-label={cat.name}
                  />
                </div>
              );
            })}

            <button
              type="button"
              className="btn btn--primary btn--full"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => setStep(2)}
            >
              Next: Routine Details →
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className="card form-group"
          >
            <div>
              <label className="label" htmlFor="goal-select">Primary Objective</label>
              <select
                id="goal-select"
                className="input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                {GOAL_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="start-date">First Day of Usage</label>
              <input
                id="start-date"
                type="date"
                className="input"
                value={startDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: 'var(--space-1)' }}>
                You can select today or backdate if you started recently.
              </span>
            </div>

            <div className="grid grid--2" style={{ gap: 'var(--space-3)' }}>
              <div>
                <label className="label" htmlFor="price-input">Product Price (₹)</label>
                <input
                  id="price-input"
                  type="number"
                  className="input"
                  placeholder="e.g. 999"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="pack-days">Pack Duration (Days)</label>
                <input
                  id="pack-days"
                  type="number"
                  className="input"
                  placeholder="e.g. 30"
                  value={packDays}
                  onChange={(e) => setPackDays(e.target.value)}
                />
              </div>
            </div>
            <span className="text-xs text-muted">
              Optional: used to show your transparent daily investment (e.g. ₹33/day).
            </span>

            <div className="row row--gap-3" style={{ marginTop: 'var(--space-5)' }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Starting Routine...' : 'Start My 90 Days'}
              </button>
            </div>
          </motion.form>
        )}
      </div>

      <style>{`
        .onboarding-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          background: var(--bg-primary);
        }
        .onboarding-container {
          width: 100%;
          max-width: 520px;
        }
        .onboarding-header {
          margin-bottom: var(--space-5);
          text-align: center;
        }
        .category-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .category-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
          border: 1.5px solid var(--border-color);
          transition: all 0.2s ease;
          padding: var(--space-4);
        }
        .category-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .category-card.selected {
          border-color: var(--accent);
          background-color: var(--accent-faint);
        }
        .category-icon {
          font-size: 1.8rem;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }
        .category-title {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .category-desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
