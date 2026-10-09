import { ShiftAssignment, Officer, Patrol, ConflictAlert, ShiftDefinition } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';

/**
 * Finds all conflict alerts in the entire assignment database:
 * 1. Multiple working patrols on the same date for the same officer
 * 2. Overlapping shift hours
 * 3. Duplicate shifts
 * 4. Insufficient rest between night shift and morning shift
 */
export function detectAllConflicts(
  assignments: ShiftAssignment[],
  officers: Officer[],
  patrols: Patrol[]
): ConflictAlert[] {
  const alerts: ConflictAlert[] = [];
  const officerMap = new Map<string, Officer>(officers.map(o => [o.id, o]));
  const patrolMap = new Map<string, Patrol>(patrols.map(p => [p.id, p]));

  // Group by officerId and date
  const byOfficerAndDate = new Map<string, ShiftAssignment[]>();

  assignments.forEach(asg => {
    const key = `${asg.officerId}__${asg.date}`;
    if (!byOfficerAndDate.has(key)) {
      byOfficerAndDate.set(key, []);
    }
    byOfficerAndDate.get(key)!.push(asg);
  });

  // Evaluate each day's group
  byOfficerAndDate.forEach((dayAsgs, key) => {
    if (dayAsgs.length <= 1) return;

    const [officerId, date] = key.split('__');
    const officer = officerMap.get(officerId);
    const officerName = officer ? officer.name : `Efectivo ${officerId}`;

    // Filter to work shifts
    const workAsgs = dayAsgs.filter(a => {
      const def: ShiftDefinition | undefined = SHIFT_DEFINITIONS[a.shiftCode];
      return def && def.isWorkShift && a.patrolId !== null;
    });

    if (workAsgs.length > 1) {
      // Check if all are marked authorized double
      const allAuthorized = workAsgs.every(a => a.isAuthorizedDouble);
      if (allAuthorized) return;

      const distinctPatrolIds = new Set(workAsgs.map(a => a.patrolId).filter(Boolean));

      if (distinctPatrolIds.size > 1) {
        // Multi-patrol conflict on same day
        const patrolNames = Array.from(distinctPatrolIds)
          .map(pid => patrolMap.get(pid as string)?.code || pid)
          .join(' y ');

        const shiftCodes = workAsgs.map(a => `${a.shiftCode} (${patrolMap.get(a.patrolId!)?.code || 'Patrulla'})`).join(' + ');

        alerts.push({
          id: `conflict-multi-${key}`,
          type: 'multi_patrol',
          officerId,
          officerName,
          date,
          assignments: workAsgs,
          message: `${officerName} tiene turnos asignados en diferentes patrullas el ${date}: ${shiftCodes} (${patrolNames})`,
          severity: 'high'
        });
      } else {
        // Duplicate shifts in the same patrol
        alerts.push({
          id: `conflict-dup-${key}`,
          type: 'duplicate_shift',
          officerId,
          officerName,
          date,
          assignments: workAsgs,
          message: `${officerName} tiene más de un turno asignado el mismo día ${date}`,
          severity: 'warning'
        });
      }
    }
  });

  // Check insufficient rest (e.g., Night shift ending at 06:00 followed immediately by Morning at 06:00 next day)
  // Sort assignments by date
  officers.forEach(officer => {
    const officerAsgs = assignments
      .filter(a => a.officerId === officer.id && SHIFT_DEFINITIONS[a.shiftCode]?.isWorkShift)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 0; i < officerAsgs.length - 1; i++) {
      const current = officerAsgs[i];
      const next = officerAsgs[i + 1];

      // Check if next is consecutive day
      const currDate = new Date(current.date);
      const nextDate = new Date(next.date);
      const diffDays = Math.round((nextDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1 && current.shiftCode === 'N' && next.shiftCode === 'M') {
        alerts.push({
          id: `conflict-rest-${officer.id}-${current.date}`,
          type: 'insufficient_rest',
          officerId: officer.id,
          officerName: officer.name,
          date: next.date,
          assignments: [current, next],
          message: `Descanso insuficiente para ${officer.name}: Turno de Noche el ${current.date} seguido sin descanso por Turno de Mañana el ${next.date} (0h de reposo)`,
          severity: 'high'
        });
      }
    }
  });

  return alerts;
}

/**
 * Returns assignments for an officer on a specific date in ANY OTHER patrol
 */
export function getOtherPatrolAssignmentsForDay(
  officerId: string,
  date: string,
  currentPatrolId: string,
  assignments: ShiftAssignment[]
): ShiftAssignment[] {
  return assignments.filter(a => 
    a.officerId === officerId &&
    a.date === date &&
    a.patrolId !== null &&
    a.patrolId !== currentPatrolId &&
    SHIFT_DEFINITIONS[a.shiftCode]?.isWorkShift
  );
}

/**
 * Returns all assignments for an officer on a specific date
 */
export function getOfficerDayAssignments(
  officerId: string,
  date: string,
  assignments: ShiftAssignment[]
): ShiftAssignment[] {
  return assignments.filter(a => a.officerId === officerId && a.date === date);
}

/**
 * Check if assigning this shift will cause a conflict
 */
export function previewConflictRisk(
  officerId: string,
  date: string,
  targetPatrolId: string | null,
  targetShiftCode: string,
  existingAssignments: ShiftAssignment[],
  excludeAssignmentId?: string
): { hasConflict: boolean; reason?: string; conflictingAssignments: ShiftAssignment[] } {
  const isWorkShift = SHIFT_DEFINITIONS[targetShiftCode]?.isWorkShift;
  if (!isWorkShift || !targetPatrolId) {
    return { hasConflict: false, conflictingAssignments: [] };
  }

  const sameDayAsgs = existingAssignments.filter(a => 
    a.officerId === officerId &&
    a.date === date &&
    a.id !== excludeAssignmentId &&
    SHIFT_DEFINITIONS[a.shiftCode]?.isWorkShift
  );

  if (sameDayAsgs.length > 0) {
    const otherPatrols = sameDayAsgs.filter(a => a.patrolId && a.patrolId !== targetPatrolId);
    if (otherPatrols.length > 0) {
      return {
        hasConflict: true,
        reason: `El agente ya tiene un turno (${otherPatrols.map(a => a.shiftCode).join(',')}) asignado en otra patrulla este día.`,
        conflictingAssignments: sameDayAsgs
      };
    }
    return {
      hasConflict: true,
      reason: `El agente ya tiene asignado un turno en esta misma patrulla para esta fecha.`,
      conflictingAssignments: sameDayAsgs
    };
  }

  return { hasConflict: false, conflictingAssignments: [] };
}
