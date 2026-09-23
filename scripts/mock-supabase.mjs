/**
 * QA DOUBLE — local Supabase-shaped REST server for UI smoke testing only.
 *
 * This script is a development/QA tool. The production application talks
 * exclusively to a real Supabase project; nothing here is shipped or used
 * in production. Run it, point VITE_SUPABASE_URL at it, and exercise the UI.
 *
 *   node scripts/mock-supabase.mjs   (listens on MOCK_PORT, default 8877)
 */

import http from 'node:http'
import crypto from 'node:crypto'

const PORT = Number(process.env.MOCK_PORT ?? 8877)
const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString()

const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'qa@promptstash.dev',
  email_confirmed_at: daysAgo(40),
  created_at: daysAgo(40),
  updated_at: daysAgo(1),
  app_metadata: { provider: 'email' },
  user_metadata: { display_name: 'QA User' },
  recovery_sent_at: null,
  identities: [],
}

const db = {
  profiles: [
    {
      id: USER.id,
      display_name: 'QA User',
      avatar_url: null,
      created_at: daysAgo(40),
      updated_at: daysAgo(1),
    },
  ],
  tags: [],
  prompts: [],
  prompt_tags: [],
}

const tagDefs = [
  'Marketing', 'E-commerce', 'Software Development', 'Code Review', 'Creative Writing',
  'Data Analysis', 'Research', 'Fitness', 'Agents', 'Documentation',
]
for (const name of tagDefs) db.tags.push({ id: uid(), user_id: USER.id, name, created_at: daysAgo(30), updated_at: daysAgo(30) })
const tag = (name) => db.tags.find((t) => t.name === name)

const promptDefs = [
  ['Product Description Optimizer', 'Enhance product descriptions for e-commerce platforms, focusing on key features and benefits.', 'Rewrite the following product description for {{platform}}.\n\nProduct: {{product_name}}\nAudience: {{target_audience}}\nTone: {{tone}}\n\nLead with the strongest benefit. Keep it under 120 words.', ['Marketing', 'E-commerce'], true, 3],
  ['Story Idea Generator', 'Generate original story premises from a genre and a single constraint.', 'Generate 5 original story ideas.\n\nGenre: {{genre}}\nConstraint: {{constraint}}\n\nFor each idea give a one-sentence logline, the protagonist and their flaw, and the central conflict.', ['Creative Writing'], true, 5],
  ['Code Review Assistant', 'Structured code review focused on correctness, readability, and maintainability.', 'Review the following {{language}} code.\n\nContext: {{context}}\n\n1. Summary\n2. Bugs and risks by severity\n3. Readability\n4. Maintainability\n5. What is done well\n\nCode:\n{{code}}', ['Software Development', 'Code Review'], true, 1],
  ['Exploratory Data Analysis Brief', 'Structure the first pass over a new dataset with the right questions.', 'I have a dataset described as: {{dataset_description}}\nColumns: {{columns}}\nGoal: {{analysis_goal}}\n\nProduce an exploratory analysis plan with data quality checks first.', ['Data Analysis'], false, 8],
  ['Research Paper Summarizer', 'Extract the real contribution of a paper, not an abstract paraphrase.', 'Summarize this research paper:\n\n{{paper_text}}\n\n1. Research question\n2. Method\n3. Main findings\n4. Limitations\n5. What changes for practice', ['Research'], false, 4],
  ['Personalized Workout Plan', 'A progressive weekly training plan matched to goals and equipment.', 'Build a 4-week workout plan.\n\nGoal: {{goal}}\nExperience level: {{experience_level}}\nDays per week: {{days_per_week}}\nEquipment: {{equipment}}', ['Fitness'], false, 2],
  ['Agent System Prompt Architect', 'Design robust system prompts for task-specific AI agents.', 'Design a system prompt for an AI agent.\n\nAgent role: {{agent_role}}\nTools available: {{tools}}\nGuardrails: {{guardrails}}', ['Agents'], true, 1],
  ['API Documentation Writer', 'Generate clean REST API reference docs from a route definition.', 'Write API reference documentation for:\n\n{{endpoint_definition}}\n\nInclude purpose, method and path, auth, parameter table, curl example, and responses.', ['Documentation', 'Software Development'], false, 12],
  ['SEO Meta Description Generator', 'Generate click-worthy meta descriptions within length limits.', 'Write 5 meta descriptions.\n\nPage title: {{page_title}}\nPrimary keyword: {{keyword}}\n\nEach under 155 characters.', ['Marketing'], false, 10],
  ['Meeting Notes Distiller', 'Turn messy meeting notes into decisions, owners, and next steps.', 'Distill these meeting notes:\n\nMeeting: {{meeting_title}}\nNotes:\n{{raw_notes}}', ['Documentation'], false, 6],
]

