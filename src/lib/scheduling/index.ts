export type SchedulingSubject = {
  id: string
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  priority: 'Low' | 'Medium' | 'High'
  weekly_target_minutes: number
  understanding_level: number
  color: string
}

export type SchedulingAvailability = {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

export type SchedulingTask = {
  subject_id: string | null
  deadline: string | null
  estimated_minutes: number
  priority: 'Low' | 'Medium' | 'High'
  status: string
}

export type SchedulingExam = {
  subject_id: string
  exam_date: string
  importance: 'Low' | 'Medium' | 'High'
  preparation_status: number
}

export type GeneratedSession = {
  subject_id: string
  title: string
  start_time: string
  end_time: string
  session_type: 'Study' | 'Revision'
}

const difficultyWeight = { Easy: 1, Medium: 1.25, Hard: 1.5 }
const priorityWeight = { Low: 1, Medium: 1.35, High: 1.7 }
const importanceWeight = { Low: 1, Medium: 1.4, High: 1.8 }

export function generateWeeklyPlan(
  subjects: SchedulingSubject[],
  availability: SchedulingAvailability[],
  tasks: SchedulingTask[],
  exams: SchedulingExam[],
  weekStart: Date,
  sessionMinutes = 50,
  breakMinutes = 10,
  maxDailyMinutes = 300,
  referenceDate = new Date(),
) {
  if (!subjects.length) return { sessions: [] as GeneratedSession[], warning: 'Add at least one subject before generating a plan.' }

  if (!availability.some(slot => slot.is_available)) {
    return { sessions: [] as GeneratedSession[], warning: 'Set your available study times before generating a plan.' }
  }

  const now = referenceDate
  const scores = new Map(subjects.map(subject => {
    let urgency = subject.weekly_target_minutes > 0 ? 1 : 0.25
    urgency *= difficultyWeight[subject.difficulty] * priorityWeight[subject.priority]
    urgency *= 1 + (100 - subject.understanding_level) / 150

    for (const task of tasks.filter(t => t.subject_id === subject.id && t.status !== 'Completed')) {
      if (!task.deadline) continue
      const days = Math.max(1, (new Date(task.deadline).getTime() - now.getTime()) / 86400000)
      urgency += (task.priority === 'High' ? 2 : task.priority === 'Medium' ? 1.2 : 0.6) * (8 / days)
    }

    for (const exam of exams.filter(e => e.subject_id === subject.id)) {
      if (new Date(exam.exam_date) < now) continue
      const days = Math.max(1, (new Date(exam.exam_date).getTime() - now.getTime()) / 86400000)
      urgency += importanceWeight[exam.importance] * ((100 - exam.preparation_status) / 100) * (10 / days)
    }
    return [subject.id, urgency] as const
  }))

  const totalScore = [...scores.values()].reduce((sum, value) => sum + value, 0)
  const subjectMinutes = new Map<string, number>()
  let requestedMinutes = 0
  for (const subject of subjects) {
    const algorithmTarget = Math.max(
      subject.weekly_target_minutes,
      Math.round(maxDailyMinutes * 7 * ((scores.get(subject.id) ?? 1) / (totalScore || 1)) * 0.15),
    )
    subjectMinutes.set(subject.id, algorithmTarget)
    requestedMinutes += algorithmTarget
  }

  const sessions: GeneratedSession[] = []
  const slotsByDay = new Map<number, Array<{ start: number; end: number }>>()
  for (let day = 0; day < 7; day++) {
    const intervals = availability
      .filter(slot => slot.is_available && slot.day_of_week === day)
      .map(slot => {
        const [startHour, startMinute] = slot.start_time.split(':').map(Number)
        const [endHour, endMinute] = slot.end_time.split(':').map(Number)
        return { start: startHour * 60 + startMinute, end: endHour * 60 + endMinute }
      })
      .filter(slot => slot.end > slot.start)
      .sort((a, b) => a.start - b.start)
    const merged = intervals.reduce<Array<{ start: number; end: number }>>((result, slot) => {
      const previous = result.at(-1)
      if (previous && slot.start <= previous.end) previous.end = Math.max(previous.end, slot.end)
      else result.push({ ...slot })
      return result
    }, [])
    slotsByDay.set(day, merged)
  }
  const availableMinutes = [...slotsByDay.values()].reduce(
    (total, slots) => total + Math.min(maxDailyMinutes, slots.reduce((sum, slot) => sum + slot.end - slot.start, 0)),
    0,
  )

  const used = new Map(subjects.map(subject => [subject.id, 0]))
  let dailyMinutes = new Array(7).fill(0)
  const ordered = [...subjects].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
  let nextSubjectIndex = 0

  for (let day = 0; day < 7; day++) {
    const jsDay = (weekStart.getDay() + day) % 7
    const daySlots = slotsByDay.get(jsDay) ?? []
    for (const slot of daySlots) {
      let cursor = new Date(weekStart)
      cursor.setDate(cursor.getDate() + day)
      const sh = Math.floor(slot.start / 60)
      const sm = slot.start % 60
      const eh = Math.floor(slot.end / 60)
      const em = slot.end % 60
      cursor.setHours(sh, sm, 0, 0)
      const slotEnd = new Date(cursor)
      slotEnd.setHours(eh, em, 0, 0)
      if (slotEnd <= now) continue
      if (cursor < now) {
        cursor = new Date(now)
        if (cursor.getSeconds() || cursor.getMilliseconds()) cursor.setMinutes(cursor.getMinutes() + 1)
        cursor.setSeconds(0, 0)
      }

      while (dailyMinutes[day] < maxDailyMinutes && cursor < slotEnd) {
        let subjectIndex = -1
        for (let offset = 0; offset < ordered.length; offset++) {
          const index = (nextSubjectIndex + offset) % ordered.length
          const candidate = ordered[index]
          if ((subjectMinutes.get(candidate.id) ?? 0) - (used.get(candidate.id) ?? 0) > 0) {
            subjectIndex = index
            break
          }
        }
        if (subjectIndex < 0) break
        const subject = ordered[subjectIndex]

        const remainingSubject = (subjectMinutes.get(subject.id) ?? 0) - (used.get(subject.id) ?? 0)
        const duration = Math.min(
          Math.max(1, sessionMinutes),
          remainingSubject,
          maxDailyMinutes - dailyMinutes[day],
        )
        const end = new Date(cursor.getTime() + duration * 60000)
        if (end > slotEnd) break

        const closeExam = exams
          .filter(exam => exam.subject_id === subject.id && new Date(exam.exam_date) >= cursor)
          .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())[0]
        const revision = closeExam
          ? (new Date(closeExam.exam_date).getTime() - cursor.getTime()) / 86400000 <= 14
          : false

        sessions.push({
          subject_id: subject.id,
          title: revision ? `${subject.name} revision` : `${subject.name} study session`,
          start_time: cursor.toISOString(),
          end_time: end.toISOString(),
          session_type: revision ? 'Revision' : 'Study',
        })
        used.set(subject.id, (used.get(subject.id) ?? 0) + duration)
        dailyMinutes[day] += duration
        nextSubjectIndex = (subjectIndex + 1) % ordered.length
        cursor = new Date(end.getTime() + Math.max(0, breakMinutes) * 60000)
        if (cursor >= slotEnd) break
      }
    }
  }

  const scheduledMinutes = sessions.reduce((sum, session) =>
    sum + (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000, 0)
  const warning = scheduledMinutes < requestedMinutes
    ? `Your requested workload needs about ${requestedMinutes} minutes, but your availability provides ${availableMinutes} minutes.`
    : undefined
  return { sessions, warning }
}
