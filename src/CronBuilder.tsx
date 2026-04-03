import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Sun, Moon, Languages, Clock } from 'lucide-react'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/pt_BR'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'Cron Expression Builder',
    subtitle: 'Build and validate cron expressions visually with next execution preview and human-readable descriptions. Everything runs client-side.',
    expression: 'Cron Expression',
    expressionDesc: 'Edit directly or use the visual builder below',
    expressionPlaceholder: '* * * * *',
    copy: 'Copy',
    copied: 'Copied!',
    visual: 'Visual Builder',
    visualDesc: 'Configure each field interactively',
    minute: 'Minute',
    hour: 'Hour',
    dayOfMonth: 'Day of Month',
    month: 'Month',
    dayOfWeek: 'Day of Week',
    every: 'Every',
    specific: 'Specific',
    range: 'Range',
    step: 'Step',
    from: 'From',
    to: 'To',
    everyN: 'Every N',
    startAt: 'starting at',
    presets: 'Common Presets',
    presetsDesc: 'Click to apply',
    description: 'Description',
    nextRuns: 'Next 5 Executions',
    nextRunsDesc: 'Calculated from now',
    invalidExpr: 'Invalid cron expression',
    fieldMinute: 'Minute (0-59)',
    fieldHour: 'Hour (0-23)',
    fieldDOM: 'Day of Month (1-31)',
    fieldMonth: 'Month (1-12)',
    fieldDOW: 'Day of Week (0-7, Sun=0/7)',
    builtBy: 'Built by',
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    weekdays: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    weekdaysShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },
  pt: {
    title: 'Construtor de Expressao Cron',
    subtitle: 'Construa e valide expressoes cron visualmente com previsao de proximas execucoes e descricoes legíveis. Tudo roda no navegador.',
    expression: 'Expressao Cron',
    expressionDesc: 'Edite diretamente ou use o construtor visual abaixo',
    expressionPlaceholder: '* * * * *',
    copy: 'Copiar',
    copied: 'Copiado!',
    visual: 'Construtor Visual',
    visualDesc: 'Configure cada campo interativamente',
    minute: 'Minuto',
    hour: 'Hora',
    dayOfMonth: 'Dia do Mes',
    month: 'Mes',
    dayOfWeek: 'Dia da Semana',
    every: 'Todo',
    specific: 'Especifico',
    range: 'Intervalo',
    step: 'Passo',
    from: 'De',
    to: 'Ate',
    everyN: 'A cada N',
    startAt: 'iniciando em',
    presets: 'Presets Comuns',
    presetsDesc: 'Clique para aplicar',
    description: 'Descricao',
    nextRuns: 'Proximas 5 Execucoes',
    nextRunsDesc: 'Calculado a partir de agora',
    invalidExpr: 'Expressao cron invalida',
    fieldMinute: 'Minuto (0-59)',
    fieldHour: 'Hora (0-23)',
    fieldDOM: 'Dia do Mes (1-31)',
    fieldMonth: 'Mes (1-12)',
    fieldDOW: 'Dia da Semana (0-7, Dom=0/7)',
    builtBy: 'Criado por',
    months: ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
    weekdays: ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'],
    weekdaysShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'],
  },
} as const

type Lang = keyof typeof translations

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { labelEn: 'Every minute',          labelPt: 'Todo minuto',              expr: '* * * * *' },
  { labelEn: 'Every 5 minutes',       labelPt: 'A cada 5 minutos',         expr: '*/5 * * * *' },
  { labelEn: 'Every 15 minutes',      labelPt: 'A cada 15 minutos',        expr: '*/15 * * * *' },
  { labelEn: 'Every 30 minutes',      labelPt: 'A cada 30 minutos',        expr: '*/30 * * * *' },
  { labelEn: 'Every hour',            labelPt: 'A cada hora',              expr: '0 * * * *' },
  { labelEn: 'Every day at midnight', labelPt: 'Todo dia a meia-noite',    expr: '0 0 * * *' },
  { labelEn: 'Every day at noon',     labelPt: 'Todo dia ao meio-dia',     expr: '0 12 * * *' },
  { labelEn: 'Every Monday at 9am',   labelPt: 'Toda segunda as 9h',       expr: '0 9 * * 1' },
  { labelEn: 'Every weekday at 8am',  labelPt: 'Dias uteis as 8h',         expr: '0 8 * * 1-5' },
  { labelEn: 'Every weekend',         labelPt: 'Todo fim de semana',       expr: '0 10 * * 0,6' },
  { labelEn: 'Every 1st of month',    labelPt: '1o de cada mes',           expr: '0 0 1 * *' },
  { labelEn: 'Every quarter',         labelPt: 'Todo trimestre',           expr: '0 0 1 1,4,7,10 *' },
  { labelEn: 'Every year (Jan 1st)',  labelPt: 'Todo ano (1 jan)',         expr: '0 0 1 1 *' },
]

