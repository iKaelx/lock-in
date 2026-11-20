import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  BarChart3, BookOpen, CalendarDays, LayoutDashboard,
  LogOut, Moon, Plus, Settings, Timer, ListTodo, GraduationCap, Menu, X,
  ArrowLeft, Sun, CheckCircle2, Clock3, Sparkles, AlertCircle, LoaderCircle,
  Search, Pencil, Trash2, Pause, Play, RotateCcw, Square, Star,
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
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
  { path: '/notes', label: 'Notes', icon: Pencil },
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
          {nav.slice(0, 6).map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}><item.icon size={19} /><span>{item.label}</span></NavLink>)}
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
  const [data, setData] = useState<{ subjects: number; tasks: any[]; sessions: any[]; hours: number }>({ subjects: 0, tasks: [], sessions: [], hours: 0 })
  const [loading, setLoading] = useState(true)
  const [error,setError]=useState('')
  useEffect(() => {
    if (!supabase) return
    const now=new Date()
    const weekStart=startOfWeek(now,{weekStartsOn:1})
    const weekEnd=addDays(weekStart,7)
    Promise.all([
      supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('archived', false),
      supabase.from('tasks').select('*').neq('status', 'Completed').order('deadline', { ascending: true }),
      supabase.from('study_sessions').select('id,title,status,start_time,end_time,actual_minutes,session_type').gte('start_time',weekStart.toISOString()).lt('start_time',weekEnd.toISOString()).order('start_time'),
    ]).then(([subjects,tasks,sessions])=>{
      const failed=[subjects.error,tasks.error,sessions.error].find(Boolean)
      if(failed)throw failed
      const completed=(sessions.data??[]).filter(session=>session.status==='Completed') as {actual_minutes?:number}[]
      setData({
        subjects: subjects.count ?? 0,
        tasks: tasks.data ?? [],
        sessions: sessions.data ?? [],
        hours: completed.reduce((sum, item) => sum + (item.actual_minutes ?? 0), 0) / 60,
      })
    }).catch(cause=>setError(getErrorMessage(cause))).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="dashboard-loading" aria-label="Loading dashboard"><div className="h-48 animate-pulse rounded-3xl bg-slate-200"/><div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200"/>)}</div><div className="h-72 animate-pulse rounded-2xl bg-slate-200"/></div>
  const completedSessions=data.sessions.filter(session=>session.status==='Completed').length
  const planProgress=data.sessions.length?Math.round(completedSessions/data.sessions.length*100):0
  const nextSession=data.sessions.find(session=>session.status==='Scheduled'&&new Date(session.start_time)>=new Date())
  const upcomingTasks=[...data.tasks].sort((a,b)=>{
    const first=a.deadline?new Date(a.deadline).getTime():Number.MAX_SAFE_INTEGER
    const second=b.deadline?new Date(b.deadline).getTime():Number.MAX_SAFE_INTEGER
    return first-second
  }).slice(0,5)
  return (
    <>
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <p className="dashboard-kicker"><Sparkles size={14}/> YOUR LEARNING OVERVIEW</p>
          <h1>Good morning</h1>
          <p className="dashboard-welcome-description">A clear plan makes it easier to focus on what matters today.</p>
          <div className="dashboard-welcome-actions">
            <NavLink to="/planner" className="dashboard-main-action"><Sparkles size={17}/>Generate your plan</NavLink>
            <NavLink to="/timer" className="dashboard-secondary-action"><Timer size={17}/>Start focus session</NavLink>
          </div>
        </div>
        <section className="dashboard-plan-overview" aria-label="Weekly plan progress">
          <div className="dashboard-plan-heading"><span className="dashboard-plan-icon"><CalendarDays size={17}/></span><span>This week</span><NavLink to="/calendar" aria-label="Open calendar"><ArrowLeft className="card-link-arrow" size={16}/></NavLink></div>
          {data.sessions.length?<><div className="dashboard-plan-count"><strong>{completedSessions}<span>/{data.sessions.length}</span></strong><span>sessions completed</span></div><div className="dashboard-progress-track" role="progressbar" aria-valuenow={planProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Weekly plan completion"><span style={{width:`${planProgress}%`}}/></div><p>{planProgress===100?'Your plan is complete. Great work!':'Keep going, one focused session at a time.'}</p></>:<><div className="dashboard-plan-empty">No plan yet</div><p>Build a realistic schedule around your week.</p></>}
        </section>
      </section>
      {error&&<FormNotice message={error}/>}
      <div className="dashboard-stats">
        <article className="stat-card stat-violet">
          <div className="stat-icon"><BookOpen size={19} /></div>
          <div><p>Subjects tracked</p><strong>{data.subjects}</strong><span>Active courses</span></div>
        </article>
        <article className="stat-card stat-mint">
          <div className="stat-icon"><Clock3 size={19} /></div>
          <div><p>Focused this week</p><strong>{data.hours.toFixed(1)}<small>h</small></strong><span>From completed sessions</span></div>
        </article>
        <article className="stat-card stat-orange">
          <div className="stat-icon"><ListTodo size={19} /></div>
          <div><p>Open tasks</p><strong>{data.tasks.length}</strong><span>Ready for your attention</span></div>
        </article>
      </div>
      <div className="dashboard-content-grid">
        <Card title="Upcoming tasks" action={<NavLink to="/tasks" className="card-link">View all <ArrowLeft className="card-link-arrow" size={14} /></NavLink>}>
          {upcomingTasks.length?<div className="dashboard-task-list">{upcomingTasks.map(task=>{
            const overdue=task.deadline&&new Date(task.deadline)<new Date()
            const deadlineText=task.deadline?`${overdue?'Overdue · ':''}${format(new Date(task.deadline),'MMM d, h:mm a')}`:'No due date'
            return <article key={task.id} className="dashboard-task">
              <span className={`dashboard-task-marker ${overdue?'overdue':''}`}><CheckCircle2 size={17}/></span>
              <div className="dashboard-task-copy"><strong>{task.title}</strong><span className={overdue?'task-deadline overdue':'task-deadline'}>{deadlineText}</span></div>
              <span className={`task-priority priority-${String(task.priority).toLowerCase()}`}>{task.priority}</span>
            </article>
          })}</div>:<EmptyState title="You're all caught up" text="Add a task whenever something needs your attention." action={<NavLink to="/tasks?add=1" className="mt-3 inline-flex text-sm font-semibold text-violet-600">Add a task</NavLink>}/>}
        </Card>
        <div className="dashboard-aside">
          <Card title="Next up">
            {nextSession?<div className="dashboard-next-session"><span className="dashboard-next-time">{format(new Date(nextSession.start_time),'EEE, MMM d · h:mm a')}</span><strong>{nextSession.title}</strong><span className="dashboard-session-type">{nextSession.session_type} session</span><NavLink to="/calendar" className="card-link">Open calendar <ArrowLeft className="card-link-arrow" size={14}/></NavLink></div>:<div className="dashboard-next-empty"><span className="dashboard-next-empty-icon"><CalendarDays size={20}/></span><strong>No upcoming session</strong><span>Generate a plan to give your study time a place.</span><NavLink to="/planner" className="card-link">Create a plan <ArrowLeft className="card-link-arrow" size={14}/></NavLink></div>}
          </Card>
          <Card title="Quick actions">
            <div className="quick-actions">
              {[
                { label: 'Add subject', path: '/subjects?add=1', icon: BookOpen },
                { label: 'Add task', path: '/tasks?add=1', icon: CheckCircle2 },
                { label: 'Add exam', path: '/exams?add=1', icon: GraduationCap },
                { label: 'Generate plan', path: '/planner', icon: Sparkles },
              ].map(({ label, path, icon: Icon }) => <NavLink key={label} to={path} className="quick-action"><span><Icon size={17} /></span><span className="quick-action-label">{label}</span><ArrowLeft className="quick-arrow" size={14} /></NavLink>)}
            </div>
          </Card>
        </div>
      </div>
      <AdSlot />
    </>
  )
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [search,setSearch]=useState('')
  const [priorityFilter,setPriorityFilter]=useState('All priorities')
  const [form, setForm] = useState({ name: '', description: '', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 180, understanding_level: 50, color: '#6C5CE7' })
  async function load() {
    const { data, error } = await supabase!.from('subjects').select('*').eq('archived',false).order('created_at')
    if (error) throw error
    setSubjects(data ?? [])
  }
  useEffect(() => { load().catch(cause => setError(getErrorMessage(cause))).finally(()=>setLoading(false)) }, [])
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setEditingId(null)
      setForm({ name: '', description: '', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 180, understanding_level: 50, color: '#6C5CE7' })
      setOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])
  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Enter a subject name.'); return }
    setBusy(true); setError('')
    try {
      const values={...form,name:form.name.trim(),description:form.description.trim()||null}
      let error
      if(editingId){
        const result=await supabase!.from('subjects').update(values).eq('id',editingId)
        error=result.error
      }else{
        const user = await getSignedInUser()
        const result=await supabase!.from('subjects').insert({ ...values, user_id: user.id })
        error=result.error
      }
      if (error) throw error
      await load()
      setOpen(false)
      setNotice(editingId?'Subject updated successfully.':'Subject added successfully.')
      setEditingId(null)
      setForm({ name: '', description: '', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 180, understanding_level: 50, color: '#6C5CE7' })
    } catch (cause) { setError(getErrorMessage(cause)) }
    finally { setBusy(false) }
  }
  function edit(subject:any){
    setForm({name:subject.name,description:subject.description??'',difficulty:subject.difficulty,priority:subject.priority,weekly_target_minutes:subject.weekly_target_minutes,understanding_level:subject.understanding_level,color:subject.color})
    setEditingId(subject.id);setError('');setNotice('');setOpen(true)
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
  const filteredSubjects=subjects.filter(subject=>{
    const matchesText=`${subject.name} ${subject.description??''}`.toLowerCase().includes(search.trim().toLowerCase())
    return matchesText&&(priorityFilter==='All priorities'||subject.priority===priorityFilter)
  })
  const weeklyTarget=subjects.reduce((total,subject)=>total+(subject.weekly_target_minutes??0),0)
  const highPriorityCount=subjects.filter(subject=>subject.priority==='High').length
  const formatTarget=(minutes:number)=>minutes>=60&&minutes%60===0?`${minutes/60}h`:`${minutes}m`
  return <>
    <div className="page-heading subjects-heading">
      <div><p className="eyebrow">YOUR STUDY SPACE</p><h1>Subjects</h1><p className="subjects-intro">Keep your courses, priorities, and weekly goals in one clear place.</p></div>
      <button onClick={() => {setError('');setEditingId(null);setForm({ name: '', description: '', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 180, understanding_level: 50, color: '#6C5CE7' });setOpen(true)}} className="primary-button"><Plus size={17}/>Add subject</button>
    </div>
    {notice && <p className="inline-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></p>}
    {error && !open && <FormNotice message={error} />}
    {!loading&&subjects.length>0&&<section className="subjects-overview">
      <div className="subjects-overview-copy"><span><BookOpen size={15}/>STUDY AREAS</span><h2>Build a routine that works for you.</h2><p>Set realistic goals and give every course the attention it needs.</p></div>
      <div className="subjects-overview-stats"><div><strong>{subjects.length}</strong><span>Active subjects</span></div><div><strong>{formatTarget(weeklyTarget)}</strong><span>Weekly study goal</span></div><div><strong>{highPriorityCount}</strong><span>High priority</span></div></div>
    </section>}
    {open && <FormDialog title={editingId?'Edit subject':'Add a subject'} description="Give each course its own goals and study color." icon={BookOpen} onClose={() => !busy && setOpen(false)}>
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
        <FormActions busy={busy} onCancel={() => setOpen(false)} label={editingId?'Save changes':'Create subject'}/>
      </form>
    </FormDialog>}
    {!loading&&subjects.length>0&&<div className="subjects-toolbar">
      <label className="subjects-search"><Search size={17}/><input aria-label="Search subjects" placeholder="Search subjects..." value={search} onChange={event=>setSearch(event.target.value)}/></label>
      <label className="subjects-filter"><span>Priority</span><select aria-label="Filter by priority" value={priorityFilter} onChange={event=>setPriorityFilter(event.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
      <span className="subjects-result-count">{filteredSubjects.length} {filteredSubjects.length===1?'subject':'subjects'}</span>
    </div>}
    {loading?<div className="subjects-grid">{[1,2,3].map(index=><div key={index} className="subject-skeleton animate-pulse"/>)}</div>:filteredSubjects.length?<div className="subjects-grid">{filteredSubjects.map(subject=><article key={subject.id} className="subject-card">
      <div className="subject-card-accent" style={{background:subject.color}}/>
      <div className="subject-card-heading">
        <span className="subject-monogram" style={{background:subject.color}}>{subject.name.slice(0,1).toUpperCase()}</span>
        <div className="subject-card-title"><h2>{subject.name}</h2><span>{subject.description||'Add a description to keep this course organized.'}</span></div>
        <div className="subject-card-actions"><button aria-label={`Edit ${subject.name}`} title="Edit subject" onClick={()=>edit(subject)}><Pencil size={15}/></button><button aria-label={`Delete ${subject.name}`} title="Delete subject" onClick={()=>remove(subject.id)}><Trash2 size={15}/></button></div>
      </div>
      <div className="subject-tags"><span className={`subject-difficulty difficulty-${String(subject.difficulty).toLowerCase()}`}>{subject.difficulty} difficulty</span><span className={`subject-priority priority-${String(subject.priority).toLowerCase()}`}>{subject.priority} priority</span></div>
      <div className="subject-card-goal"><div><span>Weekly study goal</span><strong>{formatTarget(subject.weekly_target_minutes)}<small> / week</small></strong></div><div className="subject-goal-icon"><Clock3 size={17}/></div></div>
      <div className="subject-understanding"><div><span>Understanding</span><strong>{subject.understanding_level}%</strong></div><div className="subject-understanding-track" role="progressbar" aria-valuenow={subject.understanding_level} aria-valuemin={0} aria-valuemax={100} aria-label={`${subject.name} understanding`}><span style={{width:`${subject.understanding_level}%`,background:subject.color}}/></div></div>
    </article>)}</div>:subjects.length?<EmptyState title="No matching subjects" text="Try another search or priority filter." action={<button onClick={()=>{setSearch('');setPriorityFilter('All priorities')}} className="mt-3 text-sm font-semibold text-violet-600">Clear filters</button>}/>:<EmptyState title="Your study space starts here" text="Add a subject to set your first weekly goal and build a plan that fits your workload." action={<button onClick={()=>setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-600"><Plus size={15}/>Add your first subject</button>}/>}
  </>
}

function TasksPage() {
  const [tasks,setTasks]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [searchParams,setSearchParams]=useSearchParams()
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState('Open')
  const [form,setForm]=useState({title:'',description:'',subject_id:'',deadline:'',estimated_minutes:60,priority:'Medium',status:'Pending'})
  async function load(){
    const [tasksResult,subjectsResult]=await Promise.all([supabase!.from('tasks').select('*').order('deadline',{ascending:true}),supabase!.from('subjects').select('id,name')])
    if(tasksResult.error)throw tasksResult.error
    if(subjectsResult.error)throw subjectsResult.error
    setTasks(tasksResult.data??[]);setSubjects(subjectsResult.data??[])
  }
  useEffect(()=>{load().catch(cause=>setError(getErrorMessage(cause))).finally(()=>setLoading(false))},[])
  useEffect(()=>{if(searchParams.get('add')==='1'){setEditingId(null);setForm({title:'',description:'',subject_id:'',deadline:'',estimated_minutes:60,priority:'Medium',status:'Pending'});setOpen(true);setSearchParams({}, {replace:true})}},[searchParams,setSearchParams])
  async function save(e:React.FormEvent){
    e.preventDefault();if(!form.title.trim()){setError('Enter a task title.');return}setBusy(true);setError('')
    try {
      const values={...form,title:form.title.trim(),description:form.description.trim()||null,subject_id:form.subject_id||null,deadline:form.deadline?new Date(form.deadline).toISOString():null}
      let error
      if(editingId){
        const result=await supabase!.from('tasks').update(values).eq('id',editingId).select('id').single()
        error=result.error
      }else{
        const user=await getSignedInUser()
        const result=await supabase!.from('tasks').insert({...values,user_id:user.id})
        error=result.error
      }
      if(error)throw error
      await load();setOpen(false);setNotice(editingId?'Task updated successfully.':'Task added successfully.');setEditingId(null)
      setForm({title:'',description:'',subject_id:'',deadline:'',estimated_minutes:60,priority:'Medium',status:'Pending'})
    } catch(cause){setError(getErrorMessage(cause))}
    finally{setBusy(false)}
  }
  function edit(task:any){
    setForm({title:task.title,description:task.description??'',subject_id:task.subject_id??'',deadline:task.deadline?format(new Date(task.deadline),"yyyy-MM-dd'T'HH:mm"):'',estimated_minutes:task.estimated_minutes,priority:task.priority,status:task.status})
    setEditingId(task.id);setError('');setNotice('');setOpen(true)
  }
  async function complete(task:any){
    setError('')
    try{const{error}=await supabase!.from('tasks').update({status:task.status==='Completed'?'Pending':'Completed'}).eq('id',task.id);if(error)throw error;await load()}
    catch(cause){setError(getErrorMessage(cause))}
  }
  async function remove(id:string){
    if(!confirm('Delete this task? This action cannot be undone.'))return
    setError('');setNotice('')
    try{const{error}=await supabase!.from('tasks').delete().eq('id',id);if(error)throw error;await load();setNotice('Task deleted.')}
    catch(cause){setError(getErrorMessage(cause))}
  }
  const openCount=tasks.filter(task=>task.status!=='Completed').length
  const completedCount=tasks.length-openCount
  const now=new Date()
  const weekEnd=addDays(now,7)
  const dueSoonCount=tasks.filter(task=>task.status!=='Completed'&&task.deadline&&new Date(task.deadline)>=now&&new Date(task.deadline)<weekEnd).length
  const filteredTasks=tasks.filter(task=>{
    const matchesText=`${task.title} ${task.description??''} ${subjects.find(subject=>subject.id===task.subject_id)?.name??''}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesStatus=statusFilter==='All'||(statusFilter==='Completed'?task.status==='Completed':task.status!=='Completed')
    return matchesText&&matchesStatus
  }).sort((a,b)=>{
    if(a.status==='Completed'&&b.status!=='Completed')return 1
    if(a.status!=='Completed'&&b.status==='Completed')return -1
    const first=a.deadline?new Date(a.deadline).getTime():Number.MAX_SAFE_INTEGER
    const second=b.deadline?new Date(b.deadline).getTime():Number.MAX_SAFE_INTEGER
    return first-second
  })
  const formatDuration=(minutes:number)=>minutes>=60?`${Math.floor(minutes/60)}h${minutes%60?` ${minutes%60}m`:''}`:`${minutes} min`
  function deadlineLabel(deadline:string|null,completed=false){
    if(!deadline)return'No due date'
    const date=new Date(deadline)
    if(date<now)return`${completed?'Was due':'Overdue'} · ${format(date,'MMM d, h:mm a')}`
    if(format(date,'yyyy-MM-dd')===format(now,'yyyy-MM-dd'))return`Due today · ${format(date,'h:mm a')}`
    return`Due ${format(date,'MMM d · h:mm a')}`
  }
  return <>
    <div className="page-heading tasks-heading"><div><p className="eyebrow">YOUR WORKLOAD</p><h1>Tasks</h1><p className="tasks-intro">Keep deadlines clear and turn your to-do list into your next small win.</p></div><button onClick={()=>{setError('');setEditingId(null);setForm({title:'',description:'',subject_id:'',deadline:'',estimated_minutes:60,priority:'Medium',status:'Pending'});setOpen(true)}} className="primary-button"><Plus size={17}/>Add task</button></div>
    {notice&&<p className="inline-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></p>}
    {error&&!open&&<FormNotice message={error}/>}
    {!loading&&tasks.length>0&&<section className="tasks-overview">
      <div className="tasks-overview-copy"><span><ListTodo size={15}/>TASK SNAPSHOT</span><h2>One step at a time.</h2><p>Know what is next, what is urgent, and what you have already finished.</p></div>
      <div className="tasks-overview-stats"><div><strong>{openCount}</strong><span>Open tasks</span></div><div><strong>{dueSoonCount}</strong><span>Due in 7 days</span></div><div><strong>{completedCount}</strong><span>Completed</span></div></div>
    </section>}
    {open&&<FormDialog title={editingId?'Edit task':'Add a task'} description="Capture what needs doing and when it's due." icon={CheckCircle2} onClose={()=>!busy&&setOpen(false)}>
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
        <FormActions busy={busy} onCancel={()=>setOpen(false)} label={editingId?'Save changes':'Create task'}/>
      </form>
    </FormDialog>}
    {loading?<div className="tasks-loading"><div className="h-16 animate-pulse rounded-2xl bg-slate-200"/><div className="h-72 animate-pulse rounded-2xl bg-slate-200"/></div>:tasks.length>0?<Card title="Task list" action={<span className="tasks-count">{filteredTasks.length} shown</span>}>
      <div className="tasks-toolbar"><label className="tasks-search"><Search size={16}/><input aria-label="Search tasks" placeholder="Search tasks or subjects..." value={search} onChange={event=>setSearch(event.target.value)}/></label><div className="tasks-filters" role="group" aria-label="Filter tasks by status">{['Open','All','Completed'].map(filter=><button key={filter} onClick={()=>setStatusFilter(filter)} className={statusFilter===filter?'active':''} aria-pressed={statusFilter===filter}>{filter}</button>)}</div></div>
      {filteredTasks.length?<div className="tasks-list">{filteredTasks.map(task=>{
        const subject=subjects.find(item=>item.id===task.subject_id)
        const overdue=task.deadline&&new Date(task.deadline)<now&&task.status!=='Completed'
        return <article key={task.id} className={`task-row ${task.status==='Completed'?'is-completed':''}`}>
          <button onClick={()=>complete(task)} className={`task-complete-button ${task.status==='Completed'?'checked':''}`} aria-label={task.status==='Completed'?`Reopen ${task.title}`:`Complete ${task.title}`} aria-pressed={task.status==='Completed'}><CheckCircle2 size={19}/></button>
          <div className="task-row-main"><div className="task-row-title-line"><h3>{task.title}</h3><span className={`task-status status-${String(task.status).toLowerCase().replaceAll(' ','-')}`}>{task.status}</span></div><p>{task.description||'No additional details'}</p><div className="task-row-meta"><span className={overdue?'task-row-deadline overdue':''}><Clock3 size={13}/>{deadlineLabel(task.deadline,task.status==='Completed')}</span><span>{subject?.name||'No subject'}</span><span>{formatDuration(task.estimated_minutes)}</span></div></div>
          <span className={`task-priority priority-${String(task.priority).toLowerCase()}`}>{task.priority}</span>
          <div className="task-row-actions"><button onClick={()=>edit(task)} aria-label={`Edit ${task.title}`} title="Edit task"><Pencil size={15}/></button><button onClick={()=>remove(task.id)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={15}/></button></div>
        </article>
      })}</div>:<EmptyState title="No tasks match your filters" text="Try a different search or show all tasks." action={<button onClick={()=>{setSearch('');setStatusFilter('All')}} className="mt-3 text-sm font-semibold text-violet-600">Clear filters</button>}/>}
    </Card>:error?null:<EmptyState title="A clear list starts here" text="Add a task to capture a deadline, estimate the effort, and decide what to focus on next." action={<button onClick={()=>setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-600"><Plus size={15}/>Add your first task</button>}/>}
  </>
}

function ExamsPage(){
  const [exams,setExams]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [searchParams,setSearchParams]=useSearchParams()
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [search,setSearch]=useState('')
  const [dateFilter,setDateFilter]=useState('Upcoming')
  const [form,setForm]=useState({title:'',subject_id:'',exam_date:'',importance:'Medium',preparation_status:0,notes:''})
  async function load(){
    const [examsResult,subjectsResult]=await Promise.all([supabase!.from('exams').select('*').order('exam_date'),supabase!.from('subjects').select('id,name')])
    if(examsResult.error)throw examsResult.error
    if(subjectsResult.error)throw subjectsResult.error
    setExams(examsResult.data??[]);setSubjects(subjectsResult.data??[])
  }
  useEffect(()=>{load().catch(cause=>setError(getErrorMessage(cause))).finally(()=>setLoading(false))},[])
  useEffect(()=>{if(searchParams.get('add')==='1'){setEditingId(null);setForm({title:'',subject_id:'',exam_date:'',importance:'Medium',preparation_status:0,notes:''});setOpen(true);setSearchParams({}, {replace:true})}},[searchParams,setSearchParams])
  async function save(e:React.FormEvent){
    e.preventDefault();if(!form.title.trim()){setError('Enter an exam title.');return}setBusy(true);setError('')
    try {
      const values={...form,title:form.title.trim(),exam_date:new Date(form.exam_date).toISOString(),notes:form.notes.trim()||null}
      let error
      if(editingId){
        const result=await supabase!.from('exams').update(values).eq('id',editingId).select('id').single()
        error=result.error
      }else{
        const user=await getSignedInUser()
        const result=await supabase!.from('exams').insert({...values,user_id:user.id,topics:[]})
        error=result.error
      }
      if(error)throw error
      await load();setOpen(false);setNotice(editingId?'Exam updated successfully.':'Exam added successfully.');setEditingId(null)
      setForm({title:'',subject_id:'',exam_date:'',importance:'Medium',preparation_status:0,notes:''})
    } catch(cause){setError(getErrorMessage(cause))}
    finally{setBusy(false)}
  }
  function edit(exam:any){
    setForm({title:exam.title,subject_id:exam.subject_id,exam_date:format(new Date(exam.exam_date),"yyyy-MM-dd'T'HH:mm"),importance:exam.importance,preparation_status:exam.preparation_status,notes:exam.notes??''})
    setEditingId(exam.id);setError('');setNotice('');setOpen(true)
  }
  async function remove(id:string){
    if(!confirm('Delete this exam? This action cannot be undone.'))return
    setError('');setNotice('')
    try{const{error}=await supabase!.from('exams').delete().eq('id',id);if(error)throw error;await load();setNotice('Exam deleted.')}
    catch(cause){setError(getErrorMessage(cause))}
  }
  const now=new Date()
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
  const examDays=(exam:any)=>Math.round((new Date(new Date(exam.exam_date).getFullYear(),new Date(exam.exam_date).getMonth(),new Date(exam.exam_date).getDate()).getTime()-today.getTime())/86400000)
  const upcomingExams=exams.filter(exam=>examDays(exam)>=0)
  const dueSoonCount=upcomingExams.filter(exam=>examDays(exam)<=7).length
  const averagePreparation=upcomingExams.length?Math.round(upcomingExams.reduce((total,exam)=>total+exam.preparation_status,0)/upcomingExams.length):0
  const filteredExams=exams.filter(exam=>{
    const days=examDays(exam)
    const matchesDate=dateFilter==='All'||(dateFilter==='Upcoming'?days>=0:days<0)
    const subjectName=subjects.find(subject=>subject.id===exam.subject_id)?.name??''
    return matchesDate&&`${exam.title} ${subjectName} ${exam.notes??''}`.toLowerCase().includes(search.trim().toLowerCase())
  })
  const countdownLabel=(days:number)=>days<0?`Passed ${Math.abs(days)} ${Math.abs(days)===1?'day':'days'} ago`:days===0?'Today':`${days} ${days===1?'day':'days'} left`
  return <>
    <div className="page-heading exams-heading"><div><p className="eyebrow">PREPARE WITH PURPOSE</p><h1>Exams</h1><p className="exams-intro">Keep important dates visible and build confidence one review at a time.</p></div><button onClick={()=>{setError('');setEditingId(null);setForm({title:'',subject_id:'',exam_date:'',importance:'Medium',preparation_status:0,notes:''});setOpen(true)}} className="primary-button"><Plus size={17}/>Add exam</button></div>
    {notice&&<p className="inline-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></p>}
    {error&&!open&&<FormNotice message={error}/>}
    {!loading&&exams.length>0&&<section className="exams-overview">
      <div className="exams-overview-copy"><span><GraduationCap size={16}/>EXAM OVERVIEW</span><h2>Feel ready before the big day.</h2><p>Stay ahead of upcoming exams and see where a little more preparation can help.</p></div>
      <div className="exams-overview-stats"><div><strong>{upcomingExams.length}</strong><span>Upcoming</span></div><div><strong>{dueSoonCount}</strong><span>Within 7 days</span></div><div><strong>{averagePreparation}%</strong><span>Average prepared</span></div></div>
    </section>}
    {open&&<FormDialog title={editingId?'Edit exam':'Add an exam'} description="Add an exam date so Lock-in can prioritize your revision." icon={GraduationCap} onClose={()=>!busy&&setOpen(false)}>
      <form className="dialog-form" onSubmit={save}>
        <FormNotice message={error}/>
        <div className="form-grid">
          <Field label="Exam title" className="form-span-2"><input autoFocus required maxLength={120} placeholder="e.g. Chemistry midterm" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field>
          <Field label="Subject" className="form-span-2"><select required value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}><option value="">Choose a subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>{subjects.length===0&&<small><NavLink to="/subjects?add=1" className="font-semibold text-violet-600">Add a subject first</NavLink> to link this exam.</small>}</Field>
          <Field label="Date and time"><input required type="datetime-local" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})}/></Field>
          <Field label="Importance"><select value={form.importance} onChange={e=>setForm({...form,importance:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Preparation progress" hint="How prepared do you feel?"><span className="range-field"><input type="range" min="0" max="100" step="5" value={form.preparation_status} onChange={e=>setForm({...form,preparation_status:Number(e.target.value)})}/><strong>{form.preparation_status}%</strong></span></Field>
          <Field label="Notes" className="form-span-2"><textarea rows={3} maxLength={1000} placeholder="Topics, room, or anything else to remember" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Field>
        </div>
        <FormActions busy={busy} onCancel={()=>setOpen(false)} label={editingId?'Save changes':'Create exam'}/>
      </form>
    </FormDialog>}
    {loading?<div className="exams-grid">{[1,2].map(index=><div key={index} className="exam-skeleton animate-pulse"/>)}</div>:exams.length>0?<Card title="Exam schedule" action={<span className="exams-count">{filteredExams.length} shown</span>}>
      <div className="exams-toolbar"><label className="exams-search"><Search size={16}/><input aria-label="Search exams" placeholder="Search exams or subjects..." value={search} onChange={event=>setSearch(event.target.value)}/></label><div className="exams-filters" role="group" aria-label="Filter exams by date">{['Upcoming','All','Past'].map(filter=><button key={filter} onClick={()=>setDateFilter(filter)} className={dateFilter===filter?'active':''} aria-pressed={dateFilter===filter}>{filter}</button>)}</div></div>
      {filteredExams.length?<div className="exams-grid">{filteredExams.map(exam=>{
        const date=new Date(exam.exam_date)
        const days=examDays(exam)
        const subject=subjects.find(item=>item.id===exam.subject_id)
        return <article key={exam.id} className="exam-card">
          <div className="exam-card-top"><div className="exam-date-badge"><span>{format(date,'MMM')}</span><strong>{format(date,'d')}</strong></div><div className="exam-card-actions"><button onClick={()=>edit(exam)} aria-label={`Edit ${exam.title}`} title="Edit exam"><Pencil size={15}/></button><button onClick={()=>remove(exam.id)} aria-label={`Delete ${exam.title}`} title="Delete exam"><Trash2 size={15}/></button></div></div>
          <div className="exam-card-title"><span className={`exam-countdown ${days<0?'past':days===0?'today':''}`}>{countdownLabel(days)}</span><h3>{exam.title}</h3><span className="exam-subject">{subject?.name??'Subject unavailable'}</span></div>
          <p className="exam-date-time"><CalendarDays size={14}/>{format(date,'EEEE, MMM d')}<span>·</span>{format(date,'h:mm a')}</p>
          <div className="exam-preparation"><div><span>Preparation</span><strong>{exam.preparation_status}%</strong></div><div className="exam-preparation-track" role="progressbar" aria-valuenow={exam.preparation_status} aria-valuemin={0} aria-valuemax={100} aria-label={`${exam.title} preparation`}><span style={{width:`${exam.preparation_status}%`}}/></div></div>
          <div className="exam-card-footer"><span className={`task-priority priority-${String(exam.importance).toLowerCase()}`}>{exam.importance} importance</span>{exam.notes&&<span className="exam-notes" title={exam.notes}>{exam.notes}</span>}</div>
        </article>
      })}</div>:<EmptyState title={search?'No matching exams':dateFilter==='Upcoming'?'No upcoming exams':'No past exams'} text={search?'Try another search or view all exam dates.':dateFilter==='Upcoming'?'You are all caught up. Your upcoming exam dates will appear here.':'There are no past exams in your list.'} action={search?<button onClick={()=>{setSearch('');setDateFilter('All')}} className="mt-3 text-sm font-semibold text-violet-600">Clear filters</button>:dateFilter!=='All'?<button onClick={()=>setDateFilter('All')} className="mt-3 text-sm font-semibold text-violet-600">View all exams</button>:undefined}/>}
    </Card>:error?null:<EmptyState title="Get ahead of your next exam" text={subjects.length?'Add an exam date and Lock-in can schedule revision time around it.':'Create a subject first, then link your exams to it.'} action={subjects.length?<button onClick={()=>setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-600"><Plus size={15}/>Add your first exam</button>:<NavLink to="/subjects?add=1" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-600"><Plus size={15}/>Add a subject</NavLink>}/>}
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

type CalendarEvent = {
  id: string
  title: string
  description: string
  location: string
  subject_id: string | null
  starts_at: string
  ends_at: string
  color: string
}

type CalendarEventForm = Omit<CalendarEvent, 'starts_at' | 'ends_at'> & {
  date: string
  start_time: string
  end_time: string
}

const eventColors=[
  {label:'Violet',value:'#6C5CE7'},
  {label:'Blue',value:'#4C7CE8'},
  {label:'Teal',value:'#30A889'},
  {label:'Amber',value:'#E4A235'},
  {label:'Rose',value:'#D8697B'},
]
const noteColors=[
  {label:'Lavender',value:'#F4F1FF'},
  {label:'Sky',value:'#EDF5FF'},
  {label:'Mint',value:'#EBF8F1'},
  {label:'Sunshine',value:'#FFF6E5'},
  {label:'Blush',value:'#FFF0F1'},
]

function CalendarPage(){
  const [sessions,setSessions]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [events,setEvents]=useState<CalendarEvent[]>([])
  const [week,setWeek]=useState(startOfWeek(new Date(),{weekStartsOn:1}))
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [updatingSessionId,setUpdatingSessionId]=useState<string|null>(null)
  const [eventFormOpen,setEventFormOpen]=useState(false)
  const [eventForm,setEventForm]=useState<CalendarEventForm>({id:'',title:'',description:'',location:'',subject_id:null,date:format(startOfWeek(new Date(),{weekStartsOn:1}),'yyyy-MM-dd'),start_time:'09:00',end_time:'10:00',color:eventColors[0].value})
  const [eventFormError,setEventFormError]=useState('')
  const [savingEvent,setSavingEvent]=useState(false)
  const [deletingEventId,setDeletingEventId]=useState<string|null>(null)
  const load=useCallback(async()=>{
    setLoading(true);setError('')
    try{
      const end=addDays(week,7)
      const [sessionsResult,subjectsResult,eventsResult]=await Promise.all([
        supabase!.from('study_sessions').select('*').gte('start_time',week.toISOString()).lt('start_time',end.toISOString()).order('start_time'),
        supabase!.from('subjects').select('id,name,color'),
        supabase!.from('calendar_events').select('id,title,description,location,subject_id,starts_at,ends_at,color').gte('starts_at',week.toISOString()).lt('starts_at',end.toISOString()).order('starts_at'),
      ])
      if(sessionsResult.error)throw sessionsResult.error
      if(subjectsResult.error)throw subjectsResult.error
      if(eventsResult.error)throw eventsResult.error
      setSessions(sessionsResult.data??[]);setSubjects(subjectsResult.data??[]);setEvents(eventsResult.data??[])
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setLoading(false)}
  },[week])
  useEffect(()=>{void load()},[load])
  function openEventForm(event?:CalendarEvent){
    setEventFormError('');setError('')
    setEventForm(event?{
      ...event,
      date:format(new Date(event.starts_at),'yyyy-MM-dd'),
      start_time:format(new Date(event.starts_at),'HH:mm'),
      end_time:format(new Date(event.ends_at),'HH:mm'),
    }:{
      id:'',title:'',description:'',location:'',subject_id:null,
      date:format(week,'yyyy-MM-dd'),start_time:'09:00',end_time:'10:00',color:eventColors[0].value,
    })
    setEventFormOpen(true)
  }
  async function saveEvent(event:React.FormEvent){
    event.preventDefault();setSavingEvent(true);setEventFormError('')
    const startsAt=new Date(`${eventForm.date}T${eventForm.start_time}`)
    const endsAt=new Date(`${eventForm.date}T${eventForm.end_time}`)
    if(!eventForm.title.trim()){setEventFormError('Add a name for your event.');setSavingEvent(false);return}
    if(Number.isNaN(startsAt.getTime())||Number.isNaN(endsAt.getTime())||endsAt<=startsAt){setEventFormError('Choose an end time that comes after the start time.');setSavingEvent(false);return}
    try{
      const user=await getSignedInUser()
      const values={
        title:eventForm.title.trim(),description:eventForm.description.trim(),location:eventForm.location.trim(),
        subject_id:eventForm.subject_id||null,starts_at:startsAt.toISOString(),ends_at:endsAt.toISOString(),color:eventForm.color,
      }
      if(eventForm.id){
        const {error}=await supabase!.from('calendar_events').update(values).eq('id',eventForm.id).eq('user_id',user.id).select('id').single()
        if(error)throw error
      }else{
        const {error}=await supabase!.from('calendar_events').insert({...values,user_id:user.id}).select('id').single()
        if(error)throw error
      }
      setEventFormOpen(false)
      const eventWeek=startOfWeek(startsAt,{weekStartsOn:1})
      if(isSameDay(eventWeek,week))await load()
      else setWeek(eventWeek)
    }catch(cause){setEventFormError(getErrorMessage(cause))}
    finally{setSavingEvent(false)}
  }
  async function deleteEvent(id:string){
    if(!window.confirm('Delete this calendar event?'))return
    setDeletingEventId(id);setError('')
    try{
      const user=await getSignedInUser()
      const {error}=await supabase!.from('calendar_events').delete().eq('id',id).eq('user_id',user.id).select('id').single()
      if(error)throw error
      await load()
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setDeletingEventId(null)}
  }
  async function completeSession(session:any){
    setUpdatingSessionId(session.id);setError('')
    try{
      const actual_minutes=session.actual_minutes??Math.round((new Date(session.end_time).getTime()-new Date(session.start_time).getTime())/60000)
      const {error}=await supabase!.from('study_sessions').update({status:'Completed',actual_minutes}).eq('id',session.id)
      if(error)throw error
      await load()
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setUpdatingSessionId(null)}
  }
  const days=Array.from({length:7},(_,i)=>addDays(week,i))
  const todayWeek=startOfWeek(new Date(),{weekStartsOn:1})
  const completedSessions=sessions.filter(session=>session.status==='Completed')
  const scheduledSessions=sessions.filter(session=>session.status==='Scheduled')
  const completedMinutes=completedSessions.reduce((total,session)=>total+(session.actual_minutes??Math.round((new Date(session.end_time).getTime()-new Date(session.start_time).getTime())/60000)),0)
  return<>
    <div className="page-heading calendar-heading">
      <div><p className="eyebrow">YOUR STUDY SCHEDULE</p><h1>Calendar</h1><p className="calendar-range">{format(week,'MMM d')} – {format(addDays(week,6),'MMM d, yyyy')}</p></div>
      <div className="calendar-actions">
        <div className="calendar-actions-main"><button className="primary-button" disabled={loading||Boolean(error)} onClick={()=>openEventForm()}><Plus size={16}/>Add event</button><NavLink to="/planner" className="calendar-generate-button"><Sparkles size={16}/>Generate plan</NavLink></div>
        <div className="calendar-week-controls">
          <button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button>
          <button onClick={()=>setWeek(todayWeek)} disabled={isSameDay(week,todayWeek)}>Today</button>
          <button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button>
        </div>
      </div>
    </div>
    {error&&<FormNotice message={error}/>}
    {loading?<div className="calendar-summary calendar-summary-loading">{[1,2,3,4].map(index=><div key={index} className="animate-pulse"/>)}</div>:!error&&<div className="calendar-summary">
      <article><span className="calendar-summary-icon scheduled"><Clock3 size={17}/></span><div><span>Scheduled sessions</span><strong>{scheduledSessions.length}</strong></div></article>
      <article><span className="calendar-summary-icon completed"><CheckCircle2 size={17}/></span><div><span>Completed</span><strong>{completedSessions.length}</strong></div></article>
      <article><span className="calendar-summary-icon focus"><Clock3 size={17}/></span><div><span>Focus time</span><strong>{(completedMinutes/60).toFixed(1)}<small>h</small></strong></div></article>
      <article><span className="calendar-summary-icon event"><CalendarDays size={17}/></span><div><span>Personal events</span><strong>{events.length}</strong></div></article>
    </div>}
    {!loading&&!error&&sessions.length===0&&events.length===0&&    <div className="calendar-empty-banner"><div><strong>Plan your week your way</strong><span>Add personal events or generate a study plan to see your schedule here.</span></div><div><button onClick={()=>openEventForm()}><Plus size={14}/>Add event</button><NavLink to="/planner">Generate a plan <ArrowLeft className="card-link-arrow" size={14}/></NavLink></div></div>}
    {loading?<div className="h-64 animate-pulse rounded-2xl bg-slate-200"/>:!error&&<div className="calendar-scroller"><div className="calendar-grid">
      {days.map(day=>{
        const daySessions=sessions.filter(session=>isSameDay(new Date(session.start_time),day))
        const dayEvents=events.filter(event=>isSameDay(new Date(event.starts_at),day))
        const items=[
          ...daySessions.map(session=>({type:'session' as const,id:session.id,start:session.start_time,session})),
          ...dayEvents.map(event=>({type:'event' as const,id:event.id,start:event.starts_at,event})),
        ].sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime())
        return <div key={day.toISOString()} className="calendar-day">
          <div className={`calendar-day-heading ${isSameDay(day,new Date())?'today':''}`}><span>{format(day,'EEE')}</span><strong>{format(day,'d')}</strong>{isSameDay(day,new Date())&&<small>Today</small>}</div>
          <div className="calendar-day-items">{items.length?items.map(item=>{
            if(item.type==='session'){
              const session=item.session
              const subject=subjects.find(subject=>subject.id===session.subject_id)
              const start=new Date(session.start_time)
              const end=new Date(session.end_time)
              const canComplete=session.status==='Scheduled'&&start<=new Date()
              return <article key={session.id} className={`calendar-session ${session.status==='Completed'?'completed':''}`} style={{borderLeftColor:session.status==='Completed'?'#22a06b':subject?.color||'#6C5CE7'}}>
                <div className="calendar-session-header"><time>{format(start,'h:mm a')}</time><span className={`calendar-session-status ${session.status.toLowerCase()}`}>{session.status}</span></div>
                <p>{session.title}</p>
                {subject&&<span className="calendar-session-subject">{subject.name}</span>}
                <div className="calendar-session-footer"><span>{format(end,'h:mm a')} · {session.session_type}</span>{canComplete&&<button disabled={updatingSessionId===session.id} onClick={()=>completeSession(session)}>{updatingSessionId===session.id?'Saving…':'Mark done'}</button>}</div>
              </article>
            }
            const event=item.event
            const subject=subjects.find(subject=>subject.id===event.subject_id)
            return <article key={event.id} className="calendar-event" style={{borderLeftColor:event.color}}>
              <div className="calendar-event-header"><time>{format(new Date(event.starts_at),'h:mm a')} – {format(new Date(event.ends_at),'h:mm a')}</time><div>
                <button aria-label={`Edit ${event.title}`} onClick={()=>openEventForm(event)}><Pencil size={12}/></button>
                <button aria-label={`Delete ${event.title}`} disabled={deletingEventId===event.id} onClick={()=>deleteEvent(event.id)}><Trash2 size={12}/></button>
              </div></div>
              <strong>{event.title}</strong>
              {event.description&&<p>{event.description}</p>}
              {(event.location||subject)&&<span className="calendar-event-meta">{[event.location,subject?.name].filter(Boolean).join(' · ')}</span>}
            </article>
          }):<p className="calendar-day-empty">Nothing planned</p>}</div>
        </div>
      })}
    </div></div>}
    {eventFormOpen&&<FormDialog title={eventForm.id?'Edit calendar event':'Add calendar event'} description="Add a personal event to your weekly calendar." icon={CalendarDays} onClose={()=>setEventFormOpen(false)}>
      <form className="dialog-form" onSubmit={saveEvent}>
        {eventFormError&&<FormNotice message={eventFormError}/>}
        <fieldset className="calendar-event-fields" disabled={savingEvent}><div className="form-grid">
          <Field label="Event name" className="form-span-2"><input required maxLength={120} autoFocus placeholder="e.g. Study group, appointment" value={eventForm.title} onChange={event=>setEventForm({...eventForm,title:event.target.value})}/></Field>
          <Field label="Date"><input required type="date" value={eventForm.date} onChange={event=>setEventForm({...eventForm,date:event.target.value})}/></Field>
          <Field label="Related subject"><select value={eventForm.subject_id??''} onChange={event=>setEventForm({...eventForm,subject_id:event.target.value||null})}><option value="">No subject</option>{subjects.map(subject=><option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></Field>
          <Field label="Start time"><input required type="time" value={eventForm.start_time} onChange={event=>setEventForm({...eventForm,start_time:event.target.value})}/></Field>
          <Field label="End time"><input required type="time" value={eventForm.end_time} onChange={event=>setEventForm({...eventForm,end_time:event.target.value})}/></Field>
          <Field label="Location (optional)" className="form-span-2"><input maxLength={120} placeholder="Where is it?" value={eventForm.location} onChange={event=>setEventForm({...eventForm,location:event.target.value})}/></Field>
          <Field label="Description (optional)" className="form-span-2"><textarea maxLength={1000} rows={3} placeholder="Add any useful details…" value={eventForm.description} onChange={event=>setEventForm({...eventForm,description:event.target.value})}/></Field>
          <Field label="Calendar color" className="form-span-2"><select value={eventForm.color} onChange={event=>setEventForm({...eventForm,color:event.target.value})}>{eventColors.map(color=><option key={color.value} value={color.value}>{color.label}</option>)}</select></Field>
        </div></fieldset>
        <FormActions busy={savingEvent} onCancel={()=>setEventFormOpen(false)} label={eventForm.id?'Save changes':'Add event'}/>
      </form>
    </FormDialog>}
  </>
}

type StudyNote = {
  id: string
  title: string
  content: string
  subject_id: string | null
  color: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

type StudyNoteDraft = Pick<StudyNote, 'title' | 'content' | 'subject_id' | 'color' | 'is_pinned'> & {id?:string}

function NotesPage(){
  const [notes,setNotes]=useState<StudyNote[]>([])
  const [subjects,setSubjects]=useState<Array<{id:string;name:string}>>([])
  const [loading,setLoading]=useState(true)
  const [loadFailed,setLoadFailed]=useState(false)
  const [error,setError]=useState('')
  const [search,setSearch]=useState('')
  const [editorOpen,setEditorOpen]=useState(false)
  const [draft,setDraft]=useState<StudyNoteDraft>({title:'',content:'',subject_id:null,color:noteColors[0].value,is_pinned:false})
  const [editorError,setEditorError]=useState('')
  const [saving,setSaving]=useState(false)
  const [deletingId,setDeletingId]=useState<string|null>(null)
  const [pinningId,setPinningId]=useState<string|null>(null)
  useEffect(()=>{
    let active=true
    async function load(){
      try{
        const user=await getSignedInUser()
        const [notesResult,subjectsResult]=await Promise.all([
          supabase!.from('study_notes').select('id,title,content,subject_id,color,is_pinned,created_at,updated_at').eq('user_id',user.id).order('is_pinned',{ascending:false}).order('updated_at',{ascending:false}),
          supabase!.from('subjects').select('id,name').eq('archived',false).order('name'),
        ])
        if(notesResult.error)throw notesResult.error
        if(subjectsResult.error)throw subjectsResult.error
        if(active){setNotes((notesResult.data??[]) as StudyNote[]);setSubjects(subjectsResult.data??[])}
      }catch(cause){if(active){setError(getErrorMessage(cause));setLoadFailed(true)}}
      finally{if(active)setLoading(false)}
    }
    void load()
    return()=>{active=false}
  },[])
  function sortNotes(items:StudyNote[]){
    return [...items].sort((a,b)=>Number(b.is_pinned)-Number(a.is_pinned)||b.updated_at.localeCompare(a.updated_at))
  }
  function openEditor(note?:StudyNote){
    setDraft(note?{id:note.id,title:note.title,content:note.content,subject_id:note.subject_id,color:note.color,is_pinned:note.is_pinned}:{title:'',content:'',subject_id:null,color:noteColors[0].value,is_pinned:false})
    setEditorError('');setError('');setEditorOpen(true)
  }
  async function saveNote(event:React.FormEvent){
    event.preventDefault();setSaving(true);setEditorError('')
    if(!draft.title.trim()){setEditorError('Give your note a title before saving.');setSaving(false);return}
    try{
      const user=await getSignedInUser()
      const values={title:draft.title.trim(),content:draft.content,subject_id:draft.subject_id||null,color:draft.color,is_pinned:draft.is_pinned}
      const result=draft.id
        ?await supabase!.from('study_notes').update(values).eq('id',draft.id).eq('user_id',user.id).select('id,title,content,subject_id,color,is_pinned,created_at,updated_at').single()
        :await supabase!.from('study_notes').insert({...values,user_id:user.id}).select('id,title,content,subject_id,color,is_pinned,created_at,updated_at').single()
      if(result.error)throw result.error
      setNotes(current=>sortNotes([result.data as StudyNote,...current.filter(note=>note.id!==result.data.id)]))
      setEditorOpen(false)
    }catch(cause){setEditorError(getErrorMessage(cause))}
    finally{setSaving(false)}
  }
  async function togglePin(note:StudyNote){
    setPinningId(note.id);setError('')
    try{
      const user=await getSignedInUser()
      const {data,error}=await supabase!.from('study_notes').update({is_pinned:!note.is_pinned}).eq('id',note.id).eq('user_id',user.id).select('id,title,content,subject_id,color,is_pinned,created_at,updated_at').single()
      if(error)throw error
      setNotes(current=>sortNotes(current.map(item=>item.id===note.id?data as StudyNote:item)))
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setPinningId(null)}
  }
  async function deleteNote(note:StudyNote){
    if(!window.confirm(`Delete "${note.title}"? This cannot be undone.`))return
    setDeletingId(note.id);setError('')
    try{
      const user=await getSignedInUser()
      const {error}=await supabase!.from('study_notes').delete().eq('id',note.id).eq('user_id',user.id).select('id').single()
      if(error)throw error
      setNotes(current=>current.filter(item=>item.id!==note.id))
    }catch(cause){setError(getErrorMessage(cause))}
    finally{setDeletingId(null)}
  }
  const query=search.trim().toLowerCase()
  const filteredNotes=notes.filter(note=>{
    const subject=subjects.find(item=>item.id===note.subject_id)?.name??''
    return !query||`${note.title} ${note.content} ${subject}`.toLowerCase().includes(query)
  })
  const pinnedCount=notes.filter(note=>note.is_pinned).length
  return<>
    <div className="page-heading notes-heading">
      <div><p className="eyebrow">YOUR THINKING SPACE</p><h1>Notes</h1><p className="notes-subtitle">Keep ideas, class notes, and reminders close to your study plan.</p></div>
      <button className="primary-button" disabled={loading||loadFailed} onClick={()=>openEditor()}><Plus size={16}/>New note</button>
    </div>
    <section className="notes-overview">
      <div><span className="notes-overview-kicker"><Sparkles size={14}/>A place for your thoughts</span><h2>Capture it now. Find it when you need it.</h2><p>Write freely, connect notes to a subject, and pin the thoughts you want to keep close.</p></div>
      <div className="notes-overview-stats"><div><strong>{loading?'—':notes.length}</strong><span>{notes.length===1?'note':'notes'}</span></div><div><strong>{loading?'—':pinnedCount}</strong><span>pinned</span></div></div>
    </section>
    {error&&<FormNotice message={error}/>}
    <div className="notes-toolbar">
      <label className="notes-search"><Search size={16}/><input aria-label="Search notes" placeholder="Search your notes…" value={search} onChange={event=>setSearch(event.target.value)}/></label>
      <span className="notes-result-count">{loading?'Loading…':`${filteredNotes.length} ${filteredNotes.length===1?'note':'notes'}`}</span>
    </div>
    {loading?<div className="notes-grid">{[1,2,3].map(index=><div key={index} className="notes-skeleton animate-pulse"/>)}</div>:loadFailed?
      <section className="notes-empty"><span><AlertCircle size={23}/></span><h2>Notes couldn’t be loaded</h2><p>Reload the page to try again. Your saved notes haven’t been changed.</p><button type="button" className="secondary-button" onClick={()=>window.location.reload()}>Reload notes</button></section>:filteredNotes.length?
      <div className="notes-grid">{filteredNotes.map(note=>{
        const subject=subjects.find(item=>item.id===note.subject_id)
        const updated=new Date(note.updated_at)
        return <article key={note.id} className="note-card">
          <div className="note-card-accent" style={{backgroundColor:note.color}}/>
          <div className="note-card-actions">
            <button type="button" className={`note-pin-button ${note.is_pinned?'pinned':''}`} aria-label={note.is_pinned?'Unpin note':'Pin note'} aria-pressed={note.is_pinned} disabled={pinningId===note.id} onClick={()=>togglePin(note)}><Sparkles size={14}/></button>
            <button type="button" aria-label={`Edit ${note.title}`} onClick={()=>openEditor(note)}><Pencil size={14}/></button>
            <button type="button" aria-label={`Delete ${note.title}`} disabled={deletingId===note.id} onClick={()=>deleteNote(note)}><Trash2 size={14}/></button>
          </div>
          <button type="button" className="note-card-body" onClick={()=>openEditor(note)}>
            <strong>{note.title}</strong><p>{note.content||'No note text yet. Open to add your thoughts.'}</p>
          </button>
          <footer className="note-card-footer"><span>{subject?.name??'Personal'}</span><time dateTime={note.updated_at}>{isToday(updated)?`Today, ${format(updated,'h:mm a')}`:format(updated,'MMM d, yyyy')}</time></footer>
        </article>
      })}</div>:<section className="notes-empty">
        <span><BookOpen size={23}/></span><h2>{search?'No matching notes':'Start with a fresh page'}</h2><p>{search?'Try another search term.':'Save ideas, class takeaways, and quick reminders all in one place.'}</p>{!search&&<button className="primary-button" onClick={()=>openEditor()}><Plus size={15}/>Write your first note</button>}
      </section>}
    {editorOpen&&<FormDialog title={draft.id?'Edit note':'Write a note'} description="Keep an idea, reminder, or study takeaway for later." icon={Pencil} onClose={()=>setEditorOpen(false)}>
      <form className="dialog-form note-editor-form" onSubmit={saveNote}>
        {editorError&&<FormNotice message={editorError}/>}
        <Field label="Title"><input required autoFocus maxLength={120} placeholder="Give this note a name" value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field>
        <Field label="Your note"><textarea maxLength={20000} rows={9} placeholder="Start writing…" value={draft.content} onChange={event=>setDraft({...draft,content:event.target.value})}/><small>{draft.content.length.toLocaleString()} / 20,000 characters</small></Field>
        <div className="form-grid note-editor-options">
          <Field label="Subject (optional)"><select value={draft.subject_id??''} onChange={event=>setDraft({...draft,subject_id:event.target.value||null})}><option value="">Personal note</option>{subjects.map(subject=><option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></Field>
          <div className="form-field"><span>Note color</span><div className="note-color-options">{noteColors.map(color=><button type="button" key={color.value} className={`note-color-choice ${draft.color===color.value?'selected':''}`} style={{backgroundColor:color.value}} aria-label={`${color.label} note color`} aria-pressed={draft.color===color.value} onClick={()=>setDraft({...draft,color:color.value})}/>)}</div></div>
        </div>
        <label className="note-pin-option"><input type="checkbox" checked={draft.is_pinned} onChange={event=>setDraft({...draft,is_pinned:event.target.checked})}/><span><Sparkles size={15}/>Pin this note to keep it near the top.</span></label>
        <FormActions busy={saving} onCancel={()=>setEditorOpen(false)} label={draft.id?'Save changes':'Save note'}/>
      </form>
    </FormDialog>}
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
  const progress=duration>0?(duration-remaining)/duration:0
  const circumference=2*Math.PI*96
  const timerState=running?'In focus':remaining===0&&hasElapsed?'Session complete':stopped?'Session ended':'Ready when you are'
  return<>
    <div className="page-heading timer-heading">
      <div><p className="eyebrow">FOCUS MODE</p><h1>Study timer</h1><p className="timer-subtitle">Make space for one thing at a time. Your progress adds up.</p></div>
      <span className={`timer-status ${running?'running':''}`}><i/>{timerState}</span>
    </div>
    {error&&<FormNotice message={error}/>}
    {saved&&<div className="timer-saved" role="status"><CheckCircle2 size={18}/><div><strong>Session saved</strong><span>Your focused time is now part of your study history.</span></div></div>}
    <div className="timer-layout">
      <section className="timer-focus-panel">
        <div className="timer-panel-heading"><span className="timer-panel-icon"><Timer size={19}/></span><div><h2>Focus session</h2><p>Settle in, focus, and make this time yours.</p></div></div>
        <div className={`timer-dial ${running?'is-running':''}`} role="timer" aria-label={`${minutes} minutes ${seconds} seconds remaining`}>
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle className="timer-ring-track" cx="110" cy="110" r="96"/>
            <circle className="timer-ring-progress" cx="110" cy="110" r="96" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress)}/>
          </svg>
          <div className="timer-readout"><span>{running?'FOCUSING':stopped?'SESSION ENDED':remaining===0?'COMPLETE':'READY'}</span><strong>{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</strong><small>minutes remaining</small></div>
        </div>
        <p className="timer-caption">{running?'Stay with the task in front of you.':hasElapsed&&!stopped?'Paused. Pick up where you left off.':stopped?'Your session is ready to review.':'Choose a duration and start when you’re ready.'}</p>
        <div className="timer-controls">
          <button className="timer-start-button" onClick={startOrPause} disabled={!running&&remaining===0}>{running?<><Pause size={17}/>Pause</>:<><Play size={17}/>{hasElapsed?'Resume':'Start focusing'}</>}</button>
          <button className="timer-secondary-button" onClick={stop} disabled={!hasElapsed||stopped}><Square size={15}/>Finish session</button>
          <button className="timer-reset-button" onClick={reset} aria-label="Reset timer"><RotateCcw size={17}/></button>
        </div>
        {(remaining===0||stopped)&&hasElapsed&&<div className="timer-review">
          <div className="timer-review-heading"><div><strong>How did that feel?</strong><span>Focus rating is optional and helps you spot patterns.</span></div><Sparkles size={17}/></div>
          <div className="timer-rating-options" role="group" aria-label="Rate your focus from 1 to 5">{[1,2,3,4,5].map(n=><button key={n} aria-label={`Focus rating ${n} of 5`} aria-pressed={rating===n} onClick={()=>setRating(n)} className={rating===n?'selected':''}><Star size={14} fill={rating>=n?'currentColor':'none'}/>{n}</button>)}</div>
          <button disabled={saving} onClick={saveSession} className="timer-save-button">{saving?<><LoaderCircle className="spin" size={16}/>Saving session…</>:<><CheckCircle2 size={16}/>Save session history</>}</button>
        </div>}
      </section>
      <aside className="timer-sidebar">
        <section className="timer-settings-panel">
          <div className="timer-panel-heading"><span className="timer-panel-icon duration"><Clock3 size={18}/></span><div><h2>Session length</h2><p>Choose a time that works for you.</p></div></div>
          <div className="timer-presets">
            {[25,50,90].map(value=><button type="button" key={value} disabled={running} onClick={()=>preset(value)} className={duration===value*60?'active':''}>{value}<small>min</small></button>)}
          </div>
          <form className="timer-custom-form" onSubmit={event=>{event.preventDefault();const value=Number(customMinutes);if(Number.isInteger(value)&&value>=1&&value<=240)preset(value);else setError('Choose a custom duration between 1 and 240 minutes.')}}>
            <label htmlFor="custom-timer-minutes">Custom duration</label>
            <div><input id="custom-timer-minutes" type="number" min="1" max="240" value={customMinutes} onChange={event=>setCustomMinutes(event.target.value)} disabled={running}/><span>minutes</span><button type="submit" disabled={running}>Set time</button></div>
            <small>Choose between 1 and 240 minutes.</small>
          </form>
        </section>
        <section className="timer-guide-panel">
          <p className="timer-guide-eyebrow"><Sparkles size={14}/>A little reminder</p>
          <h2>Progress over perfection.</h2>
          <p>Take a short break when you need one. Every session you complete counts toward your study history.</p>
          <div className="timer-guide-divider"/>
          <div className="timer-guide-tip"><CheckCircle2 size={16}/><span>Your time is saved only when you choose <strong>Save session history</strong>.</span></div>
        </section>
      </aside>
    </div>
  </>
}

type AnalyticsSession = {
  id: string
  title: string
  start_time: string
  actual_minutes: number | null
  focus_rating: number | null
  session_type: string
}

function AnalyticsPage(){
  const [sessions,setSessions]=useState<AnalyticsSession[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{
    let active=true
    async function load(){
      try{
        const {data,error}=await supabase!.from('study_sessions').select('id,title,start_time,actual_minutes,focus_rating,session_type').eq('status','Completed').order('start_time',{ascending:false})
        if(error)throw error
        if(active)setSessions((data??[]) as AnalyticsSession[])
      }catch(cause){if(active)setError(getErrorMessage(cause))}
      finally{if(active)setLoading(false)}
    }
    void load()
    return()=>{active=false}
  },[])
  const hours=sessions.reduce((sum,session)=>sum+(session.actual_minutes??0),0)/60
  const rated=sessions.filter(session=>session.focus_rating!==null)
  const averageFocus=rated.length?(rated.reduce((sum,session)=>sum+(session.focus_rating??0),0)/rated.length).toFixed(1):'—'
  const weekStart=startOfWeek(new Date(),{weekStartsOn:1})
  const chart=Array.from({length:7},(_,i)=>{
    const day=addDays(weekStart,i)
    const minutes=sessions.filter(session=>isSameDay(new Date(session.start_time),day)).reduce((sum,session)=>sum+(session.actual_minutes??0),0)
    return{name:format(day,'EEE'),minutes}
  })
  const weekMinutes=chart.reduce((sum,day)=>sum+day.minutes,0)
  const activeDays=chart.filter(day=>day.minutes>0).length
  const bestDay=chart.reduce((best,day)=>day.minutes>best.minutes?day:best,chart[0])
  const recentSessions=sessions.slice(0,5)
  const formatDuration=(minutes:number)=>minutes>=60?`${Math.floor(minutes/60)}h ${minutes%60?`${minutes%60}m`:''}`.trim():`${minutes} min`
  return<>
    <div className="page-heading analytics-heading">
      <div><p className="eyebrow">YOUR PROGRESS</p><h1>Analytics</h1><p className="analytics-subtitle">A clear view of your study habits and the time you’ve put in.</p></div>
      <NavLink to="/timer" className="primary-button"><Timer size={16}/>Start a focus session</NavLink>
    </div>
    {error&&<FormNotice message={error}/>}
    {loading?<div className="analytics-loading"><div className="analytics-stats">{[1,2,3,4].map(index=><div key={index} className="animate-pulse"/>)}</div><div className="analytics-chart-loading animate-pulse"/></div>:error?null:<>
      <section className="analytics-stats" aria-label="Study statistics">
        <article className="analytics-stat"><span className="analytics-stat-icon hours"><Clock3 size={18}/></span><div><span>Total study time</span><strong>{hours.toFixed(1)}<small>h</small></strong><p>Across all completed sessions</p></div></article>
        <article className="analytics-stat"><span className="analytics-stat-icon sessions"><CheckCircle2 size={18}/></span><div><span>Sessions completed</span><strong>{sessions.length}</strong><p>Every focused effort counts</p></div></article>
        <article className="analytics-stat"><span className="analytics-stat-icon focus"><Sparkles size={18}/></span><div><span>Average focus</span><strong>{averageFocus}<small>{averageFocus==='—'?'':'/ 5'}</small></strong><p>{rated.length?`From ${rated.length} rated ${rated.length===1?'session':'sessions'}`:'Rate sessions to track focus'}</p></div></article>
        <article className="analytics-stat"><span className="analytics-stat-icon active"><CalendarDays size={18}/></span><div><span>Active days this week</span><strong>{activeDays}<small>/ 7</small></strong><p>{format(weekStart,'MMM d')} – {format(addDays(weekStart,6),'MMM d')}</p></div></article>
      </section>
      {sessions.length===0&&!error?<section className="analytics-empty">
        <span className="analytics-empty-icon"><BarChart3 size={24}/></span><h2>Your progress starts here</h2>
        <p>Complete a study session to see your hours, weekly activity, and focus trends.</p>
        <NavLink to="/timer" className="primary-button"><Timer size={16}/>Start a focus session</NavLink>
      </section>:sessions.length>0&&<>
        <section className="analytics-panels">
          <Card title="Weekly activity" action={<span className="analytics-period">{format(weekStart,'MMM d')} – {format(addDays(weekStart,6),'MMM d')}</span>}>
            <div className="analytics-week-total"><strong>{(weekMinutes/60).toFixed(1)}<small>h</small></strong><span>studied this week</span></div>
            <div className="analytics-chart" role="img" aria-label={`Study time this week: ${chart.map(day=>`${day.name} ${day.minutes} minutes`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{top:8,right:8,left:-22,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:10}} tickFormatter={value=>value?`${value}m`:'0'} allowDecimals={false}/>
                  <Tooltip cursor={{fill:'rgba(108,92,231,.07)'}} contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}} formatter={value=>[`${value} min`,'Study time']}/>
                  <Bar dataKey="minutes" name="Study time" fill="#6C5CE7" radius={[6,6,0,0]} maxBarSize={38}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Your weekly rhythm">
            <div className="analytics-insights">
              <div className="analytics-insight"><span className="analytics-insight-icon"><CalendarDays size={16}/></span><div><strong>{activeDays} of 7 days</strong><span>with study activity this week</span></div></div>
              <div className="analytics-insight"><span className="analytics-insight-icon best"><Sparkles size={16}/></span><div><strong>{bestDay.minutes?bestDay.name:'—'}</strong><span>{bestDay.minutes?`${formatDuration(bestDay.minutes)} studied · your most active day`:'No study time logged this week yet'}</span></div></div>
              <div className="analytics-week-track" aria-label={`${activeDays} active days out of 7`}>{chart.map(day=><span key={day.name} className={day.minutes?'active':''} title={`${day.name}: ${day.minutes} min`} aria-label={`${day.name}: ${day.minutes} minutes`}>{day.name.slice(0,1)}</span>)}</div>
              {weekMinutes===0&&<p className="analytics-week-note">Your weekly chart will fill in as you complete study sessions.</p>}
            </div>
          </Card>
        </section>
        <Card title="Recent sessions" action={<span className="analytics-period">Latest completed</span>}>
          <div className="analytics-recent-list">{recentSessions.map(session=><article key={session.id} className="analytics-recent-item">
            <span className="analytics-recent-icon"><BookOpen size={16}/></span>
            <div className="analytics-recent-copy"><strong>{session.title}</strong><span>{format(new Date(session.start_time),'EEE, MMM d')} · {session.session_type}</span></div>
            <span className="analytics-duration">{formatDuration(session.actual_minutes??0)}</span>
            {session.focus_rating!==null&&<span className="analytics-rating"><Sparkles size={13}/>{session.focus_rating}/5</span>}
          </article>)}</div>
        </Card>
      </>}
    </>}
  </>
}

function SettingsPage(){
  const [profile,setProfile]=useState({full_name:'',education_level:'',study_field:'',institution:'',timezone:'UTC'})
  const [preferences,setPreferences]=useState({preferred_session_minutes:50,break_minutes:10,max_daily_study_minutes:300})
  const [availability,setAvailability]=useState<Array<{id:string;day_of_week:number;start_time:string;end_time:string}>>([])
  const [originalAvailability,setOriginalAvailability]=useState<Array<{id:string;day_of_week:number;start_time:string;end_time:string}>>([])
  const [saved,setSaved]=useState(false)
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const [loadFailed,setLoadFailed]=useState(false)
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
      }catch(cause){if(active){setError(getErrorMessage(cause));setLoadFailed(true)}}
      finally{if(active)setLoading(false)}
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
    <div className="page-heading settings-heading">
      <div><p className="eyebrow">MAKE IT YOURS</p><h1>Settings</h1><p className="settings-subtitle">Set up your profile, study rhythm, and the times you’re available.</p></div>
    </div>
    {loading?<div className="settings-loading" aria-label="Loading settings"><div className="animate-pulse"/><div className="animate-pulse"/><div className="animate-pulse"/></div>:loadFailed?
      <div className="settings-load-error"><FormNotice message={error}/><button type="button" className="secondary-button" onClick={()=>window.location.reload()}>Reload settings</button></div>:
      <form onSubmit={save} className="settings-form" aria-busy={busy}>
        {error&&<FormNotice message={error}/>}
        <fieldset className="settings-fieldset" disabled={busy}>
          <div className="settings-sections">
            <section className="settings-section">
              <header className="settings-section-heading"><span className="settings-section-icon profile"><BookOpen size={18}/></span><div><h2>Profile</h2><p>A few details to personalize your study space.</p></div></header>
              <div className="settings-profile-fields">
                <Field label="Full name"><input autoComplete="name" placeholder="Your name" value={profile.full_name} onChange={e=>{setProfile({...profile,full_name:e.target.value});setSaved(false)}}/></Field>
                <Field label="Education level"><input placeholder="e.g. Undergraduate" value={profile.education_level} onChange={e=>{setProfile({...profile,education_level:e.target.value});setSaved(false)}}/></Field>
                <Field label="Study field"><input placeholder="e.g. Computer science" value={profile.study_field} onChange={e=>{setProfile({...profile,study_field:e.target.value});setSaved(false)}}/></Field>
                <Field label="Institution"><input placeholder="School or university" value={profile.institution} onChange={e=>{setProfile({...profile,institution:e.target.value});setSaved(false)}}/></Field>
                <Field label="Time zone"><input autoComplete="off" placeholder="e.g. America/New_York" value={profile.timezone} onChange={e=>{setProfile({...profile,timezone:e.target.value});setSaved(false)}}/></Field>
              </div>
            </section>
            <section className="settings-section">
              <header className="settings-section-heading"><span className="settings-section-icon preferences"><Clock3 size={18}/></span><div><h2>Study preferences</h2><p>Choose the pace that feels sustainable for you.</p></div></header>
              <div className="settings-preference-fields">
                <Field label="Focus session" hint="Minutes"><input required type="number" min="15" max="240" value={preferences.preferred_session_minutes} onChange={e=>{setPreferences({...preferences,preferred_session_minutes:Number(e.target.value)});setSaved(false)}}/></Field>
                <Field label="Break between sessions" hint="Minutes"><input required type="number" min="0" max="60" value={preferences.break_minutes} onChange={e=>{setPreferences({...preferences,break_minutes:Number(e.target.value)});setSaved(false)}}/></Field>
                <Field label="Daily study limit" hint="Minutes"><input required type="number" min="30" max="720" value={preferences.max_daily_study_minutes} onChange={e=>{setPreferences({...preferences,max_daily_study_minutes:Number(e.target.value)});setSaved(false)}}/></Field>
              </div>
              <p className="settings-preference-note"><Sparkles size={14}/>These preferences help Lock-in build a plan that fits your day.</p>
            </section>
            <section className="settings-section settings-availability-section">
              <header className="settings-section-heading availability-heading">
                <span className="settings-section-icon availability"><CalendarDays size={18}/></span>
                <div><h2>Weekly availability</h2><p>Only these windows will be used when generating your study plan.</p></div>
                <span className="settings-window-count">{availability.length} {availability.length===1?'window':'windows'}</span>
                <button type="button" className="settings-add-button" onClick={addAvailability}><Plus size={15}/>Add time</button>
              </header>
              {availability.length===0?<div className="settings-availability-empty"><CalendarDays size={19}/><div><strong>No study windows yet</strong><span>Add the times you’re usually free to study.</span></div><button type="button" onClick={addAvailability}><Plus size={15}/>Add your first time</button></div>:<div className="settings-availability-list">
                {availability.map(row=><div key={row.id} className="settings-availability-row">
                  <Field label="Day"><select value={row.day_of_week} onChange={e=>{setAvailability(rows=>rows.map(item=>item.id===row.id?{...item,day_of_week:Number(e.target.value)}:item));setSaved(false)}}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day,index)=><option key={day} value={index}>{day}</option>)}</select></Field>
                  <Field label="From"><input type="time" value={row.start_time} onChange={e=>{setAvailability(rows=>rows.map(item=>item.id===row.id?{...item,start_time:e.target.value}:item));setSaved(false)}}/></Field>
                  <Field label="To"><input type="time" value={row.end_time} onChange={e=>{setAvailability(rows=>rows.map(item=>item.id===row.id?{...item,end_time:e.target.value}:item));setSaved(false)}}/></Field>
                  <button type="button" aria-label="Remove availability window" className="settings-remove-button" onClick={()=>{setAvailability(rows=>rows.filter(item=>item.id!==row.id));setSaved(false)}}><Trash2 size={16}/><span>Remove</span></button>
                </div>)}
              </div>}
            </section>
          </div>
        </fieldset>
        <footer className="settings-save-bar">
          <div>{saved?<span className="settings-save-success" role="status"><CheckCircle2 size={16}/>Your settings are up to date.</span>:<span>Changes are saved to your account.</span>}</div>
          <button type="submit" className="primary-button" disabled={busy}>{busy?<><LoaderCircle className="spin" size={16}/>Saving settings…</>:<><CheckCircle2 size={16}/>Save settings</>}</button>
        </footer>
      </form>}
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
          <Route path="/notes" element={<Protected><NotesPage /></Protected>} />
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
