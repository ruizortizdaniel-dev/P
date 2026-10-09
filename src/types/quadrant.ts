export type PatrolId = 'p1' | 'p2' | 'p3' | 'p4';

export interface Patrol {
  id: PatrolId;
  code: string; // e.g. 'BCN-I', 'BCN-II', 'BCN-III', 'BCN-IV'
  name: string; // e.g. 'ADIF - Patrulla Barcelona I'
  serviceCode: string; // e.g. '243043VCA01'
  callsign: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  vehicle: string;
  zone: string;
  client: string; // 'ADIF - ILUNION SEGURIDAD'
  inspector: string; // 'Pedro Pueyo Balboa'
  defaultDayHours: string; // e.g. '06:00 - 18:00'
  defaultNightHours: string; // e.g. '18:00 - 06:00'
}

export type ShiftCode = 
  | '06-18' 
  | '18-06' 
  | '08-20' 
  | '20-08' 
  | '07-19' 
  | 'D' 
  | 'N' 
  | 'M' 
  | 'T' 
  | 'R' 
  | 'L' 
  | 'V' 
  | 'AP' 
  | 'B' 
  | 'JU';

export interface ShiftDefinition {
  code: ShiftCode;
  label: string;
  name: string;
  startTime: string;
  endTime: string;
  hours: number;
  isWorkShift: boolean;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export interface Officer {
  id: string;
  badgeNumber: string; // e.g. '242.045'
  name: string; // e.g. 'RUIZ ORTIZ, DANIEL'
  rank: 'Vigilante' | 'Jefe de Equipo' | 'Inspector';
  defaultPatrolId: PatrolId;
  company: string; // '50 - ILUNION SEGURIDAD, S.A.'
  delegation: string; // '08'
  phone?: string;
  email?: string;
  notes?: string;
}

export interface ShiftAssignment {
  id: string;
  officerId: string;
  date: string; // YYYY-MM-DD
  shiftCode: ShiftCode;
  patrolId: PatrolId | null; // null for leaves
  startTime: string;
  endTime: string;
  hours: number;
  role?: string;
  notes?: string;
  isAuthorizedDouble?: boolean;
}

export type ConflictType = 
  | 'multi_patrol'       // Assigned to 2 different patrols on the same date
  | 'duplicate_shift'     // Assigned to multiple shifts of same patrol
  | 'insufficient_rest'  // Night shift followed immediately by day shift (< 8h rest)
  | 'hour_overlap';      // Overlapping start and end times

export interface ConflictAlert {
  id: string;
  type: ConflictType;
  officerId: string;
  officerName: string;
  date: string;
  assignments: ShiftAssignment[];
  message: string;
  severity: 'high' | 'warning';
}

export type ViewMode = 'patrol' | 'individual' | 'global' | 'conflicts';

export interface AppUser {
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  officerId?: string;
  badgeNumber?: string;
  defaultPatrolId?: PatrolId;
}

export type IncidentType = 
  | 'intrusion'
  | 'grafiti'
  | 'averia_infraestructura'
  | 'robo_material'
  | 'orden_publico'
  | 'identificacion'
  | 'control_acceso'
  | 'otra';

export type IncidentSeverity = 'baja' | 'media' | 'alta' | 'critica';
export type IncidentStatus = 'abierta' | 'en_curso' | 'resuelta';

export interface Incident {
  id: string;
  timestamp: string;
  reporterEmail: string;
  reporterName: string;
  reporterBadge?: string;
  patrolId: PatrolId;
  type: IncidentType;
  title: string;
  location: string;
  pk?: string;
  description: string;
  actionsTaken?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  resolvedAt?: string;
}
