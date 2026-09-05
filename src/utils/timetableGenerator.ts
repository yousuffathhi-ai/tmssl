import { SchoolClass, Teacher, SubjectAllocation, TimetableSlot, DayOfWeek, TimetableConflict } from '../types';
import { DAYS_OF_WEEK } from '../data/sriLankaEduData';

export function generateIntelligentTimetable(
  classes: SchoolClass[],
  teachers: Teacher[],
  allocations: SubjectAllocation[]
): { slots: TimetableSlot[]; conflicts: TimetableConflict[] } {
  const slots: TimetableSlot[] = [];
  const conflicts: TimetableConflict[] = [];

  if (classes.length === 0 || allocations.length === 0) {
    return { slots, conflicts };
  }

  // Tracking maps to prevent collisions
  // key: `${day}_${periodIndex}_${teacherId}` -> true
  const teacherBusy = new Set<string>();
  // key: `${day}_${periodIndex}_${classId}` -> true
  const classBusy = new Set<string>();
  // key: `${day}_${teacherId}` -> count of periods
  const teacherDailyCount: Record<string, number> = {};

  // Expand allocations into individual period tokens
  type SubjectToken = {
    classId: string;
    teacherId: string;
    subjectName: string;
    room?: string;
    isDouble: boolean;
  };

  const tokens: SubjectToken[] = [];

  allocations.forEach(alloc => {
    let remaining = alloc.weeklyPeriods;
    const cls = classes.find(c => c.id === alloc.classId);
    const room = alloc.specialRoomRequired || cls?.room || 'Classroom';

    // Handle potential double periods if weekly periods >= 4
    if (alloc.isDoublePeriodAllowed && remaining >= 2) {
      tokens.push({
        classId: alloc.classId,
        teacherId: alloc.teacherId,
        subjectName: alloc.subjectName,
        room,
        isDouble: true,
      });
      remaining -= 2;
    }

    while (remaining > 0) {
      tokens.push({
        classId: alloc.classId,
        teacherId: alloc.teacherId,
        subjectName: alloc.subjectName,
        room,
        isDouble: false,
      });
      remaining--;
    }
  });

  // Sort tokens: prioritize subjects with special rooms or teachers with tight limits
  tokens.sort((a, b) => {
    if (a.isDouble !== b.isDouble) return a.isDouble ? -1 : 1;
    return a.subjectName.localeCompare(b.subjectName);
  });

  // Schedule tokens across Monday-Friday, periods 1 to 8
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  tokens.forEach((token, tokenIdx) => {
    let placed = false;

    // Shuffle days starting point per token to distribute evenly
    const dayOrder = [...DAYS_OF_WEEK].sort(() => 0.5 - Math.random());

    for (const day of dayOrder) {
      if (placed) break;

      // Check teacher daily cap
      const teacherKeyDay = `${day}_${token.teacherId}`;
      const currentTeacherDayPeriods = teacherDailyCount[teacherKeyDay] || 0;
      const teacher = teachers.find(t => t.id === token.teacherId);
      const maxDaily = teacher?.maxPeriodsPerDay || 5;

      if (currentTeacherDayPeriods >= maxDaily) {
        continue;
      }

      if (token.isDouble) {
        // Double period needs two consecutive slots on the same day, avoiding crossing the interval (interval is after period 4)
        const validDoublePairs = [
          [1, 2],
          [2, 3],
          [5, 6],
          [6, 7],
          [7, 8],
        ];

        for (const [p1, p2] of validDoublePairs) {
          const tKey1 = `${day}_${p1}_${token.teacherId}`;
          const tKey2 = `${day}_${p2}_${token.teacherId}`;
          const cKey1 = `${day}_${p1}_${token.classId}`;
          const cKey2 = `${day}_${p2}_${token.classId}`;

          if (
            !teacherBusy.has(tKey1) &&
            !teacherBusy.has(tKey2) &&
            !classBusy.has(cKey1) &&
            !classBusy.has(cKey2)
          ) {
            // Place double period
            teacherBusy.add(tKey1);
            teacherBusy.add(tKey2);
            classBusy.add(cKey1);
            classBusy.add(cKey2);
            teacherDailyCount[teacherKeyDay] = (teacherDailyCount[teacherKeyDay] || 0) + 2;

            slots.push({
              id: `slot_${tokenIdx}_1`,
              day,
              periodIndex: p1,
              classId: token.classId,
              subjectName: token.subjectName,
              teacherId: token.teacherId,
              room: token.room,
              isDoublePeriod: true,
            });

            slots.push({
              id: `slot_${tokenIdx}_2`,
              day,
              periodIndex: p2,
              classId: token.classId,
              subjectName: token.subjectName,
              teacherId: token.teacherId,
              room: token.room,
              isDoublePeriod: true,
            });

            placed = true;
            break;
          }
        }
      } else {
        // Single period placement
        for (const p of periods) {
          const tKey = `${day}_${p}_${token.teacherId}`;
          const cKey = `${day}_${p}_${token.classId}`;

          if (!teacherBusy.has(tKey) && !classBusy.has(cKey)) {
            teacherBusy.add(tKey);
            classBusy.add(cKey);
            teacherDailyCount[teacherKeyDay] = (teacherDailyCount[teacherKeyDay] || 0) + 1;

            slots.push({
              id: `slot_${tokenIdx}`,
              day,
              periodIndex: p,
              classId: token.classId,
              subjectName: token.subjectName,
              teacherId: token.teacherId,
              room: token.room,
              isDoublePeriod: false,
            });

            placed = true;
            break;
          }
        }
      }
    }

    if (!placed) {
      conflicts.push({
        id: `conf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'TEACHER_DOUBLE_BOOKING',
        day: 'Monday',
        periodIndex: 1,
        description: `Could not place period for ${token.subjectName} without exceeding teacher daily limit or causing a collision. Consider adding an alternate teacher or adjusting weekly periods.`,
        message: `Could not place period for ${token.subjectName} without exceeding teacher daily limit or causing a collision.`,
        severity: 'warning',
      });
    }
  });

  return { slots, conflicts };
}

/**
 * Generates conflict-free timetable from user-configured SubjectRules, Classes, Teachers, and Bell Schedule
 */
export function generateTimetableFromRules(
  classes: import('../types').ClassSection[],
  teachers: import('../types').TeacherRecord[],
  rules: import('../types').SubjectRule[],
  bellSchedule: import('../types').BellSchedule
): { slots: TimetableSlot[]; conflicts: TimetableConflict[] } {
  const slots: TimetableSlot[] = [];
  const conflicts: TimetableConflict[] = [];

  if (classes.length === 0 || rules.length === 0) {
    return { slots, conflicts };
  }

  const teacherBusy = new Set<string>();
  const classBusy = new Set<string>();
  const teacherDailyCount: Record<string, number> = {};

  type Token = {
    ruleId: string;
    classId: string;
    teacherId: string;
    subject: string;
    room: string;
    isDouble: boolean;
  };

  const tokens: Token[] = [];

  rules.forEach((rule) => {
    let remaining = rule.periods_per_week;
    const cls = classes.find((c) => c.id === rule.class_id);
    const room = cls?.room || 'Classroom';

    if (rule.needs_double_period && remaining >= 2) {
      tokens.push({
        ruleId: rule.id,
        classId: rule.class_id,
        teacherId: rule.teacher_id,
        subject: rule.subject,
        room,
        isDouble: true,
      });
      remaining -= 2;
    }

    while (remaining > 0) {
      tokens.push({
        ruleId: rule.id,
        classId: rule.class_id,
        teacherId: rule.teacher_id,
        subject: rule.subject,
        room,
        isDouble: false,
      });
      remaining--;
    }
  });

  // Sort: double periods first
  tokens.sort((a, b) => (a.isDouble === b.isDouble ? 0 : a.isDouble ? -1 : 1));

  const totalPeriods = bellSchedule.periods_per_day || 8;
  const breakAfter = bellSchedule.breaks_after_periods || 3;

  // Generate valid consecutive pairs for double periods that do NOT cross the break
  const validDoublePairs: [number, number][] = [];
  for (let p = 1; p < totalPeriods; p++) {
    if (p !== breakAfter) {
      validDoublePairs.push([p, p + 1]);
    }
  }

  tokens.forEach((token, idx) => {
    let placed = false;
    const teacher = teachers.find((t) => t.id === token.teacherId);
    const offDaysText = (teacher?.off_days || '').toLowerCase();
    const maxDaily = teacher?.max_periods_per_day || 6;

    // Distribute across days
    const dayList = [...DAYS_OF_WEEK].sort(() => 0.5 - Math.random());

    for (const day of dayList) {
      if (placed) break;

      // Check if teacher is off on this day
      const dayShort = day.substring(0, 3).toLowerCase();
      if (offDaysText.includes(dayShort) || offDaysText.includes(day.toLowerCase())) {
        continue;
      }

      const teacherDayKey = `${day}_${token.teacherId}`;
      const teacherCurrent = teacherDailyCount[teacherDayKey] || 0;
      if (teacherCurrent >= maxDaily) {
        continue;
      }

      if (token.isDouble) {
        if (teacherCurrent + 2 > maxDaily) continue;

        for (const [p1, p2] of validDoublePairs) {
          const tKey1 = `${day}_${p1}_${token.teacherId}`;
          const tKey2 = `${day}_${p2}_${token.teacherId}`;
          const cKey1 = `${day}_${p1}_${token.classId}`;
          const cKey2 = `${day}_${p2}_${token.classId}`;

          if (
            !teacherBusy.has(tKey1) &&
            !teacherBusy.has(tKey2) &&
            !classBusy.has(cKey1) &&
            !classBusy.has(cKey2)
          ) {
            teacherBusy.add(tKey1);
            teacherBusy.add(tKey2);
            classBusy.add(cKey1);
            classBusy.add(cKey2);
            teacherDailyCount[teacherDayKey] = teacherCurrent + 2;

            slots.push({
              id: `slot_d1_${idx}_${p1}`,
              day,
              periodIndex: p1,
              classId: token.classId,
              subjectName: token.subject,
              teacherId: token.teacherId,
              room: token.room,
              isDoublePeriod: true,
            });

            slots.push({
              id: `slot_d2_${idx}_${p2}`,
              day,
              periodIndex: p2,
              classId: token.classId,
              subjectName: token.subject,
              teacherId: token.teacherId,
              room: token.room,
              isDoublePeriod: true,
            });

            placed = true;
            break;
          }
        }
      } else {
        for (let p = 1; p <= totalPeriods; p++) {
          const tKey = `${day}_${p}_${token.teacherId}`;
          const cKey = `${day}_${p}_${token.classId}`;

          if (!teacherBusy.has(tKey) && !classBusy.has(cKey)) {
            teacherBusy.add(tKey);
            classBusy.add(cKey);
            teacherDailyCount[teacherDayKey] = teacherCurrent + 1;

            slots.push({
              id: `slot_s_${idx}_${p}`,
              day,
              periodIndex: p,
              classId: token.classId,
              subjectName: token.subject,
              teacherId: token.teacherId,
              room: token.room,
              isDoublePeriod: false,
            });

            placed = true;
            break;
          }
        }
      }
    }

    if (!placed) {
      const cls = classes.find((c) => c.id === token.classId);
      conflicts.push({
        id: `conf_${Date.now()}_${idx}`,
        type: 'TEACHER_DOUBLE_BOOKING',
        day: 'Monday',
        periodIndex: 1,
        description: `Could not schedule ${token.subject} for ${cls?.name || 'Class'} with ${teacher?.name || 'Teacher'}. Limits or off-days full.`,
        message: `Could not schedule ${token.subject} for ${cls?.name || 'Class'}`,
        severity: 'warning',
      });
    }
  });

  return { slots, conflicts };
}