for (const [title, description, content, tags, fav, updatedDays] of promptDefs) {
  const id = uid()
  db.prompts.push({
    id,
    user_id: USER.id,
    title,
    description,
    content,
    notes: '',
    is_favorite: fav,
    created_at: daysAgo(updatedDays + 20),
    updated_at: daysAgo(updatedDays),
    archived_at: null,
    deleted_at: null,
  })
  for (const name of tags) db.prompt_tags.push({ prompt_id: id, tag_id: tag(name).id, created_at: daysAgo(20) })
}
// One archived + one trashed sample so those views have content
const archivedId = uid()
db.prompts.push({ id: archivedId, user_id: USER.id, title: 'Old Campaign Brief', description: 'Archived example.', content: 'Write a campaign brief for {{product}}.', notes: '', is_favorite: false, created_at: daysAgo(60), updated_at: daysAgo(55), archived_at: daysAgo(55), deleted_at: null })
db.prompt_tags.push({ prompt_id: archivedId, tag_id: tag('Marketing').id, created_at: daysAgo(60) })
db.prompts.push({ id: uid(), user_id: USER.id, title: 'Deprecated Draft', description: 'Sits in the trash.', content: 'An old draft prompt.', notes: '', is_favorite: false, created_at: daysAgo(70), updated_at: daysAgo(66), archived_at: null, deleted_at: daysAgo(66) })

/* ------------------------------------------------------------------ */
/* Query helpers                                                       */
/* ------------------------------------------------------------------ */

function withJoins(row) {
  const links = db.prompt_tags.filter((l) => l.prompt_id === row.id)
  return {
    ...row,
    prompt_tags: links.map((l) => ({ tag_id: l.tag_id, tags: db.tags.find((t) => t.id === l.tag_id) ?? null })),
  }
}

