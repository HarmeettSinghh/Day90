/**
 * Timeline content seed script.
 * Run with: node seeds/seedTimeline.js
 * Requires MONGODB_URI in .env
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const TimelineContent = require('../src/models/TimelineContent');

const TIMELINE_DATA = [
  {
    category: 'hair_gummies',
    whatMostNoticeFirst: 'Reduced hair fall in the shower or on the brush — many people notice this before they see new growth.',
    fairToJudgeWeek: 12,
    milestones: [
      {
        week: 2,
        title: 'Week 2 — Settling in',
        body: 'Nothing visible yet, and that\'s completely normal. Your body is absorbing the nutrients and starting internal processes that don\'t show up on the surface for weeks. This is the hardest part: trusting a process you cannot see.',
      },
      {
        week: 4,
        title: 'Week 4 — The quiet shift',
        body: 'Some people notice slightly less hair on their pillow or in the shower. For many, there\'s still no visible change — that\'s typical. Hair grows about 1 cm per month; new growth isn\'t visible yet. Consistency now is the whole game.',
      },
      {
        week: 8,
        title: 'Week 8 — Early signals',
        body: 'This is often when people first notice a change in hair texture or a reduction in shedding. A few might see baby hairs at the hairline. Others will see nothing yet — both are within the normal range. The 12-week mark is the real checkpoint.',
      },
      {
        week: 12,
        title: 'Week 12 — Fair to judge',
        body: '12 weeks of consistent use is the minimum for a fair assessment. Most clinical studies on hair supplements use this as the baseline. If you\'ve been consistent and still see no change, that\'s valuable information — worth discussing with a dermatologist.',
      },
    ],
  },
  {
    category: 'hair_serum',
    whatMostNoticeFirst: 'Reduced hair fall or breakage — this typically comes before visible density improvement.',
    fairToJudgeWeek: 12,
    milestones: [
      {
        week: 2,
        title: 'Week 2 — Application routine',
        body: 'Focus on consistent application technique right now. How you apply matters — scalp contact, not just hair. Visible results are weeks away; what you\'re building now is the habit that makes results possible.',
      },
      {
        week: 4,
        title: 'Week 4 — Scalp health',
        body: 'The scalp environment is improving before any hair change is visible. Some people notice less flakiness or scalp irritation. Hair fall may be slightly reduced. Most users don\'t notice anything yet — which is still the expected outcome.',
      },
      {
        week: 8,
        title: 'Week 8 — Texture and density',
        body: 'Hair may feel thicker or healthier in texture. Reduced breakage is common. Increased density (more hairs per area) can start to appear, but varies significantly from person to person based on genetics, diet, and stress.',
      },
      {
        week: 12,
        title: 'Week 12 — The honest checkpoint',
        body: '12 weeks is when evidence-based assessments are made. If you\'ve applied consistently (6+ days per week), you\'re now in a position to evaluate honestly. No change after consistent use? A dermatologist can help identify if there\'s an underlying cause.',
      },
    ],
  },
  {
    category: 'beard_minoxidil',
    whatMostNoticeFirst: 'New fine "vellus" hairs appearing in sparse areas — these are often lighter and thinner at first, then darken over time.',
    fairToJudgeWeek: 16,
    milestones: [
      {
        week: 2,
        title: 'Week 2 — The initial shedding phase',
        body: 'You may notice your existing beard hairs shedding slightly more than usual. This is called "dread shed" and it\'s a known, documented phase. It means the product is working — old hairs making way for new ones. Don\'t stop now.',
      },
      {
        week: 4,
        title: 'Week 4 — First fuzz',
        body: 'Vellus (fine, light) hairs may start appearing in sparse areas. They\'re easy to miss — check in good natural light. If you don\'t see them yet, that\'s also common. Results vary significantly based on individual hormonal response.',
      },
      {
        week: 8,
        title: 'Week 8 — Filling in',
        body: 'New hairs are often more visible now, though still finer than terminal beard hairs. Coverage in previously sparse areas may be noticeably different. Weekly photos are the best way to track this — change is gradual and easy to miss day-to-day.',
      },
      {
        week: 12,
        title: 'Week 12 — Progress visible',
        body: 'By now, most users who are going to respond have visible evidence of it. Hairs are thickening. For some, the full result takes 16-24 weeks. If you\'ve been consistent and see no change at all by 16 weeks, speaking to a doctor is a reasonable step.',
      },
    ],
  },
  {
    category: 'recovery_gummies',
    whatMostNoticeFirst: 'Better sleep quality or reduced fatigue — energy often comes before any physical recovery metric improves.',
    fairToJudgeWeek: 8,
    milestones: [
      {
        week: 2,
        title: 'Week 2 — Baseline',
        body: 'Energy and recovery supplements work best as a consistent input, not an occasional boost. The first two weeks are about establishing the habit and letting the nutrients build up in your system. You may not feel a noticeable difference yet.',
      },
      {
        week: 4,
        title: 'Week 4 — Subtle shifts',
        body: 'Better sleep quality or slightly faster recovery between workouts are often the first things people notice. These are easy to miss. If you\'re logging your workouts or tracking sleep, now is a good time to compare.',
      },
      {
        week: 8,
        title: 'Week 8 — Clearer picture',
        body: 'Eight weeks of consistent use gives you enough data to evaluate honestly. Energy levels, recovery time, and sleep quality should show a trend by now — if you\'ve been tracking.',
      },
      {
        week: 12,
        title: 'Week 12 — Full assessment',
        body: 'At 12 weeks, you have enough data for an honest evaluation. Consistent users who track their sleep and performance can make a clear assessment. No improvement after consistent use is worth discussing with a healthcare professional.',
      },
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const data of TIMELINE_DATA) {
    await TimelineContent.findOneAndUpdate(
      { category: data.category },
      data,
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`✓ Seeded timeline for: ${data.category}`);
  }

  console.log('Timeline seed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
