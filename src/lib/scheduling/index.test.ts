import { describe, expect, it } from 'vitest'
import { generateWeeklyPlan } from '.'

describe('generateWeeklyPlan', () => {
  it('returns an empty state for no subjects', () => {
    const result = generateWeeklyPlan([], [], [], [], new Date('2026-11-16'))
    expect(result.sessions).toEqual([])
    expect(result.warning).toContain('at least one subject')
  })

  it('does not invent availability when no study windows are configured', () => {
    const result = generateWeeklyPlan(
      [{ id: 'math', name: 'Mathematics', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 60, understanding_level: 50, color: '#6C5CE7' }],
      [],
      [],
      [],
      new Date('2026-11-16T00:00:00'),
    )

    expect(result.sessions).toEqual([])
    expect(result.warning).toContain('available study times')
  })

  it('creates sessions only within available time', () => {
    const weekStart = new Date('2026-11-16T00:00:00')
    const result = generateWeeklyPlan(
      [{ id: 'math', name: 'Mathematics', difficulty: 'Hard', priority: 'High', weekly_target_minutes: 100, understanding_level: 40, color: '#6C5CE7' }],
      [{ day_of_week: 1, start_time: '09:00', end_time: '11:00', is_available: true }],
      [],
      [],
      weekStart,
      50,
      10,
      300,
      new Date('2026-11-15T00:00:00'),
    )
    expect(result.sessions.length).toBeGreaterThanOrEqual(1)
    for (const session of result.sessions) {
      expect(new Date(session.start_time).getHours()).toBeGreaterThanOrEqual(9)
      expect(new Date(session.end_time).getHours()).toBeLessThanOrEqual(11)
    }
  })

  it('warns when workload exceeds availability', () => {
    const result = generateWeeklyPlan(
      [{ id: 'math', name: 'Mathematics', difficulty: 'Hard', priority: 'High', weekly_target_minutes: 600, understanding_level: 20, color: '#6C5CE7' }],
      [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_available: true }],
      [],
      [],
      new Date('2026-11-16T00:00:00'),
      50,
      10,
      300,
      new Date('2026-11-15T00:00:00'),
    )
    expect(result.warning).toContain('needs about')
  })

  it('distributes sessions across subjects before filling one subject target', () => {
    const subjects = [
      { id: 'math', name: 'Mathematics', difficulty: 'Hard' as const, priority: 'High' as const, weekly_target_minutes: 100, understanding_level: 20, color: '#6C5CE7' },
      { id: 'history', name: 'History', difficulty: 'Easy' as const, priority: 'Low' as const, weekly_target_minutes: 100, understanding_level: 90, color: '#6C5CE7' },
    ]
    const result = generateWeeklyPlan(
      subjects,
      [{ day_of_week: 1, start_time: '09:00', end_time: '11:00', is_available: true }],
      [],
      [],
      new Date('2026-11-16T00:00:00'),
      50,
      0,
      300,
      new Date('2026-11-15T00:00:00'),
    )

    expect(new Set(result.sessions.map(session => session.subject_id))).toEqual(new Set(['math', 'history']))
  })

  it('does not schedule in the past and starts an active window at the reference time', () => {
    const result = generateWeeklyPlan(
      [{ id: 'math', name: 'Mathematics', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 50, understanding_level: 50, color: '#6C5CE7' }],
      [
        { day_of_week: 1, start_time: '09:00', end_time: '11:00', is_available: true },
        { day_of_week: 3, start_time: '09:00', end_time: '12:00', is_available: true },
      ],
      [],
      [],
      new Date('2026-11-16T00:00:00'),
      50,
      0,
      300,
      new Date('2026-11-18T10:30:00'),
    )

    expect(result.sessions).toHaveLength(1)
    expect(new Date(result.sessions[0].start_time).getDate()).toBe(18)
    expect(new Date(result.sessions[0].start_time).getHours()).toBe(10)
    expect(new Date(result.sessions[0].start_time).getMinutes()).toBe(30)
  })

  it('merges overlapping availability windows so sessions do not overlap', () => {
    const result = generateWeeklyPlan(
      [{ id: 'math', name: 'Mathematics', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 150, understanding_level: 50, color: '#6C5CE7' }],
      [
        { day_of_week: 1, start_time: '09:00', end_time: '10:00', is_available: true },
        { day_of_week: 1, start_time: '09:30', end_time: '11:00', is_available: true },
      ],
      [],
      [],
      new Date('2026-11-16T00:00:00'),
      50,
      0,
      300,
      new Date('2026-11-15T00:00:00'),
    )

    expect(result.sessions).toHaveLength(2)
    expect(new Date(result.sessions[1].start_time).getTime()).toBeGreaterThanOrEqual(new Date(result.sessions[0].end_time).getTime())
  })

  it('does not label sessions as revision for an exam that has already passed', () => {
    const result = generateWeeklyPlan(
      [{ id: 'math', name: 'Mathematics', difficulty: 'Medium', priority: 'Medium', weekly_target_minutes: 50, understanding_level: 50, color: '#6C5CE7' }],
      [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_available: true }],
      [],
      [{ subject_id: 'math', exam_date: '2026-11-15T12:00:00', importance: 'High', preparation_status: 0 }],
      new Date('2026-11-16T00:00:00'),
      50,
      0,
      300,
      new Date('2026-11-16T08:00:00'),
    )

    expect(result.sessions[0].session_type).toBe('Study')
  })
})