function ilike(pattern) {
  const core = pattern.replace(/(^%|%$)/g, '').replace(/\\([%_,()])/g, '$1')
  const rx = new RegExp(core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return (value) => rx.test(value ?? '')
}

function matchesOr(row, orExpr) {
  const parts = orExpr.split(',').map((p) => p.trim())
  return parts.some((part) => {
    if (part.startsWith('tag_id.eq.')) {
      const tagId = part.slice('tag_id.eq.'.length)
      return db.prompt_tags.some((l) => l.prompt_id === row.id && l.tag_id === tagId)
    }
    if (part.startsWith('name.ilike.')) {
      const test = ilike(part.slice('name.ilike.'.length))
      const names = db.prompt_tags
        .filter((l) => l.prompt_id === row.id)
        .map((l) => db.tags.find((t) => t.id === l.tag_id)?.name)
      return names.some((n) => n !== undefined && test(n))
    }
    const m = part.match(/^(\w+)\.ilike\.(.*)$/)
    if (!m) return false
    return ilike(m[2])(String(row[m[1]] ?? ''))
  })
}

/**
 * PostgREST filter values carry the operator: `archived_at=is.null`,
 * `is_favorite=eq.true`, `updated_at=gte.2026-...`, `title=ilike.%x%`.
 */
function applyFilters(rows, params) {
  let out = [...rows]
  for (const [key, value] of params) {
    if (['select', 'order', 'limit', 'offset', 'or', 'prompt_tags.or'].includes(key)) continue
    if (!/^[\w]+$/.test(key)) continue
    const column = key
    if (value === 'is.null') out = out.filter((r) => r[column] === null)
    else if (value.startsWith('not.is.null')) out = out.filter((r) => r[column] !== null)
    else if (value.startsWith('eq.')) out = out.filter((r) => String(r[column]) === value.slice(3))
    else if (value.startsWith('gte.')) out = out.filter((r) => String(r[column] ?? '') >= value.slice(4))
    else if (value.startsWith('lte.')) out = out.filter((r) => String(r[column] ?? '') <= value.slice(4))
    else if (value.startsWith('ilike.')) out = out.filter((r) => ilike(value.slice(6))(String(r[column] ?? '')))
    else if (value.startsWith('in.')) {
      const list = value.slice(3).replace(/^\(|\)$/g, '').split(',')
      out = out.filter((r) => list.includes(`"${r[column]}"`) || list.includes(String(r[column])))
    }
  }
  const or = params.get('or') ?? params.get('prompt_tags.or')
  if (or) out = out.filter((r) => matchesOr(r, or))
  return out
}

function applyOrder(rows, order) {
  if (!order) return rows
  const [column, direction] = order.split('.')
  const dir = direction === 'desc' ? -1 : 1
  return rows.sort((a, b) => (String(a[column] ?? '') > String(b[column] ?? '') ? dir : -dir))
}

/* ------------------------------------------------------------------ */
/* Server                                                              */
/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname
  const method = req.method

  const json = (status, body, headers = {}) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'Access-Control-Expose-Headers': 'Content-Range',
      ...headers,
    })
    res.end(body === undefined ? '' : JSON.stringify(body))
  }

  if (method === 'OPTIONS') return json(204)

  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}

    /* -------- auth -------- */
    if (path.startsWith('/auth/v1')) {
      if (path.includes('/token') || path.includes('/signup') || path === '/auth/v1/') {
        return json(200, { access_token: 'mock', refresh_token: 'mock', token_type: 'bearer', expires_in: 3600, user: USER })
      }
      if (path.includes('/user') && method === 'GET') return json(200, USER)
      if (path.includes('/user') && (method === 'PUT' || method === 'PATCH')) {
        if (body.password) USER.password_updated = true
        return json(200, USER)
      }
      if (path.includes('/recover')) return json(200, {})
      if (path.includes('/logout')) return json(204)
      return json(200, {})
    }

    /* -------- rest -------- */
    const tableMatch = path.match(/^\/rest\/v1\/(\w+)/)
    if (!tableMatch) return json(404, { message: 'not found' })
    const table = tableMatch[1]
    const rows = db[table]
    if (!rows) return json(404, { message: `unknown table ${table}` })

    const params = url.searchParams
    const prefer = req.headers.prefer ?? ''
    const wantsCount = prefer.includes('count=exact') || prefer.includes('count=planned')
    const returning = prefer.includes('return=representation')

    if (method === 'GET') {
      let out = applyFilters(rows, params)
      if (table === 'prompts' || table === 'tags') out = out.filter((r) => r.user_id === USER.id)
      if (table === 'prompt_tags') {
        // scoped via prompts
        const own = new Set(db.prompts.filter((p) => p.user_id === USER.id).map((p) => p.id))
        out = out.filter((r) => own.has(r.prompt_id))
      }
      const total = out.length
      out = applyOrder(out, params.get('order'))
      const rangeHeader = req.headers.range
      let offset = Number(params.get('offset') ?? 0)
      let limit = Number(params.get('limit') ?? 1000)
      if (rangeHeader) {
        const [a, b] = String(rangeHeader).replace('items=', '').split('-')
        offset = Number(a)
        limit = Number(b) - offset + 1
      }
      const paged = out.slice(offset, offset + limit)
      let payload = table === 'prompts' ? paged.map(withJoins) : paged
      const wantsObject = String(req.headers.accept ?? '').includes('vnd.pgrst.object')
      if (wantsObject) {
        if (payload.length === 1) return json(200, payload[0])
        return json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })
      }
      const headers = wantsCount ? { 'Content-Range': `${offset}-${offset + paged.length - 1}/${total}` } : {}
      return json(200, payload, headers)
    }

    if (method === 'POST') {
      const isArray = Array.isArray(body)
      const items = isArray ? body : [body]
      const created = []
      for (const item of items) {
        if (table === 'tags') {
          const existing = db.tags.find(
            (t) => t.user_id === USER.id && t.name.toLowerCase() === String(item.name).toLowerCase(),
          )
          if (existing) {
            // Emulate the unique (user_id, lower(name)) constraint.
            return json(409, { code: '23505', message: 'duplicate key value violates unique constraint' })
          }
          const row = { id: uid(), user_id: USER.id, name: item.name, created_at: now(), updated_at: now() }
          db.tags.push(row)
          created.push(row)
          continue
        }
        if (table === 'prompt_tags') {
          const row = { prompt_id: item.prompt_id, tag_id: item.tag_id, created_at: now() }
          db.prompt_tags.push(row)
          created.push(row)
          continue
        }
        const row = {
          id: uid(),
          user_id: USER.id,
          title: item.title ?? '',
          description: item.description ?? '',
          content: item.content ?? '',
          notes: item.notes ?? '',
          is_favorite: Boolean(item.is_favorite),
          created_at: now(),
          updated_at: now(),
          archived_at: null,
          deleted_at: null,
        }
        db.prompts.push(row)
        created.push(row)
      }
      const payload = table === 'prompts' ? created.map(withJoins) : created
      return json(201, isArray ? payload : payload[0])
    }

    if (method === 'PATCH' || method === 'PUT') {
      let targets = rows
      const idEq = params.get('id')?.replace(/^eq\./, '')
      if (idEq) targets = rows.filter((r) => r.id === idEq)
      for (const row of targets) {
        Object.assign(row, body, { updated_at: now() })
      }
      let payload = table === 'prompts' ? targets.map(withJoins) : targets
      if (String(req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (payload.length === 1) return json(200, payload[0])
        return json(406, { code: 'PGRST116', message: 'multiple (or no) rows returned' })
      }
      return json(200, returning || params.get('select') ? payload : payload)
    }

    if (method === 'DELETE') {
      const idEq = params.get('id')?.replace(/^eq\./, '')
      const promptEq = params.get('prompt_id')?.replace(/^eq\./, '')
      if (table === 'prompt_tags' && promptEq) {
        db.prompt_tags = db.prompt_tags.filter((l) => l.prompt_id !== promptEq)
        return json(204)
      }
      const before = rows.length
      if (table === 'prompts') {
        db.prompts = db.prompts.filter((r) => r.id !== idEq)
        db.prompt_tags = db.prompt_tags.filter((l) => l.prompt_id !== idEq)
      } else if (table === 'tags') {
        db.tags = db.tags.filter((r) => r.id !== idEq)
        db.prompt_tags = db.prompt_tags.filter((l) => l.tag_id !== idEq)
      } else {
        db[table] = rows.filter((r) => r.id !== idEq)
      }
      void before
      return json(204)
    }

    return json(405, { message: 'method not allowed' })
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-supabase] QA double listening on http://localhost:${PORT}`)
})
