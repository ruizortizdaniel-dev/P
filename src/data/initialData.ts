import { Patrol, Officer, ShiftDefinition, ShiftAssignment, ShiftCode } from '../types/quadrant';

export const INITIAL_PATROLS: Patrol[] = [
  {
    id: 'p1',
    code: 'BCN-I',
    name: 'ADIF - Patrulla Barcelona I',
    serviceCode: '243043VCA01',
    callsign: 'Patrulla BCN 1',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    vehicle: 'Z-101 ADIF Móvil',
    zone: 'Destinatario: 243043 ADIF - Pl. Països Catalans, 1, 7',
    client: '138173 ADIF / 50 ILUNION SEGURIDAD',
    inspector: 'Pedro Pueyo Balboa',
    defaultDayHours: '06:00 - 18:00',
    defaultNightHours: '18:00 - 06:00'
  },
  {
    id: 'p2',
    code: 'BCN-II',
    name: 'ADIF - Patrulla Barcelona II',
    serviceCode: '242999VCA01',
    callsign: 'Patrulla BCN 2',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    vehicle: 'Z-202 ADIF Móvil',
    zone: 'Destinatario: 242999 ADIF - Pl. Països Catalans, 1, 7',
    client: '138173 ADIF / 50 ILUNION SEGURIDAD',
    inspector: 'Pedro Pueyo Balboa',
    defaultDayHours: '08:00 - 20:00',
    defaultNightHours: '20:00 - 08:00'
  },
  {
    id: 'p3',
    code: 'BCN-III',
    name: 'ADIF - Patrulla Barcelona III',
    serviceCode: '242999VCA02',
    callsign: 'Patrulla BCN 3',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    vehicle: 'Z-303 ADIF Móvil',
    zone: 'Destinatario: 242999 ADIF - Pl. Països Catalans, 1, 7',
    client: '138173 ADIF / 50 ILUNION SEGURIDAD',
    inspector: 'Pedro Pueyo Balboa',
    defaultDayHours: '07:00 - 19:00',
    defaultNightHours: '19:00 - 07:00'
  },
  {
    id: 'p4',
    code: 'BCN-IV',
    name: 'ADIF - Patrulla Barcelona IV (Refuerzo)',
    serviceCode: '243043VCA04',
    callsign: 'Patrulla BCN 4',
    color: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    vehicle: 'Z-404 ADIF Reserva',
    zone: 'Destinatario: 243043 ADIF - Cobertura Especial y Apoyo',
    client: '138173 ADIF / 50 ILUNION SEGURIDAD',
    inspector: 'Pedro Pueyo Balboa',
    defaultDayHours: '08:00 - 20:00',
    defaultNightHours: '20:00 - 08:00'
  }
];