// ── Field types ───────────────────────────────────────────────────────────────
type FieldMode = 'every' | 'specific' | 'range' | 'step'

interface FieldState {
  mode: FieldMode
  specific: string   // comma-separated values
  rangeFrom: string
  rangeTo: string
  stepEvery: string
  stepStart: string
}

const defaultField = (): FieldState => ({
  mode: 'every',
  specific: '',
  rangeFrom: '',
  rangeTo: '',
  stepEvery: '',
  stepStart: '0',
})

function fieldToExpr(f: FieldState): string {
  switch (f.mode) {
    case 'every': return '*'
    case 'specific': return f.specific.trim() || '*'
    case 'range': return (f.rangeFrom && f.rangeTo) ? `${f.rangeFrom}-${f.rangeTo}` : '*'
    case 'step': return f.stepEvery ? `${f.stepStart || '0'}/${f.stepEvery}` : '*'
  }
}

function exprToFields(expr: string): [FieldState, FieldState, FieldState, FieldState, FieldState] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return [defaultField(), defaultField(), defaultField(), defaultField(), defaultField()]

  return parts.map((p): FieldState => {
    if (p === '*') return { ...defaultField(), mode: 'every' }
    if (p.includes('/')) {
      const [start, step] = p.split('/')
      return { ...defaultField(), mode: 'step', stepStart: start === '*' ? '0' : start, stepEvery: step }
    }
    if (p.includes('-')) {
      const [from, to] = p.split('-')
      return { ...defaultField(), mode: 'range', rangeFrom: from, rangeTo: to }
    }
    return { ...defaultField(), mode: 'specific', specific: p }
  }) as [FieldState, FieldState, FieldState, FieldState, FieldState]
}

// ── Cron validation & next runs ───────────────────────────────────────────────
function validateCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return false
  const ranges = [[0,59],[0,23],[1,31],[1,12],[0,7]]
  return parts.every((p, i) => {
    const [min, max] = ranges[i]
    if (p === '*') return true
    if (/^\*\/\d+$/.test(p)) {
      const n = parseInt(p.slice(2))
      return n >= 1 && n <= max
    }
    if (/^\d+\/\d+$/.test(p)) {
      const [s, st] = p.split('/').map(Number)
      return s >= min && s <= max && st >= 1
    }
    if (/^\d+-\d+$/.test(p)) {
      const [a, b] = p.split('-').map(Number)
      return a >= min && a <= max && b >= min && b <= max && a < b
    }
    // comma-separated
    const vals = p.split(',')
    return vals.every(v => {
      const n = parseInt(v)
      return /^\d+$/.test(v) && n >= min && n <= max
    })
  })
}

function matchesField(value: number, expr: string): boolean {
  if (expr === '*') return true
  if (expr.startsWith('*/')) {
    const step = parseInt(expr.slice(2))
    return value % step === 0
  }
  if (expr.includes('/')) {
    const [start, step] = expr.split('/').map(Number)
    if (value < start) return false
    return (value - start) % step === 0
  }
  if (expr.includes('-') && !expr.includes(',')) {
    const [a, b] = expr.split('-').map(Number)
    return value >= a && value <= b
  }
  // comma-separated (may include ranges)
  return expr.split(',').some(part => {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      return value >= a && value <= b
    }
    return parseInt(part) === value
  })
}

