import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCalendar } from '../api/contentCalendarClient';
import { CalendarSummaryCard } from '../components/CalendarSummaryCard';
import { FeedbackRating } from '../components/FeedbackRating';
import { MarkdownExportButton } from '../components/MarkdownExportButton';
import { PdfExportButton } from '../components/PdfExportButton';
import { VideoConceptCard } from '../components/VideoConceptCard';
import type { CalendarResponse } from '../types/calendar';

const MOCK_CALENDAR: CalendarResponse = {
  id: 'mock',
  jobId: 'mock-job',
  qualityScore: '8.4',
  userRating: null,
  userFeedback: null,
  createdAt: new Date().toISOString(),
  strategySummary:
    'Focus on high-retention tutorial content that bridges beginner and intermediate skill levels. Prioritize evergreen topics with a programming-focused niche, supplemented by trending framework breakdowns to capture search traffic spikes.',
  topicSelectionRationale:
    'React tutorials: strong search volume, evergreen. Next.js deep-dives: rising trend. TypeScript migration: audience pain point.',
  channelAnalysis: {
    summary:
      'Channel performs best with structured tutorial formats under 20 minutes. Audience skews toward working developers seeking practical, copy-paste-ready solutions rather than conceptual overviews.',
    top_performing_patterns: [
      { pattern: 'Step-by-step build tutorials', evidence: ['3x avg retention', 'high CTR'], confidence: 0.9 },
      { pattern: 'Error fix walkthroughs', evidence: ['low drop-off', 'high comments'], confidence: 0.8 },
    ],
    underperforming_patterns: [
      { pattern: 'Theory-heavy explainers', evidence: ['high skip rate'], confidence: 0.75 },
    ],
    audience_inferences: [
      'Working developers with 1–3 years of experience',
      'Prefer concise, problem-solving content',
      'Active in comments when solution works',
    ],
    recommended_content_traits: {
      ideal_length_minutes: '12–18',
      tone: 'direct and practical',
      formats: ['code walkthrough', 'build from scratch', 'fix this bug'],
    },
    avoid: ['hour-long deep dives', 'vague conceptual videos without code'],
  },
  trendAnalysis: {
    trend_candidates: [
      {
        topic: 'React Server Components',
        trend_type: 'rising',
        source_signals: [{ source: 'YouTube search', evidence: '320% increase in searches past 90 days' }],
        competition: 'medium',
        channel_fit: 'high',
        opportunity_score: 8.7,
        rationale: 'Developers migrating from CSR need practical guides. High intent, low quality content currently.',
      },
      {
        topic: 'TypeScript 5.x features',
        trend_type: 'stable',
        source_signals: [{ source: 'Google Trends', evidence: 'Consistent high volume' }],
        competition: 'high',
        channel_fit: 'medium',
        opportunity_score: 6.2,
        rationale: 'Evergreen demand with seasonal spikes around major releases.',
      },
      {
        topic: 'Bun runtime benchmarks',
        trend_type: 'rising',
        source_signals: [{ source: 'Twitter/X', evidence: 'Viral threads driving curiosity' }],
        competition: 'low',
        channel_fit: 'high',
        opportunity_score: 7.9,
        rationale: 'Novelty + developer curiosity. Window is 4–6 weeks before saturation.',
      },
    ],
  },
  videoConcepts: [
    {
      id: 'vc-1',
      calendar_id: 'mock',
      position: 1,
      topic: 'React Server Components from scratch',
      content_type: 'tutorial',
      goal: 'Teach practical RSC usage with a real mini-project',
      recommended_title: 'React Server Components in 15 Minutes (actually useful)',
      hook: 'Most RSC tutorials show you the theory. This one shows you why your app is broken without them — and how to fix it in 15 minutes.',
      outline_json: [
        {
          timestamp: '0:00',
          section: 'Hook + problem statement',
          talking_points: ['Why CSR-only apps have a waterfall problem', 'Quick demo of the slow version'],
          visuals: ['Network waterfall screenshot', 'Code side-by-side'],
          retention_purpose: 'Establish pain before solution',
        },
        {
          timestamp: '1:30',
          section: 'What RSC actually is (30 seconds)',
          talking_points: ['Server vs client components', 'No useState/useEffect on server'],
          visuals: ['Diagram: request flow'],
          retention_purpose: 'Fast context, no fluff',
        },
        {
          timestamp: '2:00',
          section: 'Build: data-fetching component',
          talking_points: ['async Server Component', 'Direct DB call, no useEffect', 'Suspense boundary'],
          visuals: ['VS Code live coding'],
          retention_purpose: 'Core hands-on section',
        },
        {
          timestamp: '7:00',
          section: 'Build: client island inside server tree',
          talking_points: ['"use client" directive', 'Interactivity without re-fetching', 'Common mistake: over-clienting'],
          visuals: ['Before/after bundle size'],
          retention_purpose: 'Most asked question answered here',
        },
        {
          timestamp: '11:00',
          section: 'Performance comparison',
          talking_points: ['LCP before vs after', 'Bundle size delta', 'When NOT to use RSC'],
          visuals: ['Lighthouse scores', 'Bundle analyzer'],
          retention_purpose: 'Proof it worked',
        },
        {
          timestamp: '14:00',
          section: 'Wrap-up + CTA',
          talking_points: ['3 things to try today', 'Next video teaser'],
          visuals: ['Summary card'],
          retention_purpose: 'Exit with action items',
        },
      ],
      retention_tactics: [
        {
          timestamp: '2:00',
          line: "Here's the part most tutorials skip — why this breaks in production",
          reason: 'Pattern interrupt before the main build section',
        },
        {
          timestamp: '7:00',
          line: "Don't add 'use client' here — I'll show you why in 30 seconds",
          reason: 'Teases upcoming correction, keeps viewer watching',
        },
      ],
      cta_json: {
        primary: 'Download the starter repo — link in description. Fork it, break it, learn it.',
        secondary: 'Next video covers Suspense streaming with RSC. Subscribe so you don\'t miss it.',
      },
      seo_description:
        'Learn React Server Components the practical way. This tutorial builds a real data-fetching component from scratch, shows you the common "use client" mistake, and proves the performance gains with Lighthouse scores. No fluff — just working code.',
      thumbnail_json: {
        text_overlay: 'RSC Finally Explained',
        visual_elements: ['Developer looking confused at screen', 'Green checkmark overlay', 'Code snippet background'],
        color_direction: 'Dark background with bright green accent. High contrast text.',
      },
      performance_prediction_json: null,
      confidence_score: '0.87',
      evidence_json: null,
      titleOptions: [
        {
          id: 'to-1a',
          video_concept_id: 'vc-1',
          title: 'React Server Components in 15 Minutes (actually useful)',
          seo_score: '9.1',
          ctr_score: '8.6',
          rationale: 'Parenthetical builds trust and sets expectation of quality over fluff.',
          is_recommended: true,
        },
        {
          id: 'to-1b',
          video_concept_id: 'vc-1',
          title: 'React Server Components Full Tutorial — Build It From Scratch',
          seo_score: '8.4',
          ctr_score: '7.2',
          rationale: 'Strong keyword match, slightly lower CTR due to generic phrasing.',
          is_recommended: false,
        },
        {
          id: 'to-1c',
          video_concept_id: 'vc-1',
          title: 'Stop Using useEffect for Data Fetching (Use This Instead)',
          seo_score: '7.8',
          ctr_score: '9.1',
          rationale: 'High curiosity gap, great CTR — slightly lower SEO match for "RSC" queries.',
          is_recommended: false,
        },
      ],
      seoKeywords: [
        { id: 'sk-1a', video_concept_id: 'vc-1', keyword: 'react server components', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1b', video_concept_id: 'vc-1', keyword: 'next.js server components tutorial', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1c', video_concept_id: 'vc-1', keyword: 'react server components vs client components', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1d', video_concept_id: 'vc-1', keyword: 'how to use react server components 2025', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1e', video_concept_id: 'vc-1', keyword: 'react server components', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1f', video_concept_id: 'vc-1', keyword: 'react tutorial', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1g', video_concept_id: 'vc-1', keyword: 'nextjs tutorial', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1h', video_concept_id: 'vc-1', keyword: 'rsc tutorial', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-1i', video_concept_id: 'vc-1', keyword: 'web performance', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
      ],
    },
    {
      id: 'vc-2',
      calendar_id: 'mock',
      position: 2,
      topic: 'Bun vs Node.js — real benchmark',
      content_type: 'comparison',
      goal: 'Capture trending Bun curiosity with a credible, code-backed benchmark',
      recommended_title: 'Bun vs Node.js: I Ran 5 Real Benchmarks (Surprising Results)',
      hook: 'Everyone is saying Bun is 3x faster than Node. I ran 5 actual benchmarks on a real app to see if that\'s true — and 2 of the results surprised me.',
      outline_json: [
        {
          timestamp: '0:00',
          section: 'Hook + claims vs reality',
          talking_points: ['Twitter hype vs actual numbers', 'What we\'re actually testing'],
          visuals: ['Twitter screenshot', 'Benchmark setup diagram'],
          retention_purpose: 'Frame as truth-seeking, not hype',
        },
        {
          timestamp: '1:00',
          section: 'Test setup',
          talking_points: ['Same app, same machine', 'Benchmarking methodology', 'What counts as fair'],
          visuals: ['Code repo, terminal'],
          retention_purpose: 'Credibility building',
        },
        {
          timestamp: '3:00',
          section: 'Benchmark 1–3: HTTP, file I/O, startup',
          talking_points: ['HTTP throughput', 'File read/write speed', 'Cold start time'],
          visuals: ['Live terminal runs', 'Bar charts'],
          retention_purpose: 'Results revealed one by one for pacing',
        },
        {
          timestamp: '8:00',
          section: 'Benchmark 4–5: package install + SQLite',
          talking_points: ['npm vs bun install speed', 'Bun SQLite vs better-sqlite3'],
          visuals: ['Time comparison overlay'],
          retention_purpose: 'Two surprise results here — stated in hook',
        },
        {
          timestamp: '12:00',
          section: 'Should you switch?',
          talking_points: ['When Bun wins clearly', 'When Node is still better', 'Ecosystem gaps'],
          visuals: ['Decision table'],
          retention_purpose: 'Actionable conclusion',
        },
        {
          timestamp: '14:30',
          section: 'Wrap-up',
          talking_points: ['Final verdict', 'Next video: migrating a project to Bun'],
          visuals: ['Summary screen'],
          retention_purpose: 'Tease follow-up',
        },
      ],
      retention_tactics: [
        {
          timestamp: '0:45',
          line: "I'll reveal the two surprising results at the 8-minute mark — stay for them.",
          reason: 'Explicit tease anchors viewer past the midpoint',
        },
        {
          timestamp: '8:00',
          line: "Okay, here's the one I didn't expect.",
          reason: 'Callback to hook promise — releases the tension',
        },
      ],
      cta_json: {
        primary: 'Full benchmark repo linked below — run it yourself and reply with your numbers.',
        secondary: 'Next video: migrating an Express app to Bun without breaking anything.',
      },
      seo_description:
        'Real Bun vs Node.js benchmarks — not synthetic microbenchmarks. I tested HTTP throughput, file I/O, startup time, package install speed, and SQLite on the same machine with the same app. Includes a decision table for when to switch.',
      thumbnail_json: {
        text_overlay: 'Bun vs Node REAL Test',
        visual_elements: ['Bun and Node logos facing off', 'Speed meter graphic', 'Surprised developer face'],
        color_direction: 'Split screen — Node green left, Bun yellow right.',
      },
      performance_prediction_json: null,
      confidence_score: '0.79',
      evidence_json: null,
      titleOptions: [
        {
          id: 'to-2a',
          video_concept_id: 'vc-2',
          title: 'Bun vs Node.js: I Ran 5 Real Benchmarks (Surprising Results)',
          seo_score: '8.9',
          ctr_score: '9.2',
          rationale: 'Personal framing + "surprising" creates curiosity gap. Strong keyword match.',
          is_recommended: true,
        },
        {
          id: 'to-2b',
          video_concept_id: 'vc-2',
          title: 'Is Bun Actually Faster Than Node.js? Complete 2025 Benchmark',
          seo_score: '9.0',
          ctr_score: '8.1',
          rationale: 'Question format, high SEO. Lower CTR than personal narrative version.',
          is_recommended: false,
        },
        {
          id: 'to-2c',
          video_concept_id: 'vc-2',
          title: 'Bun Runtime Benchmarks — Full Comparison With Real App',
          seo_score: '8.2',
          ctr_score: '7.4',
          rationale: 'Descriptive but lacks emotional hook.',
          is_recommended: false,
        },
      ],
      seoKeywords: [
        { id: 'sk-2a', video_concept_id: 'vc-2', keyword: 'bun vs node.js', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2b', video_concept_id: 'vc-2', keyword: 'bun runtime benchmark', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2c', video_concept_id: 'vc-2', keyword: 'bun vs node performance comparison 2025', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2d', video_concept_id: 'vc-2', keyword: 'should i switch from node to bun', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2e', video_concept_id: 'vc-2', keyword: 'bun javascript runtime', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2f', video_concept_id: 'vc-2', keyword: 'node vs bun', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2g', video_concept_id: 'vc-2', keyword: 'javascript performance', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-2h', video_concept_id: 'vc-2', keyword: 'bun benchmark', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
      ],
    },
    {
      id: 'vc-3',
      calendar_id: 'mock',
      position: 3,
      topic: 'Migrating a JS codebase to TypeScript',
      content_type: 'tutorial',
      goal: 'Practical migration guide for devs who keep procrastinating the switch',
      recommended_title: 'Migrate JavaScript to TypeScript Without Losing Your Mind',
      hook: 'I\'ve seen developers delay a TypeScript migration for 2 years because they thought it meant rewriting everything. You don\'t. Here\'s the 3-step approach that lets you migrate file by file without breaking anything.',
      outline_json: [
        {
          timestamp: '0:00',
          section: 'The migration myth',
          talking_points: ['Why people avoid it', 'What "gradual adoption" actually means', 'What we\'re building'],
          visuals: ['Before repo: pure JS'],
          retention_purpose: 'Kill the main objection upfront',
        },
        {
          timestamp: '1:30',
          section: 'Step 1: tsconfig + allowJs',
          talking_points: ['Minimal tsconfig', 'allowJs + checkJs', 'No breaking changes yet'],
          visuals: ['tsconfig.json live edit'],
          retention_purpose: 'Quick win in first 2 minutes',
        },
        {
          timestamp: '4:00',
          section: 'Step 2: rename files one by one',
          talking_points: ['.js → .tsx/.ts', 'Fix errors as you go', 'Strict mode later'],
          visuals: ['File rename + TS errors resolved'],
          retention_purpose: 'Core practical section',
        },
        {
          timestamp: '9:00',
          section: 'Step 3: add strict mode',
          talking_points: ['Gradual strictness', 'noImplicitAny first', 'Utility types to reduce boilerplate'],
          visuals: ['tsconfig strict flags'],
          retention_purpose: 'Advanced payoff for viewers who stayed',
        },
        {
          timestamp: '12:00',
          section: 'Common gotchas',
          talking_points: ['Third-party lib types', 'Dynamic imports', 'Type assertions vs unknown'],
          visuals: ['Error messages + fixes'],
          retention_purpose: 'High-value section — most searched errors',
        },
        {
          timestamp: '14:30',
          section: 'Wrap-up',
          talking_points: ['Migration checklist', 'When you\'re done, run tsc --noEmit in CI'],
          visuals: ['Checklist card'],
          retention_purpose: 'Leave with actionable checklist',
        },
      ],
      retention_tactics: [
        {
          timestamp: '1:30',
          line: "One config change — and TypeScript starts checking your JS without breaking it.",
          reason: 'Early win keeps hesitant developers watching',
        },
        {
          timestamp: '9:00',
          line: "Most tutorials stop here. We're going further.",
          reason: 'Rewards persistence, signals more value ahead',
        },
      ],
      cta_json: {
        primary: 'Download the migration checklist — link in description. Works for any JS project.',
        secondary: 'Next: TypeScript utility types that cut your code in half. Subscribe.',
      },
      seo_description:
        'Gradual JavaScript to TypeScript migration guide. Covers tsconfig setup with allowJs, file-by-file renaming strategy, strict mode rollout, and the most common gotchas with third-party libraries. Includes a migration checklist you can use on any project.',
      thumbnail_json: {
        text_overlay: 'JS → TS No Rewrite',
        visual_elements: ['JS and TS logos with arrow between them', 'Checklist overlay', 'Clean code aesthetic'],
        color_direction: 'Yellow JS to blue TS gradient. Clean, minimal.',
      },
      performance_prediction_json: null,
      confidence_score: '0.82',
      evidence_json: null,
      titleOptions: [
        {
          id: 'to-3a',
          video_concept_id: 'vc-3',
          title: 'Migrate JavaScript to TypeScript Without Losing Your Mind',
          seo_score: '8.7',
          ctr_score: '8.8',
          rationale: 'Relatable pain in title, strong emotional hook.',
          is_recommended: true,
        },
        {
          id: 'to-3b',
          video_concept_id: 'vc-3',
          title: 'How to Migrate From JavaScript to TypeScript (Step by Step)',
          seo_score: '9.2',
          ctr_score: '7.5',
          rationale: 'Maximum SEO match, lower emotional pull.',
          is_recommended: false,
        },
        {
          id: 'to-3c',
          video_concept_id: 'vc-3',
          title: 'TypeScript Migration: No Rewrite Required',
          seo_score: '7.9',
          ctr_score: '8.4',
          rationale: '"No Rewrite" addresses core fear — good CTR. Slightly lower SEO volume.',
          is_recommended: false,
        },
      ],
      seoKeywords: [
        { id: 'sk-3a', video_concept_id: 'vc-3', keyword: 'javascript to typescript migration', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-3b', video_concept_id: 'vc-3', keyword: 'migrate js to typescript', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-3c', video_concept_id: 'vc-3', keyword: 'how to add typescript to existing project', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-3d', video_concept_id: 'vc-3', keyword: 'gradual typescript adoption guide', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-3e', video_concept_id: 'vc-3', keyword: 'typescript migration', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-3f', video_concept_id: 'vc-3', keyword: 'typescript tutorial', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-3g', video_concept_id: 'vc-3', keyword: 'javascript typescript', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
      ],
    },
    {
      id: 'vc-4',
      calendar_id: 'mock',
      position: 4,
      topic: 'Build a full-stack app with Next.js App Router',
      content_type: 'build-along',
      goal: 'Showcase App Router patterns in a complete, deploy-ready project',
      recommended_title: 'Full Stack Next.js App Router — Build & Deploy in 20 Minutes',
      hook: 'The App Router changed how you think about full-stack Next.js. This is the full picture — from empty folder to deployed app — in 20 minutes.',
      outline_json: [
        {
          timestamp: '0:00',
          section: 'What we\'re building',
          talking_points: ['App preview (deployed)', 'Tech choices: App Router, Server Actions, Postgres'],
          visuals: ['Live app demo'],
          retention_purpose: 'Show the destination first',
        },
        {
          timestamp: '1:00',
          section: 'Project setup',
          talking_points: ['npx create-next-app', 'Folder structure walkthrough', 'Why App Router over Pages'],
          visuals: ['Terminal + file tree'],
          retention_purpose: 'Fast setup, no padding',
        },
        {
          timestamp: '3:00',
          section: 'Data layer: Postgres + Drizzle',
          talking_points: ['Schema definition', 'Migrations', 'Server-side query functions'],
          visuals: ['schema.ts live edit'],
          retention_purpose: 'Concrete data model grounds the tutorial',
        },
        {
          timestamp: '8:00',
          section: 'UI: Server Components + Server Actions',
          talking_points: ['List page with RSC', 'Form with Server Action', 'Optimistic UI trick'],
          visuals: ['UI + code side-by-side'],
          retention_purpose: 'App Router\'s main value shown in practice',
        },
        {
          timestamp: '15:00',
          section: 'Deploy to Vercel + Neon',
          talking_points: ['Vercel deploy in 2 clicks', 'Neon Postgres setup', 'Env vars'],
          visuals: ['Vercel dashboard live'],
          retention_purpose: 'Deployment = satisfying payoff',
        },
        {
          timestamp: '19:00',
          section: 'Wrap-up',
          talking_points: ['What to build next', 'Auth, rate limiting, caching are next videos'],
          visuals: ['Deployed app revisited'],
          retention_purpose: 'Plant seeds for follow-on content',
        },
      ],
      retention_tactics: [
        {
          timestamp: '0:30',
          line: "We're going from zero to deployed. I'm not skipping the deploy.",
          reason: 'Addresses #1 viewer frustration: tutorials that don\'t ship',
        },
        {
          timestamp: '8:00',
          line: "Server Actions replace your entire API route for forms. Watch this.",
          reason: 'Pattern interrupt before a key demonstration',
        },
      ],
      cta_json: {
        primary: 'Clone the finished repo — link in description. It\'s production-ready.',
        secondary: 'Part 2 adds auth with NextAuth.js. Subscribe to catch it.',
      },
      seo_description:
        'Build and deploy a full-stack app with Next.js App Router from scratch. Covers project setup, Postgres with Drizzle ORM, Server Components, Server Actions with optimistic UI, and deploying to Vercel + Neon. Complete source code in the description.',
      thumbnail_json: {
        text_overlay: 'Full Stack Next.js 20min',
        visual_elements: ['Next.js logo', 'Deployed app screenshot', 'Timer graphic'],
        color_direction: 'Black background, white and blue accent. Clean, professional.',
      },
      performance_prediction_json: null,
      confidence_score: '0.91',
      evidence_json: null,
      titleOptions: [
        {
          id: 'to-4a',
          video_concept_id: 'vc-4',
          title: 'Full Stack Next.js App Router — Build & Deploy in 20 Minutes',
          seo_score: '9.3',
          ctr_score: '9.0',
          rationale: 'Time promise + deploy keyword. Top search intent match.',
          is_recommended: true,
        },
        {
          id: 'to-4b',
          video_concept_id: 'vc-4',
          title: 'Next.js App Router Full Course — From Zero to Deployed',
          seo_score: '8.8',
          ctr_score: '8.3',
          rationale: '"Full Course" adds credibility, "Zero to Deployed" creates narrative arc.',
          is_recommended: false,
        },
        {
          id: 'to-4c',
          video_concept_id: 'vc-4',
          title: 'Build a Real Next.js App in 2025 (With Database + Deploy)',
          seo_score: '8.5',
          ctr_score: '8.7',
          rationale: 'Year signal helps with freshness ranking. Strong CTR from specificity.',
          is_recommended: false,
        },
      ],
      seoKeywords: [
        { id: 'sk-4a', video_concept_id: 'vc-4', keyword: 'next.js app router tutorial', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4b', video_concept_id: 'vc-4', keyword: 'full stack nextjs project', keyword_type: 'primary', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4c', video_concept_id: 'vc-4', keyword: 'next.js 15 full stack app from scratch', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4d', video_concept_id: 'vc-4', keyword: 'nextjs server actions tutorial', keyword_type: 'long_tail', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4e', video_concept_id: 'vc-4', keyword: 'nextjs tutorial', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4f', video_concept_id: 'vc-4', keyword: 'app router', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4g', video_concept_id: 'vc-4', keyword: 'next.js 15', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4h', video_concept_id: 'vc-4', keyword: 'react full stack', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
        { id: 'sk-4i', video_concept_id: 'vc-4', keyword: 'vercel deploy', keyword_type: 'tag', estimated_volume: null, competition: null, source: null },
      ],
    },
  ],
};

export function CalendarResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState<CalendarResponse | null>(id === 'mock' ? MOCK_CALENDAR : null);
  const [loading, setLoading] = useState(id !== 'mock');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === 'mock') return;

    if (!id) {
      setError('Invalid calendar ID');
      setLoading(false);
      return;
    }

    getCalendar(id)
      .then(setCalendar)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="h-4 bg-muted/60 rounded animate-pulse w-32" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 border border-border rounded-xl">
              <div className="h-5 bg-muted rounded animate-pulse w-36 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 bg-muted/60 rounded animate-pulse w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive font-medium">Failed to load calendar</p>
          <p className="text-destructive text-sm mt-1">{error}</p>
          <button
            onClick={() => navigate('/new')}
            className="mt-3 px-4 py-2 bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive/90"
          >
            Generate New Calendar
          </button>
        </div>
      </div>
    );
  }

  if (!calendar) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-left">
      <div className="mb-6">
        <p className="text-2xl font-bold text-foreground">Your Content Calendar</p>
        {calendar.qualityScore && (
          <p className="text-sm text-muted-foreground mt-1">
            Quality score: {Math.round(Number(calendar.qualityScore) * 10) / 10}/10
          </p>
        )}
      </div>
      <CalendarSummaryCard calendar={calendar} />

      {calendar.videoConcepts && calendar.videoConcepts.length > 0 && (
        <div className="mt-8">
          <p className="text-xl font-bold text-foreground mb-4">Video Concepts</p>
          <div className="space-y-6">
            {calendar.videoConcepts.map((concept) => (
              <VideoConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </div>
      )}

      {calendar.id && (
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-sm font-medium text-foreground/80 mb-3">Export</p>
          <div className="flex flex-wrap gap-3">
            <MarkdownExportButton calendarId={calendar.id} />
            <PdfExportButton calendarId={calendar.id} />
          </div>
        </div>
      )}

      {calendar.id && (
        <div className="mt-8 pt-6 border-t border-border">
          <FeedbackRating
            calendarId={calendar.id}
            initialRating={calendar.userRating}
            initialFeedback={calendar.userFeedback}
          />
        </div>
      )}
    </div>
  );
}