export const SHIFT_DEFINITIONS: Record<string, ShiftDefinition> = {
  '18-06': {
    code: '18-06',
    label: '18:00 - 06:00',
    name: 'Noche BCN-I (12h)',
    startTime: '18:00',
    endTime: '06:00',
    hours: 12,
    isWorkShift: true,
    bgColor: 'bg-indigo-100/90',
    textColor: 'text-indigo-950',
    borderColor: 'border-indigo-300',
    description: 'Turno nocturno 18:00 a 06:00 (12 horas)'
  },
  '06-18': {
    code: '06-18',
    label: '06:00 - 18:00',
    name: 'Día BCN-I (12h)',
    startTime: '06:00',
    endTime: '18:00',
    hours: 12,
    isWorkShift: true,
    bgColor: 'bg-amber-100/90',
    textColor: 'text-amber-950',
    borderColor: 'border-amber-300',
    description: 'Turno diurno 06:00 a 18:00 (12 horas)'
  },
  '20-08': {
    code: '20-08',
    label: '20:00 - 08:00',
    name: 'Noche BCN-II (12h)',
    startTime: '20:00',
    endTime: '08:00',
    hours: 12,
    isWorkShift: true,
    bgColor: 'bg-purple-100/90',
    textColor: 'text-purple-950',
    borderColor: 'border-purple-300',
    description: 'Turno nocturno 20:00 a 08:00 (12 horas)'
  },
  '08-20': {
    code: '08-20',
    label: '08:00 - 20:00',
    name: 'Día BCN-II (12h)',
    startTime: '08:00',
    endTime: '20:00',
    hours: 12,
    isWorkShift: true,
    bgColor: 'bg-emerald-100/90',
    textColor: 'text-emerald-950',
    borderColor: 'border-emerald-300',
    description: 'Turno diurno 08:00 a 20:00 (12 horas)'
  },
  '07-19': {
    code: '07-19',
    label: '07:00 - 19:00',
    name: 'Día BCN-III (12h)',
    startTime: '07:00',
    endTime: '19:00',
    hours: 12,
    isWorkShift: true,
    bgColor: 'bg-sky-100/90',
    textColor: 'text-sky-950',
    borderColor: 'border-sky-300',
    description: 'Turno diurno 07:00 a 19:00 (12 horas)'
  },
  'M': {
    code: 'M',
    label: '06:00 - 14:00',
    name: 'Mañana (8h)',
    startTime: '06:00',
    endTime: '14:00',
    hours: 8,
    isWorkShift: true,
    bgColor: 'bg-amber-100/80',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-300',
    description: 'Turno mañana ordinario (8 horas)'
  },
  'T': {
    code: 'T',
    label: '14:00 - 22:00',
    name: 'Tarde (8h)',
    startTime: '14:00',
    endTime: '22:00',
    hours: 8,
    isWorkShift: true,
    bgColor: 'bg-orange-100/80',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-300',
    description: 'Turno tarde ordinario (8 horas)'
  },
  'N': {
    code: 'N',
    label: '22:00 - 06:00',
    name: 'Noche (8h)',
    startTime: '22:00',
    endTime: '06:00',
    hours: 8,
    isWorkShift: true,
    bgColor: 'bg-blue-100/80',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-300',
    description: 'Turno nocturno ordinario (8 horas)'
  },
  'L': {
    code: 'L',
    label: 'Libre',
    name: 'Descanso',
    startTime: '-',
    endTime: '-',
    hours: 0,
    isWorkShift: false,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    description: 'Descanso semanal'
  },
  'V': {
    code: 'V',
    label: 'Vacaciones (5,2h)',
    name: 'Vacaciones (5,2h)',
    startTime: '-',
    endTime: '-',
    hours: 5.2,
    isWorkShift: false,
    bgColor: 'bg-teal-100/90',
    textColor: 'text-teal-950',
    borderColor: 'border-teal-400',
    description: 'Vacaciones reglamentarias (cómputo oficial de 5,2 horas/día)'
  },
  'B': {
    code: 'B',
    label: 'Baja',
    name: 'Baja Médica',
    startTime: '-',
    endTime: '-',
    hours: 0,
    isWorkShift: false,
    bgColor: 'bg-rose-100/80',
    textColor: 'text-rose-900',
    borderColor: 'border-rose-300',
    description: 'Incapacidad temporal'
  },
  'AP': {
    code: 'AP',
    label: 'Asuntos Propios',
    name: 'Asuntos Propios',
    startTime: '-',
    endTime: '-',
    hours: 0,
    isWorkShift: false,
    bgColor: 'bg-cyan-100/80',
    textColor: 'text-cyan-900',
    borderColor: 'border-cyan-300',
    description: 'Permiso asuntos propios'
  }
};