function getNextRuns(expr: string, count = 5): Date[] {
  if (!validateCron(expr)) return []
  const parts = expr.trim().split(/\s+/)
  const [minE, hourE, domE, monE, dowE] = parts

  const results: Date[] = []
  const now = new Date()
  // start from next minute
  const start = new Date(now)
  start.setSeconds(0, 0)
  start.setMinutes(start.getMinutes() + 1)

  let current = new Date(start)
  let iterations = 0
  const maxIter = 600000 // up to ~1 year of minutes

  while (results.length < count && iterations < maxIter) {
    const min = current.getMinutes()
    const hour = current.getHours()
    const dom = current.getDate()
    const mon = current.getMonth() + 1
    const dow = current.getDay() // 0=Sun

    const dowMatch = matchesField(dow, dowE) || (dowE !== '*' && matchesField(dow === 0 ? 7 : dow, dowE))

    if (
      matchesField(mon, monE) &&
      matchesField(dom, domE) &&
      (dowE === '*' || dowMatch) &&
      matchesField(hour, hourE) &&
      matchesField(min, minE)
    ) {
      results.push(new Date(current))
    }

    current = new Date(current.getTime() + 60000)
    iterations++
  }

  return results
}

function formatDate(d: Date, lang: Lang): string {
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  return d.toLocaleString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Field selector component ──────────────────────────────────────────────────
interface FieldConfig {
  label: string
  min: number
  max: number
  options?: { value: number; label: string }[]
}

interface FieldEditorProps {
  config: FieldConfig
  state: FieldState
  onChange: (s: FieldState) => void
  t: typeof translations[Lang]
}

function FieldEditor({ config, state, onChange, t }: FieldEditorProps) {
  const { min, max, options } = config

  const numOptions = options ?? Array.from({ length: max - min + 1 }, (_, i) => ({
    value: i + min,
    label: String(i + min),
  }))

  const modeBtn = (mode: FieldMode, label: string) => (
    <button
      key={mode}
      onClick={() => onChange({ ...state, mode })}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        state.mode === mode
          ? 'bg-teal-500 text-white'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {config.label}
        </span>
        <span className="font-mono text-xs font-bold text-teal-500 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
          {fieldToExpr(state)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {modeBtn('every', t.every)}
        {modeBtn('specific', t.specific)}
        {modeBtn('range', t.range)}
        {modeBtn('step', t.step)}
      </div>

      {state.mode === 'specific' && (
        <div className="flex flex-wrap gap-1">
          {numOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                const vals = state.specific ? state.specific.split(',').map(v => v.trim()).filter(Boolean) : []
                const strVal = String(opt.value)
                const idx = vals.indexOf(strVal)
                const next = idx >= 0 ? vals.filter(v => v !== strVal) : [...vals, strVal]
                onChange({ ...state, specific: next.sort((a, b) => Number(a) - Number(b)).join(',') })
              }}
              className={`min-w-[2rem] px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                state.specific.split(',').includes(String(opt.value))
                  ? 'bg-teal-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {state.mode === 'range' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">{t.from}</span>
          <select
            value={state.rangeFrom}
            onChange={e => onChange({ ...state, rangeFrom: e.target.value })}
            className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs"
          >
            <option value="">-</option>
            {numOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-zinc-500">{t.to}</span>
          <select
            value={state.rangeTo}
            onChange={e => onChange({ ...state, rangeTo: e.target.value })}
            className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs"
          >
            <option value="">-</option>
            {numOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {state.mode === 'step' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">{t.everyN}</span>
          <input
            type="number"
            min={1}
            max={max}
            value={state.stepEvery}
            onChange={e => onChange({ ...state, stepEvery: e.target.value })}
            className="w-16 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs"
            placeholder="1"
          />
          <span className="text-zinc-500">{t.startAt}</span>
          <input
            type="number"
            min={min}
            max={max}
            value={state.stepStart}
            onChange={e => onChange({ ...state, stepStart: e.target.value })}
            className="w-16 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs"
            placeholder={String(min)}
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CronBuilder() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [expr, setExpr] = useState('* * * * *')
  const [rawInput, setRawInput] = useState('* * * * *')
  const [copied, setCopied] = useState(false)
  const [fields, setFields] = useState<[FieldState, FieldState, FieldState, FieldState, FieldState]>(
    () => exprToFields('* * * * *')
  )

  const t = translations[lang]
  const isValid = validateCron(expr)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  // Sync fields -> expr
  const updateFromFields = useCallback((newFields: [FieldState, FieldState, FieldState, FieldState, FieldState]) => {
    setFields(newFields)
    const newExpr = newFields.map(fieldToExpr).join(' ')
    setExpr(newExpr)
    setRawInput(newExpr)
  }, [])

  // Sync raw input -> fields
  const handleRawChange = (val: string) => {
    setRawInput(val)
    setExpr(val)
    if (validateCron(val)) {
      setFields(exprToFields(val))
    }
  }

  const applyPreset = (presetExpr: string) => {
    setExpr(presetExpr)
    setRawInput(presetExpr)
    setFields(exprToFields(presetExpr))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(expr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const humanReadable = (() => {
    if (!isValid) return t.invalidExpr
    try {
      return cronstrue.toString(expr, { locale: lang === 'pt' ? 'pt_BR' : 'en' })
    } catch {
      return t.invalidExpr
    }
  })()

  const nextRuns = isValid ? getNextRuns(expr, 5) : []

  const monthOptions = t.months.map((label, i) => ({ value: i + 1, label: `${i + 1} - ${label}` }))
  const dowOptions = t.weekdays.map((label, i) => ({ value: i, label: `${i} - ${label}` }))

  const fieldConfigs: FieldConfig[] = [
    { label: t.fieldMinute, min: 0, max: 59 },
    { label: t.fieldHour, min: 0, max: 23 },
    { label: t.fieldDOM, min: 1, max: 31 },
    { label: t.fieldMonth, min: 1, max: 12, options: monthOptions },
    { label: t.fieldDOW, min: 0, max: 7, options: dowOptions },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            <span className="font-semibold">Cron Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle language"
            >
              <Languages size={14} />
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              href="https://github.com/gmowses/cron-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Expression input + description + next runs */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Left: expression + description */}
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                <div>
                  <h2 className="font-semibold">{t.expression}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.expressionDesc}</p>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={rawInput}
                      onChange={e => handleRawChange(e.target.value)}
                      placeholder={t.expressionPlaceholder}
                      spellCheck={false}
                      className={`w-full rounded-lg border px-4 py-3 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 transition-colors ${
                        isValid || rawInput === ''
                          ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-teal-500'
                          : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 focus:ring-red-400'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!isValid}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                  >
                    {copied ? <Check size={15} className="text-teal-500" /> : <Copy size={15} />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>

                {/* Field labels */}
                <div className="grid grid-cols-5 text-center text-[10px] text-zinc-400 font-mono gap-1">
                  {[t.minute, t.hour, t.dayOfMonth, t.month, t.dayOfWeek].map((label, i) => (
                    <div key={i} className="truncate">{label}</div>
                  ))}
                </div>

                {/* Description */}
                <div className={`rounded-lg border px-4 py-3 text-sm ${
                  isValid
                    ? 'border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                    : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}>
                  <span className="font-medium">{t.description}:</span> {humanReadable}
                </div>
              </div>
            </div>

            {/* Right: next runs */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div>
                <h2 className="font-semibold">{t.nextRuns}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.nextRunsDesc}</p>
              </div>

              <div className="space-y-2">
                {isValid && nextRuns.length > 0 ? (
                  nextRuns.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-mono text-sm tabular-nums">{formatDate(d, lang)}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-4 py-8 text-center text-sm text-zinc-400">
                    {t.invalidExpr}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div>
              <h2 className="font-semibold">{t.presets}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.presetsDesc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.expr}
                  onClick={() => applyPreset(preset.expr)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    expr === preset.expr
                      ? 'border-teal-400 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-teal-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="font-mono text-xs text-zinc-400">{preset.expr}</span>
                  <span>{lang === 'pt' ? preset.labelPt : preset.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visual builder */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div>
              <h2 className="font-semibold">{t.visual}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.visualDesc}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {fieldConfigs.map((cfg, i) => (
                <FieldEditor
                  key={i}
                  config={cfg}
                  state={fields[i]}
                  t={t}
                  onChange={newField => {
                    const next = [...fields] as [FieldState, FieldState, FieldState, FieldState, FieldState]
                    next[i] = newField
                    updateFromFields(next)
                  }}
                />
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>
            {t.builtBy}{' '}
            <a
              href="https://github.com/gmowses"
              className="text-zinc-600 dark:text-zinc-300 hover:text-teal-500 transition-colors"
            >
              Gabriel Mowses
            </a>
          </span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
