/**
 * Groq AI service.
 * Called ONLY from the Express backend — key never exposed to client.
 * Always provides fallback text if Groq fails, times out, or hits rate limits.
 */

const { GROQ_TIMEOUT_MS, VERDICTS } = require('../config/thresholds');
const AiCache = require('../models/AiCache');

// Lazy-init Groq client (only if key exists)
let groqClient = null;

function getGroqClient() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Fallback texts per verdict type — app works even without Groq.
 */
const FALLBACKS = {
  [VERDICTS.TOO_EARLY]: (data) =>
    `You've used it ${data.daysUsed} of ${data.daysElapsed} days. It's still early — most people need 8–12 weeks before noticing changes. Keep going, boring is how it works.`,

  [VERDICTS.NOT_FAIR_TEST]: (data) =>
    `You've checked in ${data.daysUsed} of ${data.daysElapsed} days — that's ${Math.round(data.adherence * 100)}% consistency. For a fair test, aim for 70% or above. Miss a day? Just pick up the next morning.`,

  [VERDICTS.CONSIDER_DOCTOR]: (data) =>
    `You've been consistent — ${Math.round(data.adherence * 100)}% over ${data.weeksElapsed} weeks. Ratings haven't moved much. That's honest data, not failure. A dermatologist can look closer and help you figure out the next step.`,

  [VERDICTS.KEEP_GOING]: (data) =>
    `${data.daysUsed} days in, ${Math.round(data.adherence * 100)}% consistent. ${data.trendImproving ? 'Your ratings are trending up — early signs that it's working.' : 'Keep the streak going — results at this stage are often invisible but real.'}`,

  weekly_reflection: (data) =>
    `Week ${data.weekNumber}: you rated ${data.rating}/5 and used it ${Math.round(data.adherence * 100)}% of days. ${data.rating >= 4 ? 'Good signs — keep the streak.' : 'Slow weeks are part of the process. Consistency now is the investment.'}`,
};

/**
 * System prompt for all Groq calls.
 */
const SYSTEM_PROMPT = `You are a warm, honest companion for someone on a hair or wellness routine. Your job is to reflect their progress back to them clearly and encouragingly — not to hype, not to promise, not to shame.

Rules:
- Never diagnose any condition.
- Never promise or imply that a product will or won't work.
- Never recommend specific medications, doses, or brands.
- Never shame or compare.
- If symptoms are persistent, worsening, or worrying, suggest seeing a doctor or dermatologist.
- Keep your response under 60 words.
- Use simple, warm English. Light Hinglish only if the language setting allows.
- Never mention the AI, models, or technology.
- Respond in 2-3 sentences max.`;

/**
 * Call Groq with a timeout and return text.
 * @returns {Promise<string>}
 */
async function callGroq(prompt, systemOverride = null) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq client not initialized (no API key)');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemOverride || SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 120,
        temperature: 0.7,
      },
      { signal: controller.signal }
    );
    return completion.choices[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get AI verdict explanation with caching.
 * @param {{ userId, routineId, verdict, daysUsed, daysElapsed, adherence, weeksElapsed, trendImproving }} params
 * @returns {Promise<{ text: string, fromCache: boolean, fromFallback: boolean }>}
 */
async function getVerdictExplanation(params) {
  const { userId, routineId, verdict, daysUsed, daysElapsed, adherence, weeksElapsed, trendImproving } = params;

  const stateKey = `${verdict}:${weeksElapsed}:${Math.round(adherence * 100)}`;

  // Check cache
  const cached = await AiCache.findOne({ userId, routineId, kind: 'verdict_explanation', stateKey });
  if (cached) {
    return { text: cached.text, fromCache: true, fromFallback: false };
  }

  const fallback = FALLBACKS[verdict] || FALLBACKS[VERDICTS.KEEP_GOING];

  try {
    const prompt = `The user has been on a hair/wellness routine for ${weeksElapsed} weeks. 
They've used the product ${daysUsed} out of ${daysElapsed} days (${Math.round(adherence * 100)}% consistency).
Rating trend: ${trendImproving ? 'improving' : 'flat or worsening'}.
Current verdict: ${verdict}.

Write 2-3 warm, honest sentences in the user's voice reflecting this honestly. Do not promise results.`;

    const text = await callGroq(prompt);
    if (text) {
      // Cache it
      await AiCache.create({ userId, routineId, kind: 'verdict_explanation', stateKey, text });
      return { text, fromCache: false, fromFallback: false };
    }
  } catch (err) {
    console.warn('[Groq] verdict_explanation failed, using fallback:', err.message);
  }

  const fallbackText = fallback({ daysUsed, daysElapsed, adherence, weeksElapsed, trendImproving });
  return { text: fallbackText, fromCache: false, fromFallback: true };
}

/**
 * Get weekly reflection with caching.
 */
async function getWeeklyReflection(params) {
  const { userId, routineId, weekNumber, rating, adherence, notes } = params;
  const stateKey = `week:${weekNumber}:rating:${rating}:adh:${Math.round(adherence * 100)}`;

  const cached = await AiCache.findOne({ userId, routineId, kind: 'weekly_reflection', stateKey });
  if (cached) {
    return { text: cached.text, fromCache: true, fromFallback: false };
  }

  try {
    const noteSummary = notes && notes.length ? `Notes this week: "${notes.join('; ')}"` : 'No notes added.';
    const prompt = `Week ${weekNumber} of routine. Self-rating: ${rating}/5. Consistency this week: ${Math.round(adherence * 100)}%. ${noteSummary}

Write 2-3 warm, encouraging sentences and one practical tip. Keep it under 60 words.`;

    const text = await callGroq(prompt);
    if (text) {
      await AiCache.create({ userId, routineId, kind: 'weekly_reflection', stateKey, text });
      return { text, fromCache: false, fromFallback: false };
    }
  } catch (err) {
    console.warn('[Groq] weekly_reflection failed, using fallback:', err.message);
  }

  const fallbackText = FALLBACKS.weekly_reflection({ weekNumber, rating, adherence });
  return { text: fallbackText, fromCache: false, fromFallback: true };
}

/**
 * Scoped Q&A — only routine usage questions.
 */
async function askRoutineQuestion(params) {
  const { question, category, goal, weekNumber, adherence } = params;

  const systemPrompt = `${SYSTEM_PROMPT}

You ONLY answer questions about:
- Timing of use (when to apply, morning vs night)
- What to do if a dose is missed
- What to expect and when
- How to stay consistent

If the question is about anything else (medical conditions, diagnosis, specific brands, unrelated topics), politely say: "That's a bit outside what I can help with — for medical questions, please consult a doctor or dermatologist."

Context: The user is on a ${category.replace(/_/g, ' ')} routine (goal: ${goal.replace(/_/g, ' ')}), week ${weekNumber}, ${Math.round(adherence * 100)}% consistent.`;

  try {
    const text = await callGroq(question, systemPrompt);
    return { text: text || "I'm not sure about that one — for specific medical questions, please consult a doctor.", fromFallback: !text };
  } catch (err) {
    console.warn('[Groq] ask failed:', err.message);
    return {
      text: "I couldn't connect right now. For medical questions, please consult a doctor or dermatologist.",
      fromFallback: true,
    };
  }
}

module.exports = {
  getVerdictExplanation,
  getWeeklyReflection,
  askRoutineQuestion,
};