export const INITIAL_OFFICERS: Officer[] = [
  // --- PATRULLA BARCELONA I (Servicio 243043VCA01) ---
  {
    id: 'of-ponce',
    badgeNumber: '101.653',
    name: 'PONCE MORALES, MARIA LOURDES',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 01',
    email: 'lourdes.ponce@ilunion.com'
  },
  {
    id: 'of-ventura',
    badgeNumber: '149.334',
    name: 'VENTURA DE SANTIAGO, DOMENEC',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 02',
    email: 'domenec.ventura@ilunion.com'
  },
  {
    id: 'of-carballar',
    badgeNumber: '242.055',
    name: 'CARBALLAR HERMOSO, NEIL',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 03',
    email: 'neil.carballar@ilunion.com'
  },
  {
    id: 'of-fuentes',
    badgeNumber: '242.058',
    name: 'FUENTES PALMA, DAVID',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 04',
    email: 'david.fuentes@ilunion.com'
  },
  {
    id: 'of-monteagudo',
    badgeNumber: '242.835',
    name: 'MONTEAGUDO FAJARDO, ALEJANDRO',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 05',
    email: 'alejandro.monteagudo@ilunion.com'
  },
  {
    id: 'of-roldan',
    badgeNumber: '242.868',
    name: 'ROLDAN VALVERDE, FRANCISCO MANUEL',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 06',
    email: 'francisco.roldan@ilunion.com'
  },
  {
    id: 'of-gonzalez-garcia',
    badgeNumber: '242.897',
    name: 'GONZALEZ GARCIA, MANUEL',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 07',
    email: 'manuel.gonzalez@ilunion.com'
  },
  {
    id: 'of-navarro-conde',
    badgeNumber: '242.918',
    name: 'NAVARRO CONDE, SERGIO',
    rank: 'Vigilante',
    defaultPatrolId: 'p1',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 11 08',
    email: 'sergio.navarro@ilunion.com'
  },

  // --- PATRULLA BARCELONA II (Servicio 242999VCA01) ---
  {
    id: 'of-valledepaz',
    badgeNumber: '73.711',
    name: 'VALLEDEPAZ SAMITIER, JOSE LUIS',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 01',
    email: 'joseluis.valledepaz@ilunion.com'
  },
  {
    id: 'of-leva',
    badgeNumber: '75.296',
    name: 'LEVA LARA, PEDRO',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 02',
    email: 'pedro.leva@ilunion.com'
  },
  {
    id: 'of-gimenez',
    badgeNumber: '155.672',
    name: 'GIMENEZ LLAMAS, ANTONIO',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 03',
    email: 'antonio.gimenez@ilunion.com'
  },
  {
    id: 'of-lopez-avila',
    badgeNumber: '220.570',
    name: 'LOPEZ AVILA, ALEJANDRO',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 04',
    email: 'alejandro.lopez@ilunion.com'
  },
  {
    id: 'of-mosquera',
    badgeNumber: '234.874',
    name: 'MOSQUERA SAEZ, FRANCISCO DANIEL',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 05',
    email: 'francisco.mosquera@ilunion.com'
  },
  {
    id: 'of-iglesias',
    badgeNumber: '241.692',
    name: 'IGLESIAS FORTES, MARIA DEL CARMEN',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 06',
    email: 'carmen.iglesias@ilunion.com'
  },
  {
    id: 'of-ruiz-ortiz',
    badgeNumber: '242.045',
    name: 'RUIZ ORTIZ, DANIEL',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 678 12 34 56',
    email: 'ruiz.ortiz.daniel@gmail.com',
    notes: 'Vigilante Patrulla Barcelona II (204,00h)'
  },
  {
    id: 'of-nunez',
    badgeNumber: '242.818',
    name: 'NUÑEZ MORENO, CARLOS JAVIER',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 08',
    email: 'carlos.nunez@ilunion.com'
  },
  {
    id: 'of-gonzalez-gonzalez',
    badgeNumber: '242.896',
    name: 'GONZALEZ GONZALEZ, MANUEL',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 09',
    email: 'manuel.gonzalezg@ilunion.com'
  },
  {
    id: 'of-villalta',
    badgeNumber: '258.232',
    name: 'VILLALTA TIRSO, ROSA',
    rank: 'Vigilante',
    defaultPatrolId: 'p2',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 12 10',
    email: 'rosa.villalta@ilunion.com'
  },

  // --- PATRULLA BARCELONA III (Servicio 242999VCA02) ---
  {
    id: 'of-jimenez',
    badgeNumber: '243.432',
    name: 'JIMENEZ RUIZ, XAVIER',
    rank: 'Vigilante',
    defaultPatrolId: 'p3',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 13 01',
    email: 'xavier.jimenez@ilunion.com'
  },
  {
    id: 'of-ojeda',
    badgeNumber: '248.879',
    name: 'OJEDA PUYOLES, AARON',
    rank: 'Vigilante',
    defaultPatrolId: 'p3',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 13 02',
    email: 'aaron.ojeda@ilunion.com'
  },
  {
    id: 'of-sanchez',
    badgeNumber: '258.897',
    name: 'SANCHEZ FERNANDEZ, VICTOR',
    rank: 'Vigilante',
    defaultPatrolId: 'p3',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 13 03',
    email: 'victor.sanchez@ilunion.com'
  },
  {
    id: 'of-valverde',
    badgeNumber: '259.906',
    name: 'VALVERDE BELLMUNT, ALEIX',
    rank: 'Vigilante',
    defaultPatrolId: 'p3',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 13 04',
    email: 'aleix.valverde@ilunion.com'
  },

  // --- EFECTIVO POLIVALENTE / COMPARTIDO ENTRE PATRULLAS ---
  {
    id: 'of-zuarez',
    badgeNumber: '80.085.741.823',
    name: 'CATALUÑA ADIF 29, ZUAREZ',
    rank: 'Vigilante',
    defaultPatrolId: 'p3',
    company: '50 - ILUNION SEGURIDAD, S.A.',
    delegation: '08',
    phone: '+34 612 30 13 05',
    email: 'cataluna.adif29@ilunion.com',
    notes: 'Servicios en Patrulla Barcelona I, II y III (Total 204h)'
  }
];

