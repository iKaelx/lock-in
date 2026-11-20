import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  BarChart3, BookOpen, CalendarDays, LayoutDashboard,
  LogOut, Moon, Plus, Settings, Timer, ListTodo, GraduationCap, Menu, X,
  ArrowLeft, Sun, CheckCircle2, Clock3, Sparkles, AlertCircle, LoaderCircle,
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { generateWeeklyPlan } from './lib/scheduling'
import { AdSlot } from './components/ads/AdSlot'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

type Profile = { id: string; full_name: string | null }

function SetupScreen() {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-6">
      <section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-6 grid size-12 place-items-center rounded-xl bg-violet-600 text-white"><BookOpen /></div>
        <h1 className="text-2xl font-bold text-slate-900">Connect your Supabase project</h1>
        <p className="mt-3 leading-7 text-slate-600">Lock-in is ready to run. Add your hosted project URL and publishable key to enable authentication and database persistence.</p>
        <ol className="mt-6 space-y-3 text-sm text-slate-700">
          <li>1. Copy <code>.env.example</code> to <code>.env</code>.</li>
          <li>2. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
          <li>3. Apply <code>supabase/migrations/202611190001_initial_schema.sql</code> in the Supabase SQL editor.</li>
        </ol>
      </section>
    </main>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setMessage('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        })
        if (error) throw error
        setMessage('Check your email to verify your account.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage('Password reset instructions have been sent.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally { setBusy(false) }
  }

  return (
    <main className="auth-layout">
      <section className="auth-showcase">
        <div className="auth-brand"><span className="brand-mark"><BookOpen size={20} /></span>Lock-in</div>
        <div className="auth-hero-copy">
          <div className="auth-kicker"><Sparkles size={14} /> Your week, organized</div>
          <h1>Turn every study hour into progress.</h1>
          <p>Build realistic plans, stay ahead of deadlines, and see the work add up.</p>
          <div className="auth-preview" aria-hidden="true">
            <div className="preview-toolbar"><span /><span /><span /></div>
            <div className="preview-grid">
              {['Morning focus','Calculus','Reading','Revision','Project','Break'].map((item, i) => (
                <div key={item} className={i === 1 || i === 4 ? 'preview-session accent' : 'preview-session'}><small>{8 + i}:00</small><strong>{item}</strong></div>
              ))}
            </div>
          </div>
        </div>
        <p className="auth-footnote">Personal plans. Clear priorities. Better momentum.</p>
      </section>
      <section className="auth-panel">
        <button type="button" className="auth-back" onClick={() => mode === 'login' ? navigate('/') : setMode('login')}><ArrowLeft size={17} />Back</button>
        <form onSubmit={submit} className="auth-form">
          <div className="auth-mobile-brand"><span className="brand-mark"><BookOpen size={18} /></span>Lock-in</div>
          <h2>{mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to continue to your study plan.' : 'Use your email and a secure password.'}</p>
          <label>Email address</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} />
          {mode !== 'forgot' && <>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          </>}
          {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="mt-3 text-sm font-medium text-violet-600">Forgot password?</button>}
          {message && <p className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-700" role="status">{message}</p>}
          <button disabled={busy} className="mt-6 h-11 w-full rounded-lg bg-violet-600 font-semibold text-white shadow-lg shadow-violet-200 disabled:opacity-60">{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}</button>
          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'login' ? 'New to Lock-in?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="font-semibold text-violet-600">{mode === 'login' ? 'Create account' : 'Sign in'}</button>
          </p>
          {children}
        </form>
      </section>
    </main>
  )
}

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    supabase!.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setMessage(error.message)
      else if (data.session) setReady(true)
      else setMessage('This password reset link is invalid or has expired. Request a new one.')
    })
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) setReady(true)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (password !== confirmPassword) { setMessage('The passwords do not match.'); return }
    setBusy(true); setMessage('')
    try {
      const { error } = await supabase!.auth.updateUser({ password })
      if (error) throw error
      navigate('/dashboard', { replace: true })
    } catch (cause) { setMessage(getErrorMessage(cause)) }
    finally { setBusy(false) }
  }

  return <main className="auth-layout">
    <section className="auth-panel reset-password-panel">
      <NavLink to="/login" className="auth-back"><ArrowLeft size={17}/>Back to sign in</NavLink>
      <form onSubmit={submit} className="auth-form">
        <div className="auth-mobile-brand"><span className="brand-mark"><BookOpen size={18}/></span>Lock-in</div>
        <h2>Choose a new password</h2>
        <p className="auth-subtitle">Create a new password for your Lock-in account.</p>
        {ready && <>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" required minLength={6} type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)}/>
          <label htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" required minLength={6} type="password" autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)}/>
          <button disabled={busy} className="mt-4 h-11 w-full rounded-lg bg-violet-600 font-semibold text-white disabled:opacity-60">{busy?'Saving…':'Update password'}</button>
        </>}
        {message&&<p className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-700" role="status">{message}</p>}
      </form>
    </section>
  </main>
}

const nav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/exams', label: 'Exams', icon: GraduationCap },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/timer', label: 'Study Timer', icon: Timer },
]

function AppShell({ profile, children }: { profile: Profile | null; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('studyflow-theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('studyflow-theme', dark ? 'dark' : 'light')
  }, [dark])
  async function logout() {
    await supabase?.auth.signOut()
    navigate('/login')
  }
  return (
    <div className="app-shell">
      {mobileOpen && <button className="nav-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <NavLink to="/dashboard" className="sidebar-brand"><span className="brand-mark"><BookOpen size={18} /></span><span>Lock-in</span></NavLink>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {nav.map(item => <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><item.icon size={18} /><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/settings" className="sidebar-link"><Settings size={18} /><span>Settings</span></NavLink>
          <button onClick={logout} className="sidebar-link logout-link"><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <button className="icon-button back-button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={18} /></button>
            <span className="topbar-date">{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>
          <div className="topbar-actions">
            <button aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={() => setDark(value => !value)} className="theme-toggle">{dark ? <Sun size={17} /> : <Moon size={17} />}<span>{dark ? 'Light' : 'Dark'}</span></button>
            <div className="profile-avatar">{profile?.full_name?.[0]?.toUpperCase() || 'S'}<span className="presence-dot" /></div>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav.slice(0, 5).map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}><item.icon size={19} /><span>{item.label}</span></NavLink>)}
        </nav>
      </div>
    </div>
  )
}

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="surface-card"><div className="card-heading"><h2>{title}</h2>{action}</div>{children}</section>
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center"><div><BookOpen className="mx-auto mb-2 text-slate-300" /><p className="font-medium text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p>{action}</div></div>
}

