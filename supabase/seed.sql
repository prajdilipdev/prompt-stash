-- ============================================================
-- Prompt Stash — Development seed data
--
-- SAFE DEVELOPMENT DATA ONLY. Run this against a local Supabase
-- instance (`supabase db reset` applies it automatically) — never
-- against production.
--
-- Demo account (local dev only):
--   email:    demo@promptstash.dev
--   password: promptstash-demo
-- ============================================================

-- ------------------------------------------------------------
-- Demo auth user (local Supabase pattern: auth.users + identity)
-- ------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo@promptstash.dev',
  crypt('promptstash-demo', gen_salt('bf')),
  now(), now(), now(),
  '', '',
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Demo User"}'
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  format('{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@promptstash.dev","email_verified":true}'),
  'email',
  now(), now(), now()
) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Tags
-- ------------------------------------------------------------
insert into public.tags (id, user_id, name) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Creative Writing'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Story Ideas'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Writing Prompts'),
  ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Software Development'),
  ('aaaaaaaa-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Technical Documentation'),
  ('aaaaaaaa-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Code Documentation'),
  ('aaaaaaaa-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Data Analysis'),
  ('aaaaaaaa-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Data Visualization'),
  ('aaaaaaaa-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'Chart Recommendation'),
  ('aaaaaaaa-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'Recruitment'),
  ('aaaaaaaa-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'HR'),
  ('aaaaaaaa-0000-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'Product Description'),
  ('aaaaaaaa-0000-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', 'E-commerce'),
  ('aaaaaaaa-0000-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111', 'Content Optimization'),
  ('aaaaaaaa-0000-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111', 'Academic Research'),
  ('aaaaaaaa-0000-4000-8000-000000000016', '11111111-1111-4111-8111-111111111111', 'Paper Summary'),
  ('aaaaaaaa-0000-4000-8000-000000000017', '11111111-1111-4111-8111-111111111111', 'Literature Review'),
  ('aaaaaaaa-0000-4000-8000-000000000018', '11111111-1111-4111-8111-111111111111', 'Code Refactoring'),
  ('aaaaaaaa-0000-4000-8000-000000000019', '11111111-1111-4111-8111-111111111111', 'Code Quality'),
  ('aaaaaaaa-0000-4000-8000-000000000020', '11111111-1111-4111-8111-111111111111', 'Fitness'),
  ('aaaaaaaa-0000-4000-8000-000000000021', '11111111-1111-4111-8111-111111111111', 'Workout Plan'),
  ('aaaaaaaa-0000-4000-8000-000000000022', '11111111-1111-4111-8111-111111111111', 'Personal Training'),
  ('aaaaaaaa-0000-4000-8000-000000000023', '11111111-1111-4111-8111-111111111111', 'Environmental Impact'),
  ('aaaaaaaa-0000-4000-8000-000000000024', '11111111-1111-4111-8111-111111111111', 'Sustainability'),
  ('aaaaaaaa-0000-4000-8000-000000000025', '11111111-1111-4111-8111-111111111111', 'Carbon Footprint'),
  ('aaaaaaaa-0000-4000-8000-000000000026', '11111111-1111-4111-8111-111111111111', 'Agents'),
  ('aaaaaaaa-0000-4000-8000-000000000027', '11111111-1111-4111-8111-111111111111', 'Interacting with APIs'),
  ('aaaaaaaa-0000-4000-8000-000000000028', '11111111-1111-4111-8111-111111111111', 'Chatbots')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Prompts
-- ------------------------------------------------------------
insert into public.prompts (
  id, user_id, title, description, content, notes, is_favorite, created_at, updated_at
) values
  (
    'bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
    'Product Description Optimizer',
    'Enhance product descriptions for e-commerce platforms, focusing on key features and benefits.',
    E'Rewrite the following product description for {{platform}}.\n\nProduct: {{product_name}}\nAudience: {{target_audience}}\nTone: {{tone}}\n\nRequirements:\n- Lead with the strongest benefit, not a feature list\n- Keep it under 120 words\n- Include one concrete proof point if the source provides one\n- End with a short, natural call to action\n\nOriginal description:\n{{original_description}}',
    'Works best with a 2–3 sentence original description. Avoid superlatives like "best ever".',
    true, now() - interval '32 days', now() - interval '3 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
    'Story Idea Generator',
    'Generate original story premises from a genre and a single constraint.',
    E'Generate 5 original story ideas.\n\nGenre: {{genre}}\nConstraint: {{constraint}}\n\nFor each idea give:\n1. A one-sentence logline\n2. The protagonist and their core flaw\n3. The central conflict\n4. Why this idea is different from common genre tropes\n\nDo not use chosen-one plots unless the constraint asks for one.',
    '',
    true, now() - interval '40 days', now() - interval '5 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
    'First-Line Writing Prompts',
    'Turn a theme into ten compelling opening lines for fiction practice.',
    E'Write 10 opening lines for short stories themed around {{theme}}.\n\nRules:\n- Each line must be under 20 words\n- Vary the narrative voice across the set\n- At least 2 must start mid-action\n- No clichés about weather or waking up',
    '',
    false, now() - interval '28 days', now() - interval '9 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
    'Code Review Assistant',
    'Structured code review focused on correctness, readability, and maintainability.',
    E'Review the following {{language}} code.\n\nContext: {{context}}\n\nProvide your review as:\n1. Summary — what the code does, in two sentences\n2. Bugs & risks — ordered by severity, each with a concrete fix\n3. Readability — naming, structure, and clarity suggestions\n4. Maintainability — anything that will hurt in 6 months\n5. What is done well — at least one thing\n\nKeep it direct and specific. Reference line numbers where possible.\n\nCode:\n{{code}}',
    'Great to run before opening a PR. Pair with the Code Refactoring prompt.',
    true, now() - interval '60 days', now() - interval '1 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
    'API Documentation Writer',
    'Generate clean REST API reference docs from a route definition.',
    E'Write API reference documentation for this endpoint:\n\n{{endpoint_definition}}\n\nInclude:\n- Purpose (one sentence)\n- Method and path\n- Authentication requirements\n- Request parameters table (name, type, required, description)\n- Example request (curl)\n- Example 200 response and one error response\n- Rate limits or caveats if mentioned in the definition\n\nFormat in Markdown, suitable for a developer docs site.',
    '',
    false, now() - interval '55 days', now() - interval '12 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
    'Inline Documentation Pass',
    'Add meaningful doc comments to a file without changing behavior.',
    E'Add documentation comments to the following {{language}} file.\n\nRules:\n- Document public functions, classes, and non-obvious logic\n- Explain WHY, not just WHAT\n- Do not rename or refactor anything\n- Do not add comments for self-evident lines\n- Preserve existing formatting\n\nFile:\n{{code}}',
    '',
    false, now() - interval '50 days', now() - interval '14 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111',
    'Exploratory Data Analysis Brief',
    'Structure the first pass over a new dataset with the right questions.',
    E'I have a dataset described as: {{dataset_description}}\nColumns: {{columns}}\nGoal: {{analysis_goal}}\n\nProduce an exploratory analysis plan:\n1. Data quality checks to run first (missingness, duplicates, type mismatches)\n2. Univariate summaries worth computing per column\n3. Relationship checks aligned with the goal\n4. Three hypotheses worth testing\n5. Red flags that would invalidate conclusions\n\nPrefer plain language over jargon.',
    '',
    false, now() - interval '44 days', now() - interval '8 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
    'Chart Recommendation Engine',
    'Pick the right visualization for a dataset and audience.',
    E'Recommend the best chart type for this data:\n\nData: {{data_description}}\nAudience: {{audience}}\nMessage to emphasize: {{key_message}}\n\nAnswer with:\n1. Primary chart type and why it fits\n2. One alternative and when to prefer it\n3. Axis/label suggestions\n4. Two common mistakes to avoid with this chart\n5. A one-sentence chart title that states the takeaway',
    '',
    true, now() - interval '38 days', now() - interval '6 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111',
    'Job Description Writer',
    'Draft inclusive, specific job descriptions from a role brief.',
    E'Write a job description for:\n\nRole: {{role_title}}\nTeam: {{team_description}}\nSeniority: {{seniority}}\nMust-have skills: {{must_have_skills}}\nNice-to-have: {{nice_to_have_skills}}\nLocation/remote policy: {{location}}\n\nRequirements:\n- 150–250 words, specific over generic\n- Separate "you will" responsibilities from "you have" qualifications\n- Inclusive language, no unnecessary jargon or degree requirements\n- Close with a realistic picture of the first 90 days',
    '',
    false, now() - interval '36 days', now() - interval '16 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111',
    'Interview Question Set',
    'Build a balanced interview loop for a role, with evaluation rubrics.',
    E'Create an interview plan for a {{role_title}} candidate at {{seniority}} level.\n\nFocus areas: {{focus_areas}}\n\nProvide:\n1. Opening warm-up question (2 min)\n2. Four core questions, each with: what a strong answer shows, what a weak answer misses, and one follow-up probe\n3. One practical exercise (under 20 minutes) with grading criteria\n4. A red-flag list and a green-flag list\n5. A closing question that reveals motivation\n\nKeep questions behavioral and skill-based. Avoid brainteasers.',
    '',
    false, now() - interval '33 days', now() - interval '18 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111',
    'Onboarding Email Sequence',
    'A warm, practical first-week email sequence for new hires.',
    E'Write a 5-email onboarding sequence for a new {{role_title}} joining {{company_type}}.\n\nEmails:\n1. Welcome + what to expect on day one\n2. Team introduction template\n3. Tooling and access checklist\n4. 30-60-90 day goals overview\n5. Check-in invitation after week one\n\nTone: warm, concise, zero corporate filler. Each email under 150 words.',
    '',
    false, now() - interval '31 days', now() - interval '20 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111',
    'SEO Meta Description Generator',
    'Generate click-worthy meta descriptions within length limits.',
    E'Write 5 meta descriptions for this page:\n\nPage title: {{page_title}}\nPrimary keyword: {{keyword}}\nAudience: {{audience}}\n\nRules:\n- Each under 155 characters\n- Include the keyword naturally, once\n- Specific benefit or outcome, no clickbait\n- Vary structure: question, statistic, direct promise\n- Mark the strongest option and explain why in one sentence',
    '',
    false, now() - interval '29 days', now() - interval '10 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111',
    'Blog Post Outline Builder',
    'Structured outlines with a clear argument before writing begins.',
    E'Create a detailed outline for a blog post.\n\nTopic: {{topic}}\nTarget reader: {{reader}}\nGoal: {{goal}}\nApproximate length: {{word_count}} words\n\nInclude:\n- 3 headline options (specific, benefit-driven)\n- Hook options for the opening\n- H2/H3 structure with one sentence on what each section covers\n- Where to place evidence or examples\n- A conclusion that drives one concrete next step\n\nSkip generic advice sections; prioritize substance.',
    '',
    true, now() - interval '27 days', now() - interval '2 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111',
    'Research Paper Summarizer',
    'Extract the real contribution of a paper, not the abstract paraphrase.',
    E'Summarize this research paper:\n\n{{paper_text}}\n\nStructure your summary as:\n1. Research question — one sentence\n2. Method — how they studied it, key design choices\n3. Main findings — with effect sizes or numbers where given\n4. Limitations the authors admit AND ones they do not\n5. What this changes for practice in {{field}}\n6. One question the paper leaves open\n\nBe precise. Flag any claim not directly supported by the text.',
    '',
    true, now() - interval '25 days', now() - interval '4 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111',
    'Literature Review Synthesizer',
    'Turn a set of sources into a synthesized narrative, not a list.',
    E'Synthesize a literature review section from these sources:\n\n{{sources}}\n\nTopic: {{topic}}\n\nRequirements:\n- Organize thematically, not paper-by-paper\n- Show agreements, tensions, and gaps across sources\n- Cite inline as (Author, Year)\n- End with the unresolved question my research should address\n- Academic tone, no first person, ~{{word_count}} words',
    '',
    false, now() - interval '24 days', now() - interval '11 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000016', '11111111-1111-4111-8111-111111111111',
    'Code Refactoring Coach',
    'Guided refactoring with reasoning, not just rewritten code.',
    E'Refactor the following {{language}} code.\n\nGoals: {{refactoring_goals}}\n\nFor each change:\n1. Show the before/after snippet\n2. Explain the problem with the original\n3. Name the principle applied (SRP, DRY, early return, etc.)\n4. Note any behavioral risk introduced\n\nFinish with a checklist I can apply to similar code in the future.\n\nCode:\n{{code}}',
    '',
    false, now() - interval '22 days', now() - interval '7 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000017', '11111111-1111-4111-8111-111111111111',
    'Test Case Generator',
    'Derive meaningful test cases from a function specification.',
    E'Generate test cases for this function:\n\n{{function_code}}\n\nInclude:\n- Happy path cases\n- Boundary values (empty, zero, max, off-by-one)\n- Invalid/malformed inputs\n- Concurrency or state concerns if relevant\n- For each case: input, expected output, and why it matters\n\nTarget framework: {{test_framework}}. Write runnable tests.',
    '',
    false, now() - interval '21 days', now() - interval '13 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000018', '11111111-1111-4111-8111-111111111111',
    'Personalized Workout Plan',
    'A progressive weekly training plan matched to goals and equipment.',
    E'Build a 4-week workout plan.\n\nGoal: {{goal}}\nExperience level: {{experience_level}}\nDays per week: {{days_per_week}}\nEquipment available: {{equipment}}\nInjuries or limitations: {{limitations}}\n\nFor each session provide:\n- Warm-up\n- Exercises with sets, reps, and rest\n- A progression rule for week over week\n- One deload or recovery guideline\n\nKeep instructions practical for a home or gym setting.',
    'Re-run monthly with updated experience level.',
    true, now() - interval '19 days', now() - interval '2 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000019', '11111111-1111-4111-8111-111111111111',
    'Nutrition Basics Brief',
    'A plain-language nutrition starting point for a training goal.',
    E'Write a practical nutrition brief.\n\nGoal: {{goal}}\nCurrent habits: {{current_habits}}\nDietary restrictions: {{restrictions}}\n\nCover:\n- Daily protein and calorie targets (ranges, not false precision)\n- A simple meal template with swap options\n- Hydration and timing around training\n- Three common mistakes to avoid\n\nDisclaimer: educational only, not medical advice.',
    '',
    false, now() - interval '18 days', now() - interval '15 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000020', '11111111-1111-4111-8111-111111111111',
    'Client Check-in Template',
    'Structured weekly check-ins for personal training clients.',
    E'Draft a weekly check-in message for a personal training client.\n\nClient focus: {{client_goal}}\nThis week''s plan: {{planned_sessions}}\n\nThe message should:\n- Ask about energy, soreness, and adherence (specific questions)\n- Celebrate one concrete win\n- Preview next week''s focus\n- Invite one adjustment request\nKeep it under 120 words, friendly and professional.',
    '',
    false, now() - interval '17 days', now() - interval '6 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000021', '11111111-1111-4111-8111-111111111111',
    'Carbon Footprint Estimator Guide',
    'Structure a personal carbon footprint assessment with honest numbers.',
    E'Help me estimate my carbon footprint.\n\nHousehold size: {{household_size}}\nTransport: {{transport_habits}}\nDiet: {{diet}}\nHome energy: {{energy_sources}}\n\nProvide:\n1. A category-by-category estimate with typical ranges (kg CO2e/year)\n2. The three highest-impact reduction actions for my profile\n3. Approximate impact of each action\n4. What common calculators get wrong\n\nLabel every number as an estimate.',
    '',
    false, now() - interval '16 days', now() - interval '5 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000022', '11111111-1111-4111-8111-111111111111',
    'Sustainability Report Outline',
    'A credible structure for a small organization''s first sustainability report.',
    E'Outline a sustainability report for {{organization_type}}.\n\nReporting period: {{period}}\nKey initiatives: {{initiatives}}\n\nStructure:\n1. Executive summary framing (what, why, what changed)\n2. Material topics and how they were identified\n3. Metrics table with definitions and data sources\n4. Progress narrative with honest gaps\n5. Next-period commitments (measurable)\n\nAvoid greenwashing language. Include a section for limitations.',
    '',
    false, now() - interval '15 days', now() - interval '9 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000023', '11111111-1111-4111-8111-111111111111',
    'Eco-Product Copy Review',
    'Audit marketing claims for accuracy before publishing.',
    E'Review this sustainability-related product copy for claim accuracy:\n\n{{copy}}\n\nCheck for:\n- Vague terms ("eco-friendly", "green") that need substantiation\n- Claims requiring certification to state legally\n- Overstated impact language\n- Safer, specific rewrites for each problem claim\n\nOutput a table: original claim, issue, suggested rewrite.',
    '',
    false, now() - interval '14 days', now() - interval '3 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000024', '11111111-1111-4111-8111-111111111111',
    'Agent System Prompt Architect',
    'Design robust system prompts for task-specific AI agents.',
    E'Design a system prompt for an AI agent with this job:\n\nAgent role: {{agent_role}}\nTools available: {{tools}}\nGuardrails: {{guardrails}}\n\nThe system prompt must include:\n1. Role and objective in one paragraph\n2. Step-by-step operating procedure\n3. Tool-use rules (when to use each, when to stop)\n4. Failure handling (ambiguous input, tool errors, out-of-scope asks)\n5. Output format contract\n6. Explicit refusal cases\n\nKeep it under 400 words and testable.',
    'This is the meta-prompt for building other prompts. Favorite it.',
    true, now() - interval '12 days', now() - interval '1 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000025', '11111111-1111-4111-8111-111111111111',
    'API Integration Planner',
    'Plan a reliable integration with a third-party API before writing code.',
    E'Plan an integration with this API:\n\nAPI: {{api_name}}\nPurpose: {{purpose}}\nConstraints: {{constraints}}\n\nProduce:\n1. Authentication approach and secret handling\n2. Required endpoints with request/response shapes\n3. Error handling strategy (retries, backoff, idempotency)\n4. Rate limit plan\n5. Data mapping to our model: {{our_model}}\n6. Monitoring signals that would catch silent failures\n\nFlag anything that needs vendor confirmation.',
    '',
    false, now() - interval '10 days', now() - interval '4 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000026', '11111111-1111-4111-8111-111111111111',
    'Support Chatbot Personality',
    'Define a consistent, helpful voice for a support chatbot.',
    E'Define the personality and rules for a support chatbot.\n\nProduct: {{product}}\nAudience: {{audience}}\nEscalation path: {{escalation_path}}\n\nDeliver:\n1. Voice guidelines (tone, sentence style, banned phrases)\n2. Greeting and acknowledgment templates\n3. Rules for admitting uncertainty\n4. Handoff-to-human triggers and phrasing\n5. Three example exchanges: happy path, frustrated user, out-of-scope question',
    '',
    false, now() - interval '8 days', now() - interval '2 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000027', '11111111-1111-4111-8111-111111111111',
    'Meeting Notes Distiller',
    'Turn messy meeting transcripts into decisions, owners, and next steps.',
    E'Distill these meeting notes into a clean summary.\n\nMeeting: {{meeting_title}}\nAttendees: {{attendees}}\n\nNotes:\n{{raw_notes}}\n\nOutput:\n1. Three-sentence overview\n2. Decisions made (with decision owner)\n3. Action items — each with owner and due date if mentioned\n4. Open questions parked for next time\n5. Anything that was discussed but explicitly not decided\n\nBe ruthless about removing filler. Preserve disagreements honestly.',
    '',
    false, now() - interval '6 days', now() - interval '1 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000028', '11111111-1111-4111-8111-111111111111',
    'Release Notes Writer',
    'Clear, user-focused release notes from a raw changelog.',
    E'Write release notes from this changelog:\n\n{{changelog}}\nVersion: {{version}}\nAudience: {{audience}}\n\nGuidelines:\n- Group by "New", "Improved", "Fixed"\n- Lead each item with the user benefit, not the implementation\n- Translate internal tickets into plain language\n- Flag breaking changes at the very top\n- End with one line about where to report issues',
    '',
    false, now() - interval '4 days', now() - interval '1 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000029', '11111111-1111-4111-8111-111111111111',
    'Diff Explainer',
    'Explain a code diff for reviewers who lack full context.',
    E'Explain this diff for code review:\n\n{{diff}}\n\nProvide:\n1. One-paragraph plain-English summary of intent\n2. File-by-file walkthrough of meaningful changes\n3. Which changes carry behavioral risk and why\n4. Questions the author should answer before merge\n5. Suggested reviewers or owners to involve',
    '',
    false, now() - interval '2 days', now() - interval '1 days'
  )
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Prompt ↔ tag links
-- ------------------------------------------------------------
insert into public.prompt_tags (prompt_id, tag_id) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000012'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000013'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000003'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000019'),
  ('bbbbbbbb-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000005'),
  ('bbbbbbbb-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000006'),
  ('bbbbbbbb-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000007'),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000008'),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000009'),
  ('bbbbbbbb-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000010'),
  ('bbbbbbbb-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000011'),
  ('bbbbbbbb-0000-4000-8000-000000000010', 'aaaaaaaa-0000-4000-8000-000000000010'),
  ('bbbbbbbb-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000011'),
  ('bbbbbbbb-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000014'),
  ('bbbbbbbb-0000-4000-8000-000000000013', 'aaaaaaaa-0000-4000-8000-000000000014'),
  ('bbbbbbbb-0000-4000-8000-000000000014', 'aaaaaaaa-0000-4000-8000-000000000015'),
  ('bbbbbbbb-0000-4000-8000-000000000014', 'aaaaaaaa-0000-4000-8000-000000000016'),
  ('bbbbbbbb-0000-4000-8000-000000000015', 'aaaaaaaa-0000-4000-8000-000000000015'),
  ('bbbbbbbb-0000-4000-8000-000000000015', 'aaaaaaaa-0000-4000-8000-000000000017'),
  ('bbbbbbbb-0000-4000-8000-000000000016', 'aaaaaaaa-0000-4000-8000-000000000018'),
  ('bbbbbbbb-0000-4000-8000-000000000016', 'aaaaaaaa-0000-4000-8000-000000000019'),
  ('bbbbbbbb-0000-4000-8000-000000000017', 'aaaaaaaa-0000-4000-8000-000000000019'),
  ('bbbbbbbb-0000-4000-8000-000000000017', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('bbbbbbbb-0000-4000-8000-000000000018', 'aaaaaaaa-0000-4000-8000-000000000020'),
  ('bbbbbbbb-0000-4000-8000-000000000018', 'aaaaaaaa-0000-4000-8000-000000000021'),
  ('bbbbbbbb-0000-4000-8000-000000000019', 'aaaaaaaa-0000-4000-8000-000000000020'),
  ('bbbbbbbb-0000-4000-8000-000000000019', 'aaaaaaaa-0000-4000-8000-000000000022'),
  ('bbbbbbbb-0000-4000-8000-000000000020', 'aaaaaaaa-0000-4000-8000-000000000022'),
  ('bbbbbbbb-0000-4000-8000-000000000021', 'aaaaaaaa-0000-4000-8000-000000000025'),
  ('bbbbbbbb-0000-4000-8000-000000000021', 'aaaaaaaa-0000-4000-8000-000000000023'),
  ('bbbbbbbb-0000-4000-8000-000000000022', 'aaaaaaaa-0000-4000-8000-000000000024'),
  ('bbbbbbbb-0000-4000-8000-000000000022', 'aaaaaaaa-0000-4000-8000-000000000023'),
  ('bbbbbbbb-0000-4000-8000-000000000023', 'aaaaaaaa-0000-4000-8000-000000000024'),
  ('bbbbbbbb-0000-4000-8000-000000000024', 'aaaaaaaa-0000-4000-8000-000000000026'),
  ('bbbbbbbb-0000-4000-8000-000000000025', 'aaaaaaaa-0000-4000-8000-000000000027'),
  ('bbbbbbbb-0000-4000-8000-000000000025', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('bbbbbbbb-0000-4000-8000-000000000026', 'aaaaaaaa-0000-4000-8000-000000000028'),
  ('bbbbbbbb-0000-4000-8000-000000000026', 'aaaaaaaa-0000-4000-8000-000000000026'),
  ('bbbbbbbb-0000-4000-8000-000000000027', 'aaaaaaaa-0000-4000-8000-000000000014'),
  ('bbbbbbbb-0000-4000-8000-000000000028', 'aaaaaaaa-0000-4000-8000-000000000006'),
  ('bbbbbbbb-0000-4000-8000-000000000028', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('bbbbbbbb-0000-4000-8000-000000000029', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('bbbbbbbb-0000-4000-8000-000000000029', 'aaaaaaaa-0000-4000-8000-000000000019')
on conflict (prompt_id, tag_id) do nothing;