export function generateSeedAssignments(): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const year = 2026;
  const month = 10;

  const makeDate = (day: number) => 
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const addShift = (
    officerId: string, 
    day: number, 
    patrolId: 'p1' | 'p2' | 'p3' | 'p4', 
    shiftCode: ShiftCode
  ) => {
    const def = SHIFT_DEFINITIONS[shiftCode];
    assignments.push({
      id: `asg-${officerId}-${day}-${patrolId}-${shiftCode}`,
      officerId,
      date: makeDate(day),
      shiftCode,
      patrolId,
      startTime: def.startTime,
      endTime: def.endTime,
      hours: def.hours,
      role: 'Vigilante de Seguridad'
    });
  };

  // ==========================================
  // 1. PATRULLA BARCELONA I (Servicio 243043VCA01)
  // ==========================================

  // PONCE MORALES, MARIA LOURDES (156h = 13 shifts 18:00-06:00)
  [2, 3, 4, 7, 13, 14, 19, 20, 23, 24, 25, 28, 29].forEach(d => {
    addShift('of-ponce', d, 'p1', '18-06');
  });

  // VENTURA DE SANTIAGO, DOMENEC (192h = 16 shifts 18:00-06:00)
  [1, 4, 5, 9, 10, 11, 12, 16, 17, 18, 22, 23, 26, 27, 28, 31].forEach(d => {
    addShift('of-ventura', d, 'p1', '18-06');
  });

  // CARBALLAR HERMOSO, NEIL (168h = 14 shifts 06:00-18:00)
  [3, 4, 7, 8, 12, 13, 16, 18, 21, 22, 26, 27, 30, 31].forEach(d => {
    addShift('of-carballar', d, 'p1', '06-18');
  });

  // FUENTES PALMA, DAVID (204h = 17 shifts 18:00-06:00)
  [1, 3, 4, 7, 8, 12, 13, 14, 16, 17, 18, 21, 22, 26, 27, 30, 31].forEach(d => {
    addShift('of-fuentes', d, 'p1', '18-06');
  });

  // MONTEAGUDO FAJARDO, ALEJANDRO (192h = 16 shifts 06:00-18:00)
  [1, 2, 5, 6, 9, 10, 11, 13, 14, 19, 20, 23, 24, 25, 28, 29].forEach(d => {
    addShift('of-monteagudo', d, 'p1', '06-18');
  });

  // ROLDAN VALVERDE, FRANCISCO MANUEL (192h = 16 shifts 18:00-06:00)
  [1, 5, 6, 8, 9, 10, 11, 12, 14, 19, 20, 23, 24, 25, 29, 30].forEach(d => {
    addShift('of-roldan', d, 'p1', '18-06');
  });

  // GONZALEZ GARCIA, MANUEL (192h = 16 shifts 06:00-18:00)
  [1, 2, 3, 4, 7, 8, 12, 13, 16, 17, 18, 21, 22, 26, 27, 31].forEach(d => {
    addShift('of-gonzalez-garcia', d, 'p1', '06-18');
  });

  // NAVARRO CONDE, SERGIO (180h = 15 shifts 06:00-18:00)
  [5, 6, 9, 10, 11, 14, 15, 19, 20, 23, 24, 25, 28, 29, 30].forEach(d => {
    addShift('of-navarro-conde', d, 'p1', '06-18');
  });

  // CATALUÑA ADIF 29, ZUAREZ en Patrulla Barcelona I (12h = 1 shift 06:00-18:00)
  [16].forEach(d => {
    addShift('of-zuarez', d, 'p1', '06-18');
  });

  // ==========================================
  // 2. PATRULLA BARCELONA II (Servicio 242999VCA01)
  // ==========================================

  // VALLEDEPAZ SAMITIER, JOSE LUIS (120h = 10 shifts 20:00-08:00)
  [1, 5, 6, 7, 9, 10, 11, 12, 14, 15].forEach(d => {
    addShift('of-valledepaz', d, 'p2', '20-08');
  });

  // LEVA LARA, PEDRO (192h = 16 shifts 20:00-08:00)
  [1, 4, 7, 8, 11, 13, 14, 16, 17, 18, 19, 23, 24, 25, 27, 28].forEach(d => {
    addShift('of-leva', d, 'p2', '20-08');
  });

  // GIMENEZ LLAMAS, ANTONIO (24h = 2 shifts 08:00-20:00)
  [26, 29].forEach(d => {
    addShift('of-gimenez', d, 'p2', '08-20');
  });

  // LOPEZ AVILA, ALEJANDRO (192h = 16 shifts 08:00-20:00)
  [3, 4, 5, 6, 9, 10, 11, 12, 18, 19, 20, 24, 25, 26, 30, 31].forEach(d => {
    addShift('of-lopez-avila', d, 'p2', '08-20');
  });

  // MOSQUERA SAEZ, FRANCISCO DANIEL (132h = 9 shifts 08-20 + 2 shifts 20-08)
  [1, 2, 3, 7, 8, 9, 14, 15, 18].forEach(d => {
    addShift('of-mosquera', d, 'p2', '08-20');
  });
  [23, 24].forEach(d => {
    addShift('of-mosquera', d, 'p2', '20-08');
  });

  // IGLESIAS FORTES, MARIA DEL CARMEN (36h = 3 shifts 08:00-20:00)
  [4, 20, 25].forEach(d => {
    addShift('of-iglesias', d, 'p2', '08-20');
  });

  // RUIZ ORTIZ, DANIEL (204h = 17 shifts 20:00-08:00)
  [2, 3, 4, 6, 7, 8, 12, 13, 16, 17, 18, 19, 21, 22, 25, 26, 28].forEach(d => {
    addShift('of-ruiz-ortiz', d, 'p2', '20-08');
  });

  // NUÑEZ MORENO, CARLOS JAVIER (132h = 11 shifts 08:00-20:00)
  [14, 15, 16, 17, 21, 22, 26, 27, 28, 29, 30].forEach(d => {
    addShift('of-nunez', d, 'p2', '08-20');
  });

  // GONZALEZ GONZALEZ, MANUEL (192h = 16 shifts 08:00-20:00)
  [1, 2, 5, 6, 7, 8, 12, 13, 14, 17, 18, 21, 22, 23, 24, 25].forEach(d => {
    addShift('of-gonzalez-gonzalez', d, 'p2', '08-20');
  });

  // VILLALTA TIRSO, ROSA (180h = 15 shifts 20:00-08:00)
  [2, 3, 4, 10, 11, 13, 19, 20, 21, 22, 25, 26, 27, 29, 30].forEach(d => {
    addShift('of-villalta', d, 'p2', '20-08');
  });

  // CATALUÑA ADIF 29, ZUAREZ en Patrulla Barcelona II (60h = 5 shifts 08:00-20:00)
  [9, 10, 18, 27, 28].forEach(d => {
    addShift('of-zuarez', d, 'p2', '08-20');
  });

  // ==========================================
  // 3. PATRULLA BARCELONA III (Servicio 242999VCA02)
  // ==========================================

  // JIMENEZ RUIZ, XAVIER (180h = 15 shifts 07:00-19:00)
  [1, 2, 7, 8, 9, 10, 11, 14, 15, 19, 20, 21, 26, 27, 28].forEach(d => {
    addShift('of-jimenez', d, 'p3', '07-19');
  });

  // OJEDA PUYOLES, AARON (96h = 8 shifts 07:00-19:00)
  [1, 2, 5, 6, 9, 10, 11, 27].forEach(d => {
    addShift('of-ojeda', d, 'p3', '07-19');
  });

  // SANCHEZ FERNANDEZ, VICTOR (168h = 14 shifts 07:00-19:00)
  [3, 4, 5, 12, 13, 16, 17, 18, 23, 24, 25, 29, 30, 31].forEach(d => {
    addShift('of-sanchez', d, 'p3', '07-19');
  });

  // VALVERDE BELLMUNT, ALEIX (168h = 14 shifts 07:00-19:00)
  [3, 4, 5, 12, 13, 16, 17, 18, 23, 24, 25, 29, 30, 31].forEach(d => {
    addShift('of-valverde', d, 'p3', '07-19');
  });

  // CATALUÑA ADIF 29, ZUAREZ en Patrulla Barcelona III (132h = 11 shifts 07:00-19:00)
  [5, 6, 7, 8, 14, 15, 19, 20, 21, 26, 27].forEach(d => {
    addShift('of-zuarez', d, 'p3', '07-19');
  });

  return assignments;
}