function FormDialog({ title, description, icon: Icon, onClose, children }: {
  title: string
  description: string
  icon: typeof BookOpen
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="form-dialog-header">
        <div className="form-dialog-title">
          <span className="dialog-icon"><Icon size={20} /></span>
          <div><h2 id="dialog-title">{title}</h2><p>{description}</p></div>
        </div>
        <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
      </header>
      {children}
    </section>
  </div>
}

function FormNotice({ message }: { message: string }) {
  if (!message) return null
  return <div className="form-error" role="alert"><AlertCircle size={17} /><span>{message}</span></div>
}

function FormActions({ busy, onCancel, label }: { busy: boolean; onCancel: () => void; label: string }) {
  return <footer className="form-actions">
    <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>Cancel</button>
    <button type="submit" className="primary-button" disabled={busy}>{busy && <LoaderCircle className="spin" size={16} />}{busy ? 'Saving…' : label}</button>
  </footer>
}

function Field({ label, hint, className = '', children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return <label className={`form-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

async function getSignedInUser() {
  const { data, error } = await supabase!.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Your session has expired. Sign in again to continue.')
  return data.user
}

function Dashboard() {
  const [data, setData] = useState<{ subjects: number; tasks: unknown[]; sessions: unknown[]; hours: number }>({ subjects: 0, tasks: [], sessions: [], hours: 0 })
  const [loading, setLoading] = useState(true)
  const [error,setError]=useState('')
  useEffect(() => {
    if (!supabase) return
    const now=new Date()
    Promise.all([
      supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('archived', false),
      supabase.from('tasks').select('*').neq('status', 'Completed').order('deadline', { ascending: true }),
      supabase.from('study_sessions').select('actual_minutes').eq('status','Completed').gte('start_time',startOfWeek(now,{weekStartsOn:1}).toISOString()).lte('start_time',now.toISOString()),
    ]).then(([subjects,tasks,sessions])=>{
      const failed=[subjects.error,tasks.error,sessions.error].find(Boolean)
      if(failed)throw failed
      setData({
        subjects: subjects.count ?? 0,
        tasks: tasks.data ?? [],
        sessions: sessions.data ?? [],
        hours: ((sessions.data ?? []) as { actual_minutes?: number }[]).reduce((sum, item) => sum + (item.actual_minutes ?? 0), 0) / 60,
      })
    }).catch(cause=>setError(getErrorMessage(cause))).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="grid gap-5 md:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div>
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Your learning overview</p>
          <h1>Good morning</h1>
        </div>
        <NavLink to="/timer" className="primary-button"><Timer size={17} />Start focus session</NavLink>
      </div>
      {error&&<FormNotice message={error}/>}
      <div className="dashboard-stats">
        <article className="stat-card stat-violet">
          <div className="stat-icon"><BookOpen size={19} /></div>
          <div><p>Subjects tracked</p><strong>{data.subjects}</strong><span>Active subjects</span></div>
        </article>
        <article className="stat-card stat-mint">
          <div className="stat-icon"><Clock3 size={19} /></div>
          <div><p>Study hours this week</p><strong>{data.hours.toFixed(1)}h</strong><span>Based on completed sessions</span></div>
        </article>
        <article className="stat-card stat-orange">
          <div className="stat-icon"><ListTodo size={19} /></div>
          <div><p>Open tasks</p><strong>{data.tasks.length}</strong><span>Not yet completed</span></div>
        </article>
      </div>
      <div className="dashboard-grid">
        <Card title="Upcoming work" action={<NavLink to="/tasks" className="card-link">View all <ArrowLeft className="card-link-arrow" size={14} /></NavLink>}>
          {data.tasks.length ? <div className="space-y-3">{data.tasks.slice(0, 5).map((task: any) => <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="font-medium text-slate-800">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.deadline ? format(new Date(task.deadline), 'MMM d, h:mm a') : 'No deadline'}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{task.priority}</span></div>)}</div> : <EmptyState title="No upcoming tasks" text="Create a task to build your workload." />}
        </Card>
        <Card title="Quick actions">
          <div className="quick-actions">
            {[
              { label: 'Add subject', path: '/subjects?add=1', icon: BookOpen },
              { label: 'Add task', path: '/tasks?add=1', icon: CheckCircle2 },
              { label: 'Add exam', path: '/exams?add=1', icon: GraduationCap },
              { label: 'Generate plan', path: '/planner', icon: Sparkles },
            ].map(({ label, path, icon: Icon }) => <NavLink key={label} to={path} className="quick-action"><span><Icon size={17} /></span>{label}<ArrowLeft className="quick-arrow" size={14} /></NavLink>)}
          </div>
        </Card>
      </div>
      <AdSlot />
    </>
  )
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', description: '', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 180, understanding_level: 50, color: '#6C5CE7' })
  async function load() {
    const { data, error } = await supabase!.from('subjects').select('*').order('created_at')
    if (error) throw error
    setSubjects(data ?? [])
  }
  useEffect(() => { load().catch(cause => setError(getErrorMessage(cause))) }, [])
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])
  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Enter a subject name.'); return }
    setBusy(true); setError('')
    try {
      const user = await getSignedInUser()
      const { error } = await supabase!.from('subjects').insert({ ...form, name: form.name.trim(), user_id: user.id })
      if (error) throw error
      await load()
      setOpen(false)
      setNotice('Subject added successfully.')
      setForm({ name: '', description: '', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 180, understanding_level: 50, color: '#6C5CE7' })
    } catch (cause) { setError(getErrorMessage(cause)) }
    finally { setBusy(false) }
  }
  async function remove(id: string) {
    if (!confirm('Delete this subject? Related exams will also be deleted.')) return
    setError(''); setNotice('')
    try {
      const { error } = await supabase!.from('subjects').delete().eq('id', id)
      if (error) throw error
      await load()
      setNotice('Subject deleted.')
    } catch (cause) { setError(getErrorMessage(cause)) }
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">Manage your workload</p><h1>Subjects</h1></div><button onClick={() => {setError('');setOpen(true)}} className="primary-button"><Plus size={17}/>Add subject</button></div>
    {notice && <p className="inline-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></p>}
    {error && !open && <FormNotice message={error} />}
    {open && <FormDialog title="Add a subject" description="Give each course its own goals and study color." icon={BookOpen} onClose={() => !busy && setOpen(false)}>
      <form className="dialog-form" onSubmit={save}>
        <FormNotice message={error} />
        <div className="form-grid">
          <Field label="Subject name" hint="For example, Biology or World History" className="form-span-2"><input autoFocus required maxLength={80} placeholder="e.g. Mathematics" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></Field>
          <Field label="Description" className="form-span-2"><textarea rows={3} maxLength={500} placeholder="What are you studying in this subject?" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></Field>
          <Field label="Difficulty"><select value={form.difficulty} onChange={e => setForm({...form,difficulty:e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select></Field>
          <Field label="Priority"><select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Weekly target" hint="Minutes per week"><input type="number" min="0" max="10080" step="15" value={form.weekly_target_minutes} onChange={e => setForm({...form,weekly_target_minutes:Number(e.target.value)})}/></Field>
          <Field label="Understanding" hint="Your current confidence, 0–100%"><input type="number" min="0" max="100" value={form.understanding_level} onChange={e => setForm({...form,understanding_level:Number(e.target.value)})}/></Field>
          <Field label="Subject color" className="form-span-2"><span className="color-control"><input aria-label="Choose subject color" type="color" value={form.color} onChange={e => setForm({...form,color:e.target.value})}/><span>Used to identify this subject across your plan</span></span></Field>
        </div>
        <FormActions busy={busy} onCancel={() => setOpen(false)} label="Create subject"/>
      </form>
    </FormDialog>}
    {subjects.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{subjects.map(subject => <Card key={subject.id} title={subject.name} action={<button onClick={() => remove(subject.id)} className="text-xs text-slate-400 hover:text-red-600">Delete</button>}><div className="mb-4 h-1.5 rounded-full" style={{background:subject.color}}/><p className="min-h-10 text-sm text-slate-500">{subject.description || 'No description'}</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><span className="text-slate-500">Difficulty<br/><strong className="text-slate-800">{subject.difficulty}</strong></span><span className="text-slate-500">Weekly target<br/><strong className="text-slate-800">{subject.weekly_target_minutes} min</strong></span></div></Card>)}</div> : <EmptyState title="No subjects yet" text="Add your first subject to begin planning." />}
  </>
}

function TasksPage() {
  const [tasks,setTasks]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [searchParams,setSearchParams]=useSearchParams()
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [form,setForm]=useState({title:'',description:'',subject_id:'',deadline:'',estimated_minutes:60,priority:'Medium',status:'Pending'})
  async function load(){
    const [tasksResult,subjectsResult]=await Promise.all([supabase!.from('tasks').select('*').order('deadline',{ascending:true}),supabase!.from('subjects').select('id,name')])
    if(tasksResult.error)throw tasksResult.error
    if(subjectsResult.error)throw subjectsResult.error
    setTasks(tasksResult.data??[]);setSubjects(subjectsResult.data??[])
  }
  useEffect(()=>{load().catch(cause=>setError(getErrorMessage(cause)))},[])
  useEffect(()=>{if(searchParams.get('add')==='1'){setOpen(true);setSearchParams({}, {replace:true})}},[searchParams,setSearchParams])
  async function save(e:React.FormEvent){
    e.preventDefault();if(!form.title.trim()){setError('Enter a task title.');return}setBusy(true);setError('')
    try {
      const user=await getSignedInUser()
      const {error}=await supabase!.from('tasks').insert({...form,title:form.title.trim(),user_id:user.id,subject_id:form.subject_id||null,deadline:form.deadline?new Date(form.deadline).toISOString():null})
      if(error)throw error
      await load();setOpen(false);setNotice('Task added successfully.')
      setForm({title:'',description:'',subject_id:'',deadline:'',estimated_minutes:60,priority:'Medium',status:'Pending'})
    } catch(cause){setError(getErrorMessage(cause))}
    finally{setBusy(false)}
  }
  async function complete(task:any){
    try{const{error}=await supabase!.from('tasks').update({status:task.status==='Completed'?'Pending':'Completed'}).eq('id',task.id);if(error)throw error;await load()}
    catch(cause){setError(getErrorMessage(cause))}
  }
  async function remove(id:string){
    if(!confirm('Delete this task?'))return
    try{const{error}=await supabase!.from('tasks').delete().eq('id',id);if(error)throw error;await load();setNotice('Task deleted.')}
    catch(cause){setError(getErrorMessage(cause))}
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">Assignments and deadlines</p><h1>Tasks</h1></div><button onClick={()=>{setError('');setOpen(true)}} className="primary-button"><Plus size={17}/>Add task</button></div>
    {notice&&<p className="inline-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></p>}
    {error&&!open&&<FormNotice message={error}/>}
    {open&&<FormDialog title="Add a task" description="Capture what needs doing and when it's due." icon={CheckCircle2} onClose={()=>!busy&&setOpen(false)}>
      <form className="dialog-form" onSubmit={save}>
        <FormNotice message={error}/>
        <div className="form-grid">
          <Field label="Task title" className="form-span-2"><input autoFocus required maxLength={120} placeholder="e.g. Finish biology lab report" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field>
          <Field label="Subject"><select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}><option value="">No subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Priority"><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Deadline" hint="Leave empty if there is no due date"><input type="datetime-local" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></Field>
          <Field label="Estimated time" hint="Minutes"><input type="number" min="1" max="10080" step="5" value={form.estimated_minutes} onChange={e=>setForm({...form,estimated_minutes:Number(e.target.value)})}/></Field>
          <Field label="Description" className="form-span-2"><textarea rows={3} maxLength={1000} placeholder="Add instructions or useful details" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field>
        </div>
        <FormActions busy={busy} onCancel={()=>setOpen(false)} label="Create task"/>
      </form>
    </FormDialog>}
    {tasks.length?<Card title="All tasks"><div className="divide-y divide-slate-100">{tasks.map(task=><div key={task.id} className="flex items-center gap-3 py-3"><button onClick={()=>complete(task)} className={`size-5 rounded-full border ${task.status==='Completed'?'border-green-500 bg-green-500':'border-slate-300'}`}/><div className="flex-1"><p className={`font-medium ${task.status==='Completed'?'text-slate-400 line-through':'text-slate-800'}`}>{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.deadline?format(new Date(task.deadline),'MMM d, h:mm a'):'No deadline'} · {task.estimated_minutes} min</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{task.priority}</span><button onClick={()=>remove(task.id)} className="text-xs text-slate-400 hover:text-red-600">Delete</button></div>)}</div></Card>:<EmptyState title="No tasks yet" text="Create a task and attach a deadline."/>}
  </>
}

function ExamsPage(){
  const [exams,setExams]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [searchParams,setSearchParams]=useSearchParams()
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [form,setForm]=useState({title:'',subject_id:'',exam_date:'',importance:'Medium',preparation_status:0,notes:''})
  async function load(){
    const [examsResult,subjectsResult]=await Promise.all([supabase!.from('exams').select('*').order('exam_date'),supabase!.from('subjects').select('id,name')])
    if(examsResult.error)throw examsResult.error
    if(subjectsResult.error)throw subjectsResult.error
    setExams(examsResult.data??[]);setSubjects(subjectsResult.data??[])
  }
  useEffect(()=>{load().catch(cause=>setError(getErrorMessage(cause)))},[])
  useEffect(()=>{if(searchParams.get('add')==='1'){setOpen(true);setSearchParams({}, {replace:true})}},[searchParams,setSearchParams])
  async function save(e:React.FormEvent){
    e.preventDefault();if(!form.title.trim()){setError('Enter an exam title.');return}setBusy(true);setError('')
    try {
      const user=await getSignedInUser()
      const {error}=await supabase!.from('exams').insert({...form,title:form.title.trim(),user_id:user.id,exam_date:new Date(form.exam_date).toISOString(),topics:[]})
      if(error)throw error
      await load();setOpen(false);setNotice('Exam added successfully.')
      setForm({title:'',subject_id:'',exam_date:'',importance:'Medium',preparation_status:0,notes:''})
    } catch(cause){setError(getErrorMessage(cause))}
    finally{setBusy(false)}
  }
  async function remove(id:string){
    if(!confirm('Delete this exam?'))return
    try{const{error}=await supabase!.from('exams').delete().eq('id',id);if(error)throw error;await load();setNotice('Exam deleted.')}
    catch(cause){setError(getErrorMessage(cause))}
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">Countdown and preparation</p><h1>Exams</h1></div><button onClick={()=>{setError('');setOpen(true)}} className="primary-button"><Plus size={17}/>Add exam</button></div>
    {notice&&<p className="inline-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></p>}
    {error&&!open&&<FormNotice message={error}/>}
    {open&&<FormDialog title="Add an exam" description="Add an exam date so Lock-in can prioritize your revision." icon={GraduationCap} onClose={()=>!busy&&setOpen(false)}>
      <form className="dialog-form" onSubmit={save}>
        <FormNotice message={error}/>
        <div className="form-grid">
          <Field label="Exam title" className="form-span-2"><input autoFocus required maxLength={120} placeholder="e.g. Chemistry midterm" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field>
          <Field label="Subject" className="form-span-2"><select required value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}><option value="">Choose a subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>{subjects.length===0&&<small>Add a subject first to link this exam.</small>}</Field>
          <Field label="Date and time"><input required type="datetime-local" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})}/></Field>
          <Field label="Importance"><select value={form.importance} onChange={e=>setForm({...form,importance:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Preparation progress" hint="How prepared do you feel?"><span className="range-field"><input type="range" min="0" max="100" step="5" value={form.preparation_status} onChange={e=>setForm({...form,preparation_status:Number(e.target.value)})}/><strong>{form.preparation_status}%</strong></span></Field>
          <Field label="Notes" className="form-span-2"><textarea rows={3} maxLength={1000} placeholder="Topics, room, or anything else to remember" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Field>
        </div>
        <FormActions busy={busy} onCancel={()=>setOpen(false)} label="Create exam"/>
      </form>
    </FormDialog>}
    {exams.length?<div className="grid gap-5 md:grid-cols-2">{exams.map(exam=>{const days=Math.ceil((new Date(exam.exam_date).getTime()-Date.now())/86400000);return<Card key={exam.id} title={exam.title} action={<button onClick={()=>remove(exam.id)} className="text-xs text-slate-400 hover:text-red-600">Delete</button>}><p className="text-sm text-slate-500">{format(new Date(exam.exam_date),'EEEE, MMMM d · h:mm a')}</p><div className="mt-5 flex items-end justify-between"><div><strong className="text-3xl text-slate-900">{Math.max(days,0)}</strong><span className="ml-2 text-sm text-slate-500">days left</span></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{exam.importance}</span></div></Card>})}</div>:<EmptyState title="No exams added" text="Track an exam and receive revision-priority sessions."/>}
  </>
}

function PlannerPage(){
  const [subjects,setSubjects]=useState<any[]>([])
  const [availability,setAvailability]=useState<any[]>([])
  const [tasks,setTasks]=useState<any[]>([])
  const [exams,setExams]=useState<any[]>([])
  const [preferences,setPreferences]=useState({preferred_session_minutes:50,break_minutes:10,max_daily_study_minutes:300})
  const [sessions,setSessions]=useState<any[]>([])
  const [warning,setWarning]=useState('')
  const [loading,setLoading]=useState(true)
  const [accepting,setAccepting]=useState(false)
  useEffect(()=>{let active=true;Promise.all([supabase!.from('subjects').select('*').eq('archived',false),supabase!.from('availability').select('*'),supabase!.from('tasks').select('subject_id,deadline,estimated_minutes,priority,status'),supabase!.from('exams').select('subject_id,exam_date,importance,preparation_status'),supabase!.from('user_preferences').select('preferred_session_minutes,break_minutes,max_daily_study_minutes').maybeSingle()]).then(([a,b,c,d,e])=>{const failed=[a.error,b.error,c.error,d.error,e.error].find(Boolean);if(failed)throw failed;if(active){setSubjects(a.data??[]);setAvailability(b.data??[]);setTasks(c.data??[]);setExams(d.data??[]);if(e.data)setPreferences(e.data)}}).catch(cause=>{if(active)setWarning(getErrorMessage(cause))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])
  function generate(){
    setWarning('')
    if(!availability.some(slot=>slot.is_available)){setWarning('Add your study availability in Settings before generating a plan.');return}
    const start=startOfWeek(new Date(),{weekStartsOn:1})
    const result=generateWeeklyPlan(subjects,availability,tasks,exams,start,preferences.preferred_session_minutes,preferences.break_minutes,preferences.max_daily_study_minutes)
    setSessions(result.sessions);setWarning(result.warning??'')
  }
  async function accept(){
    if(!sessions.length||accepting)return
    setAccepting(true);setWarning('')
    let planId:string|undefined
    let userId:string
    const start=format(startOfWeek(new Date(),{weekStartsOn:1}),'yyyy-MM-dd')
    try{
      userId=(await getSignedInUser()).id
      const {data:accepted,error:lookupError}=await supabase!.from('study_plans').select('id').eq('status','Accepted').eq('week_start',start).limit(1).maybeSingle()
      if(lookupError)throw lookupError
      if(accepted){setWarning('An accepted plan already exists for this week. It was left unchanged.');return}
      const {data:plan,error:planError}=await supabase!.from('study_plans').insert({title:`Week of ${start}`,week_start:start,status:'Draft',user_id:userId}).select('id').single()
      if(planError)throw planError
      planId=plan.id
      const rows=sessions.map(s=>({...s,user_id:userId,plan_id:plan.id,status:'Scheduled'}))
      const {error:sessionsError}=await supabase!.from('study_sessions').insert(rows)
      if(sessionsError)throw sessionsError
      const {error:acceptError}=await supabase!.from('study_plans').update({status:'Accepted'}).eq('id',plan.id).select('id').single()
      if(acceptError)throw acceptError
      setWarning('Plan accepted and added to your calendar.')
    }catch(cause){
      if(planId){
        const {error:removeSessionsError}=await supabase!.from('study_sessions').delete().eq('plan_id',planId)
        const {error:removePlanError}=await supabase!.from('study_plans').delete().eq('id',planId)
        if(removeSessionsError||removePlanError){setWarning(`${getErrorMessage(cause)} Cleanup also failed; check the saved plan before retrying.`);return}
      }
      setWarning(getErrorMessage(cause))
    }finally{setAccepting(false)}
  }
  return <>
    <div className="mb-6 flex items-end justify-between"><div><p className="text-sm text-slate-500">Deterministic weekly scheduling</p><h1 className="text-2xl font-bold">Study planner</h1></div><button onClick={generate} className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white">Generate plan</button></div>
    {warning&&<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{warning}{warning.includes('study availability')&&<NavLink to="/settings" className="ml-2 font-semibold underline">Open Settings</NavLink>}</div>}
    {loading?<div className="h-48 animate-pulse rounded-2xl bg-slate-200"/>:sessions.length?<><div className="mb-4 flex items-center justify-between"><p className="text-sm text-slate-500">{sessions.length} sessions generated</p><button onClick={accept} disabled={accepting} className="h-10 rounded-lg border border-violet-600 px-4 text-sm font-semibold text-violet-600 disabled:opacity-60">{accepting?'Saving…':'Accept plan'}</button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sessions.map((session,i)=>{const subject=subjects.find(s=>s.id===session.subject_id);const start=new Date(session.start_time);return<div key={i} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 h-1 rounded-full" style={{background:subject?.color||'#6C5CE7'}}/><p className="font-semibold text-slate-800">{session.title}</p><p className="mt-2 text-sm text-slate-500">{format(start,'EEE, h:mm a')} · {Math.round((new Date(session.end_time).getTime()-start.getTime())/60000)} min</p><span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{session.session_type}</span></div>})}</div></>:<EmptyState title="No generated plan" text="Lock-in will prioritize deadlines, exams and subject targets."/>}
  </>
}

function CalendarPage(){
  const [sessions,setSessions]=useState<any[]>([])
  const [week,setWeek]=useState(startOfWeek(new Date(),{weekStartsOn:1}))
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const load=useCallback(async()=>{
    setLoading(true);setError('')
    try{
      const end=addDays(week,7)
      const {data,error}=await supabase!.from('study_sessions').select('*').gte('start_time',week.toISOString()).lt('start_time',end.toISOString()).order('start_time')
      if(error)throw error
      setSessions(data??[])
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setLoading(false)}
  },[week])
  useEffect(()=>{void load()},[load])
  async function completeSession(session:any){
    try{
      const actual_minutes=session.actual_minutes??Math.round((new Date(session.end_time).getTime()-new Date(session.start_time).getTime())/60000)
      const {error}=await supabase!.from('study_sessions').update({status:'Completed',actual_minutes}).eq('id',session.id)
      if(error)throw error
      await load()
    }catch(cause){setError(getErrorMessage(cause))}
  }
  const days=Array.from({length:7},(_,i)=>addDays(week,i))
  return<>
    <div className="page-heading calendar-heading">
      <div><p className="eyebrow">Your study schedule</p><h1>Calendar</h1></div>
      <div className="calendar-actions">
        <NavLink to="/planner" className="primary-button"><Sparkles size={16}/>Generate plan</NavLink>
        <div className="calendar-week-controls">
          <button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button>
          <button onClick={()=>setWeek(startOfWeek(new Date(),{weekStartsOn:1}))}>Today</button>
          <button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button>
        </div>
      </div>
    </div>
    {error&&<FormNotice message={error}/>}
    {loading?<div className="h-64 animate-pulse rounded-2xl bg-slate-200"/>:sessions.length===0?<EmptyState title="No study sessions this week" text="Generate a plan or create sessions to see them here." action={<NavLink to="/planner" className="mt-3 inline-flex text-sm font-semibold text-violet-600">Generate a plan</NavLink>}/>:<div className="calendar-scroller"><div className="calendar-grid">
      {days.map(day=>{const items=sessions.filter(s=>isSameDay(new Date(s.start_time),day));return <div key={day.toISOString()} className="calendar-day"><div className={`calendar-day-heading ${isSameDay(day,new Date())?'today':''}`}><p>{format(day,'EEE')}</p><strong>{format(day,'d')}</strong></div><div className="calendar-day-items">{items.map((s:any)=><article key={s.id} className={`calendar-session ${s.status==='Completed'?'completed':''}`}><div className="calendar-session-time">{format(new Date(s.start_time),'h:mm a')}</div><p>{s.title}</p><span>{s.status}</span>{s.status!=='Completed'&&<button onClick={()=>completeSession(s)}>Mark done</button>}</article>)}</div></div>})}
    </div></div>}
  </>
}

function TimerPage(){
  const[duration,setDuration]=useState(25*60)
  const[remaining,setRemaining]=useState(25*60)
  const[running,setRunning]=useState(false)
  const[endsAt,setEndsAt]=useState<number|null>(null)
  const[stopped,setStopped]=useState(false)
  const[rating,setRating]=useState(0)
  const[customMinutes,setCustomMinutes]=useState('25')
  const[saving,setSaving]=useState(false)
  const[error,setError]=useState('')
  const[saved,setSaved]=useState(false)
  useEffect(()=>{
    if(!running||endsAt===null)return
    const update=()=>setRemaining(Math.max(0,Math.ceil((endsAt-Date.now())/1000)))
    update()
    const id=window.setInterval(update,250)
    return()=>clearInterval(id)
  },[running,endsAt])
  useEffect(()=>{if(remaining===0)setRunning(false)},[remaining])
  function preset(minutes:number){
    if(running)return
    setDuration(minutes*60);setRemaining(minutes*60);setEndsAt(null);setStopped(false);setRating(0);setError('');setSaved(false)
  }
  function startOrPause(){
    setError('');setSaved(false)
    if(running){
      setRemaining(endsAt===null?remaining:Math.max(0,Math.ceil((endsAt-Date.now())/1000)))
      setEndsAt(null);setRunning(false)
    }else{
      setStopped(false);setEndsAt(Date.now()+remaining*1000);setRunning(true)
    }
  }
  function stop(){
    if(running)setRemaining(endsAt===null?remaining:Math.max(0,Math.ceil((endsAt-Date.now())/1000)))
    setEndsAt(null);setRunning(false);setStopped(true)
  }
  function reset(){
    setRunning(false);setEndsAt(null);setRemaining(duration);setStopped(false);setRating(0);setError('');setSaved(false)
  }
  async function saveSession(){
    const elapsedSeconds=duration-remaining
    if(elapsedSeconds<=0||saving)return
    setSaving(true);setError('')
    try{
      const user=await getSignedInUser()
      const now=new Date()
      const {error}=await supabase!.from('study_sessions').insert({
        user_id:user.id,title:'Focused study session',
        start_time:new Date(now.getTime()-elapsedSeconds*1000).toISOString(),
        end_time:now.toISOString(),session_type:'Study',status:'Completed',
        actual_minutes:Math.ceil(elapsedSeconds/60),focus_rating:rating||null,
      })
      if(error)throw error
      reset();setSaved(true)
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setSaving(false)}
  }
  const minutes=Math.floor(remaining/60);const seconds=remaining%60
  const hasElapsed=remaining<duration
  return<>
    <div className="mb-6"><p className="text-sm text-slate-500">Stay focused</p><h1 className="text-2xl font-bold">Study timer</h1></div>
    <Card title="Focus session"><div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-6 grid size-64 max-w-full place-items-center rounded-full border-[12px] border-violet-100 bg-white text-5xl font-bold text-slate-900">{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</div>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        <button disabled={running} onClick={()=>preset(25)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">25 minutes</button>
        <button disabled={running} onClick={()=>preset(50)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">50 minutes</button>
        <form className="flex gap-2" onSubmit={event=>{event.preventDefault();const minutes=Number(customMinutes);if(Number.isInteger(minutes)&&minutes>=1&&minutes<=240)preset(minutes);else setError('Choose a custom duration between 1 and 240 minutes.')}}>
          <input aria-label="Custom duration in minutes" type="number" min="1" max="240" value={customMinutes} onChange={event=>setCustomMinutes(event.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50" disabled={running}/>
          <button type="submit" disabled={running} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">Set</button>
        </form>
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={startOrPause} disabled={!running&&remaining===0} className="h-11 rounded-lg bg-violet-600 px-6 font-semibold text-white disabled:opacity-50">{running?'Pause':hasElapsed&&!stopped?'Resume':'Start'}</button>
        <button onClick={stop} disabled={!hasElapsed||stopped} className="h-11 rounded-lg border border-slate-200 px-5 disabled:opacity-50">Stop & save</button>
        <button onClick={reset} className="h-11 rounded-lg border border-slate-200 px-5">Reset</button>
      </div>
      {(remaining===0||stopped)&&hasElapsed&&<div className="mt-6">
        <p className="mb-3 text-sm text-slate-600">How focused did you feel?</p>
        <div className="mb-4 flex justify-center gap-2">{[1,2,3,4,5].map(n=><button key={n} aria-label={`Focus rating ${n} of 5`} aria-pressed={rating===n} onClick={()=>setRating(n)} className={`size-9 rounded-full ${rating===n?'bg-violet-600 text-white':'bg-slate-100'}`}>{n}</button>)}</div>
        <button disabled={saving} onClick={saveSession} className="text-sm font-semibold text-violet-600 disabled:opacity-50">{saving?'Saving…':'Save session history'}</button>
      </div>}
      {error&&<div className="mt-4"><FormNotice message={error}/></div>}
      {saved&&<p className="mt-4 text-sm text-green-600" role="status">Study session saved.</p>}
    </div></Card>
  </>
}

function AnalyticsPage(){
  const [sessions,setSessions]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{
    let active=true
    async function load(){
      try{
        const {data,error}=await supabase!.from('study_sessions').select('*').eq('status','Completed').order('start_time')
        if(error)throw error
        if(active)setSessions(data??[])
      }catch(cause){if(active)setError(getErrorMessage(cause))}
      finally{if(active)setLoading(false)}
    }
    void load()
    return()=>{active=false}
  },[])
  const hours=sessions.reduce((sum,s)=>sum+(s.actual_minutes??0),0)/60
  const rated=sessions.filter(session=>session.focus_rating)
  const chart=Array.from({length:7},(_,i)=>{const day=addDays(startOfWeek(new Date(),{weekStartsOn:1}),i);const minutes=sessions.filter(s=>format(new Date(s.start_time),'yyyy-MM-dd')===format(day,'yyyy-MM-dd')).reduce((sum,s)=>sum+(s.actual_minutes??0),0);return{name:format(day,'EEE'),minutes}})
  return<>
    <div className="mb-6"><p className="text-sm text-slate-500">Actual learning activity</p><h1 className="text-2xl font-bold">Analytics</h1></div>
    {error&&<FormNotice message={error}/>}
    {loading?<div className="h-80 animate-pulse rounded-2xl bg-slate-200"/>:<><div className="mb-5 grid gap-5 md:grid-cols-3"><Card title="Total study hours"><p className="text-3xl font-bold">{hours.toFixed(1)}h</p></Card><Card title="Completed sessions"><p className="text-3xl font-bold">{sessions.length}</p></Card><Card title="Average focus"><p className="text-3xl font-bold">{rated.length?(rated.reduce((sum,session)=>sum+session.focus_rating,0)/rated.length).toFixed(1):'—'}</p></Card></div>
    <Card title="Weekly activity"><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="minutes" fill="#6C5CE7" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></Card></>}
  </>
}

function SettingsPage(){
  const [profile,setProfile]=useState({full_name:'',education_level:'',study_field:'',institution:'',timezone:'UTC'})
  const [preferences,setPreferences]=useState({preferred_session_minutes:50,break_minutes:10,max_daily_study_minutes:300})
  const [availability,setAvailability]=useState<Array<{id:string;day_of_week:number;start_time:string;end_time:string}>>([])
  const [originalAvailability,setOriginalAvailability]=useState<Array<{id:string;day_of_week:number;start_time:string;end_time:string}>>([])
  const [saved,setSaved]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{
    let active=true
    async function load(){
      try{
        const user=await getSignedInUser()
        const [profileResult,preferencesResult,availabilityResult]=await Promise.all([
          supabase!.from('profiles').select('*').eq('id',user.id).maybeSingle(),
          supabase!.from('user_preferences').select('*').eq('user_id',user.id).maybeSingle(),
          supabase!.from('availability').select('*').eq('user_id',user.id).order('day_of_week').order('start_time'),
        ])
        const failed=[profileResult.error,preferencesResult.error,availabilityResult.error].find(Boolean)
        if(failed)throw failed
        if(!active)return
        if(profileResult.data)setProfile({full_name:profileResult.data.full_name??'',education_level:profileResult.data.education_level??'',study_field:profileResult.data.study_field??'',institution:profileResult.data.institution??'',timezone:profileResult.data.timezone??'UTC'})
        if(preferencesResult.data)setPreferences({preferred_session_minutes:preferencesResult.data.preferred_session_minutes,break_minutes:preferencesResult.data.break_minutes,max_daily_study_minutes:preferencesResult.data.max_daily_study_minutes})
        const rows=(availabilityResult.data??[]).map(row=>({...row,start_time:String(row.start_time).slice(0,5),end_time:String(row.end_time).slice(0,5)}))
        setAvailability(rows);setOriginalAvailability(rows)
      }catch(cause){if(active)setError(getErrorMessage(cause))}
    }
    void load()
    return()=>{active=false}
  },[])
  function addAvailability(){
    setAvailability(rows=>[...rows,{id:`draft-${crypto.randomUUID()}`,day_of_week:1,start_time:'09:00',end_time:'10:00'}])
    setSaved(false)
  }
  async function save(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');setSaved(false)
    if(availability.some(row=>!row.start_time||!row.end_time||row.start_time>=row.end_time)){setError('Each availability window needs a start time and a later end time.');setBusy(false);return}
    const duplicates=availability.some((row,index)=>availability.some((other,otherIndex)=>otherIndex>index&&row.day_of_week===other.day_of_week&&row.start_time===other.start_time&&row.end_time===other.end_time))
    if(duplicates){setError('Remove duplicate availability windows before saving.');setBusy(false);return}
    try{
      const user=await getSignedInUser()
      const {error:profileError}=await supabase!.from('profiles').update(profile).eq('id',user.id)
      if(profileError)throw profileError
      const {error:preferencesError}=await supabase!.from('user_preferences').upsert({...preferences,user_id:user.id},{onConflict:'user_id'})
      if(preferencesError)throw preferencesError
      const removed=originalAvailability.filter(row=>!availability.some(current=>current.id===row.id))
      if(removed.length){
        const {error:removeError}=await supabase!.from('availability').delete().eq('user_id',user.id).in('id',removed.map(row=>row.id))
        if(removeError)throw removeError
      }
      const changed=availability.filter(row=>{
        if(row.id.startsWith('draft-'))return false
        const original=originalAvailability.find(item=>item.id===row.id)
        return original&&(original.day_of_week!==row.day_of_week||original.start_time!==row.start_time||original.end_time!==row.end_time)
      })
      const updates=await Promise.all(changed.map(row=>supabase!.from('availability').update({day_of_week:row.day_of_week,start_time:row.start_time,end_time:row.end_time}).eq('id',row.id).eq('user_id',user.id)))
      const failedUpdate=updates.find(result=>result.error)?.error
      if(failedUpdate)throw failedUpdate
      const added=availability.filter(row=>row.id.startsWith('draft-'))
      if(added.length){
        const {error:addError}=await supabase!.from('availability').insert(added.map(({day_of_week,start_time,end_time})=>({user_id:user.id,day_of_week,start_time,end_time,is_available:true})))
        if(addError)throw addError
      }
      const {data:rows,error:reloadError}=await supabase!.from('availability').select('*').eq('user_id',user.id).order('day_of_week').order('start_time')
      if(reloadError)throw reloadError
      const savedRows=(rows??[]).map(row=>({...row,start_time:String(row.start_time).slice(0,5),end_time:String(row.end_time).slice(0,5)}))
      setAvailability(savedRows);setOriginalAvailability(savedRows);setSaved(true)
    }catch(cause){setError(`${getErrorMessage(cause)} Some settings may already have saved; review them before retrying.`)}
    finally{setBusy(false)}
  }
  return<>
    <div className="mb-6"><p className="text-sm text-slate-500">Personalize your experience</p><h1 className="text-2xl font-bold">Settings</h1></div>
    <form onSubmit={save} className="max-w-3xl space-y-5">
      {error&&<FormNotice message={error}/>}
      <Card title="Profile"><div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name"><input value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></Field>
        <Field label="Education level"><input value={profile.education_level} onChange={e=>setProfile({...profile,education_level:e.target.value})}/></Field>
        <Field label="Study field"><input value={profile.study_field} onChange={e=>setProfile({...profile,study_field:e.target.value})}/></Field>
        <Field label="Institution"><input value={profile.institution} onChange={e=>setProfile({...profile,institution:e.target.value})}/></Field>
        <Field label="Time zone"><input value={profile.timezone} onChange={e=>setProfile({...profile,timezone:e.target.value})}/></Field>
      </div></Card>
      <Card title="Study preferences"><div className="grid gap-4 md:grid-cols-3">
        <Field label="Session length" hint="Minutes"><input type="number" min="15" max="240" value={preferences.preferred_session_minutes} onChange={e=>setPreferences({...preferences,preferred_session_minutes:Number(e.target.value)})}/></Field>
        <Field label="Break between sessions" hint="Minutes"><input type="number" min="0" max="60" value={preferences.break_minutes} onChange={e=>setPreferences({...preferences,break_minutes:Number(e.target.value)})}/></Field>
        <Field label="Daily study limit" hint="Minutes"><input type="number" min="30" max="720" value={preferences.max_daily_study_minutes} onChange={e=>setPreferences({...preferences,max_daily_study_minutes:Number(e.target.value)})}/></Field>
      </div></Card>
      <Card title="Weekly availability" action={<button type="button" onClick={addAvailability} className="text-sm font-semibold text-violet-600">Add time</button>}>
        <p className="mb-4 text-sm text-slate-500">Only these windows will be used when generating a weekly plan.</p>
        {availability.length===0?<p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No study times yet. Add at least one window to generate a plan.</p>:<div className="space-y-3">
          {availability.map(row=><div key={row.id} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="Day"><select value={row.day_of_week} onChange={e=>{setAvailability(rows=>rows.map(item=>item.id===row.id?{...item,day_of_week:Number(e.target.value)}:item));setSaved(false)}}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day,index)=><option key={day} value={index}>{day}</option>)}</select></Field>
            <Field label="From"><input type="time" value={row.start_time} onChange={e=>{setAvailability(rows=>rows.map(item=>item.id===row.id?{...item,start_time:e.target.value}:item));setSaved(false)}}/></Field>
            <Field label="To"><input type="time" value={row.end_time} onChange={e=>{setAvailability(rows=>rows.map(item=>item.id===row.id?{...item,end_time:e.target.value}:item));setSaved(false)}}/></Field>
            <button type="button" aria-label="Remove availability window" onClick={()=>{setAvailability(rows=>rows.filter(item=>item.id!==row.id));setSaved(false)}} className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 hover:text-red-600">Remove</button>
          </div>)}
        </div>}
      </Card>
      {saved&&<p className="text-sm text-green-600" role="status">Settings saved.</p>}
      <button disabled={busy} className="h-11 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{busy?'Saving…':'Save settings'}</button>
    </form>
  </>
}

const publicLinks = [
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' },
]

function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <nav className="public-nav">
    <NavLink to="/" className="public-brand" onClick={() => setMenuOpen(false)}><span className="brand-mark"><BookOpen size={18}/></span>Lock-in</NavLink>
    <button className="public-menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
    <div className={`public-links ${menuOpen ? 'public-links-open' : ''}`}>
      {publicLinks.map(link => <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className={({isActive}) => isActive ? 'active' : ''}>{link.label}</NavLink>)}
      <div className="public-mobile-actions"><NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink><NavLink to="/login" className="primary-button" onClick={() => setMenuOpen(false)}>Get started</NavLink></div>
    </div>
    <div className="public-actions"><NavLink to="/login" className="public-signin">Sign in</NavLink><NavLink to="/login" className="primary-button">Get started</NavLink></div>
  </nav>
}

function PublicFooter() {
  return <footer className="public-footer">
    <NavLink to="/" className="public-brand"><span className="brand-mark"><BookOpen size={17}/></span>Lock-in</NavLink>
    <p>A calmer way to stay on top of your studies.</p>
    <nav aria-label="Footer navigation">{publicLinks.map(link => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav>
  </footer>
}

function PublicLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} | Lock-in`
    const metaDescription = document.querySelector('meta[name="description"]')
    metaDescription?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${title} | Lock-in`)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  }, [title, description])
  return <main className="public-page"><PublicNav />{children}<PublicFooter /></main>
}

function PublicHome() {
  return <PublicLayout title="Smart Study Planner" description="Plan your study week, keep track of deadlines, and lock in on what matters.">
    <section className="public-hero">
      <div className="public-copy"><p className="eyebrow"><Sparkles size={14}/>Study with intention</p><h1>Make a plan. Lock in. Move forward.</h1><p className="public-lead">Bring your subjects, assignments, and exams together. Lock-in builds a weekly study plan around your goals and the time you actually have.</p><div className="public-cta"><NavLink to="/login" className="primary-button large">Start planning free <ArrowLeft className="cta-arrow" size={17}/></NavLink><span><CheckCircle2 size={15}/>Free to use</span></div></div>
      <div className="public-preview">
        <div className="preview-card-header"><div><span>Your study planner</span><strong>This week</strong></div><div className="preview-avatars"><span>ST</span><span>GO</span><span>✓</span></div></div>
        <div className="preview-week">{['Mon','Tue','Wed','Thu','Fri'].map((day,i)=><div key={day} className={i===2?'active-day':''}><span>{day}</span><strong>{16+i}</strong></div>)}</div>
        <div className="preview-schedule"><div className="schedule-time">09:00</div><div className="schedule-session purple"><span><BookOpen size={15}/></span><div><strong>Focused study</strong><small>Calculus · 50 min</small></div><b>Planned</b></div><div className="schedule-time">11:30</div><div className="schedule-session green"><span><GraduationCap size={15}/></span><div><strong>Exam revision</strong><small>Physics · 50 min</small></div></div></div>
      </div>
    </section>
    <section className="public-proof"><span><strong>Plan</strong> around your week</span><span><strong>Track</strong> every deadline</span><span><strong>Focus</strong> on one step at a time</span></section>
    <section className="public-home-features">
      <div className="public-section-heading"><p className="eyebrow">Everything in one place</p><h2>Make study time count.</h2><p>Simple tools to turn big goals into doable next steps.</p></div>
      <div className="public-feature-grid">
        <article className="public-feature-card featured"><span><Sparkles size={19}/></span><h3>Generate a weekly study plan</h3><p>Build a balanced schedule that considers your available time, subject goals, tasks, and upcoming exams.</p><NavLink to="/features">Explore the planner <ArrowLeft size={14}/></NavLink></article>
        <article className="public-feature-card"><span><ListTodo size={19}/></span><h3>Keep tasks in view</h3><p>Collect deadlines and assignments in one organized place.</p></article>
        <article className="public-feature-card"><span><Timer size={19}/></span><h3>Focus in sessions</h3><p>Use a study timer to settle into the work and record completed time.</p></article>
      </div>
    </section>
  </PublicLayout>
}

function FeaturesPage() {
  const features = [
    { icon: Sparkles, title: 'Generate your weekly plan', text: 'Create a schedule using your availability, study targets, subject priorities, task deadlines, and exam dates. Preview it before accepting.' },
    { icon: BookOpen, title: 'Organize your subjects', text: 'Set a color, weekly target, difficulty, and confidence level for each subject so your plan reflects what needs attention.' },
    { icon: ListTodo, title: 'Stay ahead of tasks', text: 'Capture assignments, estimated effort, priorities, and due dates in one clear task list.' },
    { icon: GraduationCap, title: 'Prepare for exams', text: 'Track exam dates and preparation progress. Upcoming exams help shape your generated study schedule.' },
    { icon: CalendarDays, title: 'See the week clearly', text: 'Review your scheduled study sessions in a calendar designed for a quick view of your week.' },
    { icon: Timer, title: 'Build focus time', text: 'Start a focused study timer and record completed sessions and focus ratings.' },
    { icon: BarChart3, title: 'Review your progress', text: 'Use your actual completed study sessions to understand how your study habits change over time.' },
  ]
  return <PublicLayout title="Features" description="Explore Lock-in's weekly study planner, subject tracking, task management, exam preparation, focus timer, and analytics.">
    <section className="public-subpage-hero"><p className="eyebrow"><Sparkles size={14}/>The Lock-in toolkit</p><h1>Everything you need to stay on track.</h1><p>Plan your week, keep commitments visible, and build a study routine that works for you.</p><NavLink to="/login" className="primary-button large">Build my study plan <ArrowLeft className="cta-arrow" size={17}/></NavLink></section>
    <section className="public-feature-grid features-grid">{features.map(({icon:Icon,title,text},index)=><article className={`public-feature-card ${index===0?'featured':''}`} key={title}><span><Icon size={19}/></span><h3>{title}</h3><p>{text}</p></article>)}</section>
  </PublicLayout>
}

function HowItWorksPage() {
  const steps = [
    { number: '01', title: 'Set up your study world', text: 'Add your subjects, tasks, exam dates, and the times you are available to study.' },
    { number: '02', title: 'Generate a realistic plan', text: 'Lock-in uses your schedule and priorities to propose study sessions for the week.' },
    { number: '03', title: 'Study, adjust, repeat', text: 'Accept your plan, use the focus timer, and update sessions as your week changes.' },
  ]
  return <PublicLayout title="How it works" description="Get started with Lock-in in three simple steps: add your workload, generate a study plan, then focus and adjust.">
    <section className="public-subpage-hero"><p className="eyebrow">A simple rhythm</p><h1>From everything on your mind to a plan you can follow.</h1><p>No AI setup or complicated workflow. Just your priorities, your availability, and a plan you can adjust.</p></section>
    <section className="how-steps">{steps.map(step=><article key={step.number}><span>{step.number}</span><div><h2>{step.title}</h2><p>{step.text}</p></div></article>)}</section>
    <section className="public-bottom-cta"><h2>Ready to make this week yours?</h2><NavLink to="/login" className="primary-button large">Get started free <ArrowLeft className="cta-arrow" size={17}/></NavLink></section>
  </PublicLayout>
}

function AboutPage() {
  return <PublicLayout title="About" description="Lock-in helps students make study plans they can realistically follow.">
    <section className="about-hero"><div><p className="eyebrow">About Lock-in</p><h1>Make space for the work that matters.</h1><p>When deadlines, exams, and everyday life all compete for attention, it is hard to know where to start. Lock-in helps make the next step visible.</p></div><div className="about-mark"><span><BookOpen size={38}/></span><strong>Plan with purpose.<br/>Study with focus.</strong></div></section>
    <section className="about-content"><article><h2>Why we built Lock-in</h2><p>Students need more than another to-do list. They need a way to turn a full workload into a week that feels manageable. Lock-in brings subjects, tasks, exams, and study time into one place—then helps you shape them into a plan.</p></article><article><h2>What we believe</h2><p>A useful plan should respect your real availability, make priorities easier to understand, and remain flexible when life changes. Progress comes from consistent, achievable steps—not perfect schedules.</p></article></section>
    <section className="public-bottom-cta"><h2>Start with one clear next step.</h2><NavLink to="/login" className="primary-button large">Plan your week <ArrowLeft className="cta-arrow" size={17}/></NavLink></section>
  </PublicLayout>
}

function App() {
  const [sessionUser, setSessionUser] = useState<any>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSessionUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSessionUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sessionUser || !supabase) return
    supabase.from('profiles').select('id,full_name').eq('id', sessionUser.id).maybeSingle().then(({ data }) => setProfile(data))
  }, [sessionUser])

  if (!isSupabaseConfigured) return <SetupScreen />

  function Protected({ children }: { children: ReactNode }) {
    if (sessionUser === undefined) return <div className="grid min-h-screen place-items-center bg-slate-50"><div className="size-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600"/></div>
    if (!sessionUser) return <Navigate to="/login" replace />
    return <AppShell profile={profile}>{children}</AppShell>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={sessionUser ? <Navigate to="/dashboard" replace /> : <AuthShell><></></AuthShell>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/subjects" element={<Protected><SubjectsPage /></Protected>} />
          <Route path="/tasks" element={<Protected><TasksPage /></Protected>} />
          <Route path="/exams" element={<Protected><ExamsPage /></Protected>} />
          <Route path="/planner" element={<Protected><PlannerPage /></Protected>} />
          <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
          <Route path="/timer" element={<Protected><TimerPage /></Protected>} />
          <Route path="/analytics" element={<Protected><AnalyticsPage /></Protected>} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
