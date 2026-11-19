import { describe, expect, it } from 'vitest'
import { generateWeeklyPlan } from '.'

describe('generateWeeklyPlan', () => {
  it('returns an empty state for no subjects', () => {
    const result = generateWeeklyPlan([], [], [], [], new Date('2026-11-16'))
    expect(result.sessions).toEqual([])
    expect(result.warning).toContain('at least one subject')
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
    )
    expect(result.warning).toContain('needs about')
  })
})