export const INITIAL_INCIDENTS: import('../types/quadrant').Incident[] = [
  {
    id: 'inc-01',
    timestamp: '2026-10-06T22:30:00.000Z',
    reporterEmail: 'ruiz.ortiz.daniel@gmail.com',
    reporterName: 'Daniel Ruiz Ortiz',
    reporterBadge: '242.045',
    patrolId: 'p2',
    type: 'intrusion',
    title: 'Intrusión en vía técnica mango Castelldefels',
    location: 'Estación Castelldefels Platja - Aguja 4',
    pk: 'PK 652+300',
    description: 'Se detectan 2 personas transitando por la zona de balasto sin chaleco ni autorización. Se procede a su identificación y desalojo fuera del recinto ferroviario.',
    actionsTaken: 'Identificación realizada, aviso a CECOM ADIF y desalojo sin afección al tráfico ferroviario.',
    severity: 'media',
    status: 'resuelta',
    resolvedAt: '2026-10-06T23:15:00.000Z'
  },
  {
    id: 'inc-02',
    timestamp: '2026-10-07T03:45:00.000Z',
    reporterEmail: 'lourdes.ponce@ilunion.com',
    reporterName: 'PONCE MORALES, MARIA LOURDES',
    reporterBadge: '101.653',
    patrolId: 'p1',
    type: 'grafiti',
    title: 'Detección preventiva intento de grafiti en unidad 447',
    location: 'Estación Gavà - Vía 3 de estacionamiento',
    pk: 'PK 657+100',
    description: 'Durante la ronda de vigilancia perimetral se observan 3 botes de pintura en el muro perimetral. Se refuerza vigilancia en la cabeza del tren.',
    actionsTaken: 'Retirada de material, inspección de cerramientos y patrullaje intensivo.',
    severity: 'alta',
    status: 'en_curso'
  },
  {
    id: 'inc-03',
    timestamp: '2026-10-07T08:10:00.000Z',
    reporterEmail: 'domenec.ventura@ilunion.com',
    reporterName: 'VENTURA DE SANTIAGO, DOMENEC',
    reporterBadge: '149.334',
    patrolId: 'p1',
    type: 'averia_infraestructura',
    title: 'Cerramiento metálico forzado en tramo Bellvitge',
    location: 'Línea 200 - Tramo Bellvitge a El Prat',
    pk: 'PK 669+850',
    description: 'Apertura no autorizada en malla de protección de vía (aproximadamente 2 metros cortados). Riesgo de paso de personas o animales.',
    actionsTaken: 'Balizamiento provisional de urgencia y aviso inmediato a Mantenimiento de Infraestructura ADIF.',
    severity: 'alta',
    status: 'abierta'
  }
];
