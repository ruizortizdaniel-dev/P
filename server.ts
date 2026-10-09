import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import PDFDocument from 'pdfkit';
import { GoogleGenAI } from '@google/genai';
import { ADIF_RAILWAY_DICTIONARY } from './src/data/adifRailwayDictionary.ts';
import { parseKmzOrKmlBuffer } from './src/utils/serverKmzParser.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEEDS_FILE = path.join(DATA_DIR, 'seeds.json');

// Allowed administrator emails strictly specified by the user
const ALLOWED_ADMINS: Record<string, { name: string; defaultRank: string }> = {
  'ruiz.ortiz.daniel@gmail.com': {
    name: 'Daniel Ruiz Ortiz',
    defaultRank: 'Administrador / Inspector'
  },
  'sergio80bcn@gmail.com': {
    name: 'Sergio Navarro Conde',
    defaultRank: 'Administrador / Supervisor'
  },
  'alejandrolopezavila1974ctsd@gmail.com': {
    name: 'Alejandro López Ávila',
    defaultRank: 'Administrador / Coordinador'
  }
};

interface ShiftAssignment {
  id: string;
  officerId: string;
  date: string;
  shiftCode: string;
  patrolId: string | null;
  startTime: string;
  endTime: string;
  hours: number;
  role?: string;
  notes?: string;
  isAuthorizedDouble?: boolean;
}

interface Patrol {
  id: string;
  code: string;
  name: string;
  serviceCode: string;
  callsign: string;
  color: string;
  vehicle: string;
  zone: string;
  client: string;
  inspector: string;
  defaultDayHours: string;
  defaultNightHours: string;
}

interface Officer {
  id: string;
  badgeNumber: string;
  name: string;
  defaultPatrolId: string;
  rank: string;
  phone?: string;
  email?: string;
  company?: string;
  delegation?: string;
  notes?: string;
  active?: boolean;
}

interface AdminAccount {
  email: string;
  name: string;
  defaultRank: string;
  hasPasswordSet: boolean;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserAccount {
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  hasPasswordSet: boolean;
  passwordHash?: string;
  salt?: string;
  officerId?: string;
  badgeNumber?: string;
  defaultPatrolId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminName: string;
  actionType: 'create_shift' | 'update_shift' | 'delete_shift' | 'batch_pattern' | 'resolve_conflict' | 'revert_action';
  description: string;
  officerName?: string;
  date?: string;
  previousState?: ShiftAssignment | null;
  newState?: ShiftAssignment | null;
  reverted?: boolean;
}

interface ChatMessage {
  id: string;
  timestamp: string;
  senderEmail: string;
  senderName: string;
  text: string;
}

interface PresenceUser {
  email: string;
  name: string;
  lastSeen: number;
}

interface Incident {
  id: string;
  timestamp: string;
  reporterEmail: string;
  reporterName: string;
  reporterBadge?: string;
  patrolId: string;
  type: string;
  title: string;
  location: string;
  pk?: string;
  description: string;
  actionsTaken?: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en_curso' | 'resuelta';
  resolvedAt?: string;
}

interface DatabaseSchema {
  admins: Record<string, AdminAccount>;
  users?: Record<string, UserAccount>;
  assignments: ShiftAssignment[];
  officers?: Officer[];
  incidents?: Incident[];
  auditLogs: AuditLogEntry[];
  chatMessages: ChatMessage[];
  presence: Record<string, PresenceUser>;
}

// Load initial seed data from JSON
function loadSeedsData() {
  try {
    if (fs.existsSync(SEEDS_FILE)) {
      const content = fs.readFileSync(SEEDS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading seeds.json:', err);
  }
  return { patrols: [], officers: [], seedAssignments: [] };
}

const SEED_DATA = loadSeedsData();
const INITIAL_PATROLS: Patrol[] = SEED_DATA.patrols || [];
const INITIAL_OFFICERS: Officer[] = SEED_DATA.officers || [];

const INITIAL_INCIDENTS: Incident[] = [
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
    pk: 'PK 669+500',
    description: 'Malla electrosoldada desprendida en unos 2 metros. Sin presencia de intrusos.',
    actionsTaken: 'Aseguramiento provisional con bridas de seguridad y parte remitido al departamento de Infraestructuras ADIF.',
    severity: 'baja',
    status: 'resuelta',
    resolvedAt: '2026-10-07T09:00:00.000Z'
  }
];

// Ensure data folder and db file exist with initial seed
function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.assignments && parsed.admins) {
        if (!parsed.users) {
          parsed.users = {};
        }
        if (!parsed.incidents || parsed.incidents.length === 0) {
          parsed.incidents = [...INITIAL_INCIDENTS];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading db.json, re-initializing:', e);
    }
  }

  // Initialize with the 3 allowed admins
  const admins: Record<string, AdminAccount> = {};
  Object.entries(ALLOWED_ADMINS).forEach(([email, info]) => {
    admins[email] = {
      email,
      name: info.name,
      defaultRank: info.defaultRank,
      hasPasswordSet: false,
      createdAt: new Date().toISOString()
    };
  });

  const initialSeed: DatabaseSchema = {
    admins,
    users: {},
    assignments: SEED_DATA.seedAssignments || [],
    officers: SEED_DATA.officers || INITIAL_OFFICERS,
    incidents: [...INITIAL_INCIDENTS],
    auditLogs: [
      {
        id: `audit-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: 'sistema@ilunion.com',
        adminName: 'Sistema ADIF / ILUNION',
        actionType: 'create_shift',
        description: 'Carga inicial de cuadrantes oficiales de Patrullas Barcelona I, II y III para Octubre 2026'
      }
    ],
    chatMessages: [
      {
        id: `msg-welcome`,
        timestamp: new Date().toISOString(),
        senderEmail: 'ruiz.ortiz.daniel@gmail.com',
        senderName: 'Daniel Ruiz Ortiz',
        text: 'Bienvenidos al centro de control y cuadrantes de las patrullas ADIF Barcelona. El sistema de registro de cambios y chat online está operativo.'
      }
    ],
    presence: {}
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write initial db.json:', e);
  }

  return initialSeed;
}

let db = initDatabase();
if (!db.users) {
  db.users = {};
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to persist db.json:', e);
  }
}

// Password hashing helper using SHA-256 + salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Pre-seed sample non-admin officers with password '1234' for testing / quick access
const SAMPLE_OFFICERS_SEED = [
  { email: 'lourdes.ponce@ilunion.com', name: 'PONCE MORALES, MARIA LOURDES', badgeNumber: '101.653', role: 'Vigilante', officerId: 'of-101653', defaultPatrolId: 'p1' },
  { email: 'domenec.ventura@ilunion.com', name: 'VENTURA DE SANTIAGO, DOMENEC', badgeNumber: '149.334', role: 'Vigilante', officerId: 'of-149334', defaultPatrolId: 'p1' },
  { email: 'david.fuentes@ilunion.com', name: 'FUENTES PALMA, DAVID', badgeNumber: '242.058', role: 'Vigilante', officerId: 'of-242058', defaultPatrolId: 'p1' }
];

let seededAny = false;
SAMPLE_OFFICERS_SEED.forEach(s => {
  if (!db.users![s.email]) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword('1234', salt);
    db.users![s.email] = {
      email: s.email,
      name: s.name,
      role: s.role,
      isAdmin: false,
      hasPasswordSet: true,
      passwordHash: hash,
      salt: salt,
      officerId: s.officerId,
      badgeNumber: s.badgeNumber,
      defaultPatrolId: s.defaultPatrolId,
      createdAt: new Date().toISOString()
    };
    seededAny = true;
  }
});
if (seededAny) {
  saveDatabase();
}

// -------------------------------------------------------------
// PDF GENERATION UTILITIES (Native Vector PDFKit)
// -------------------------------------------------------------

function getDaysInMonth(year: number, month: number) {
  const days = [];
  const date = new Date(year, month - 1, 1);
  const dayLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  while (date.getMonth() === month - 1) {
    const dayNum = date.getDate();
    const dayOfWeek = dayLetters[date.getDay()];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    days.push({
      dayNumber: dayNum,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
      dayOfWeek,
      isWeekend
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function generatePatrolPdf(opts: {
  patrol: Patrol;
  allPatrols: Patrol[];
  officers: Officer[];
  assignments: ShiftAssignment[];
  month: number;
  year: number;
  monthName: string;
}) {
  const { patrol, allPatrols, officers, assignments, month, year, monthName } = opts;
  const days = getDaysInMonth(year, month);
  const patrolMap = new Map(allPatrols.map(p => [p.id, p]));

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 15,
    info: {
      Title: `Cuadrante Oficial - ${patrol.name}`,
      Author: 'ILUNION Seguridad - ADIF'
    }
  });

  const pageWidth = 841.89;
  const startX = 20;
  const startY = 18;
  const tableWidth = 801.89;

  // Header date & title
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#333333');
  doc.text(`26/09/2026`, pageWidth - 80, startY, { align: 'right' });

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000');
  doc.text('INFORME CUADRANTE GRAFICO POR SERVICIO', startX, startY + 8, {
    align: 'center',
    underline: true
  });

  // Metadata Box
  const metaY = startY + 28;
  const metaHeight = 52;
  doc.rect(startX, metaY, tableWidth, metaHeight).strokeColor('#888888').lineWidth(0.5).stroke();

  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
  doc.text('EMPRESA:', startX + 5, metaY + 4);
  doc.font('Helvetica').text('ILUNION SEGURIDAD S.A.', startX + 65, metaY + 4);

  doc.font('Helvetica-Bold').text('CLIENTE:', startX + 5, metaY + 14);
  doc.font('Helvetica').text('000889 - ADIF', startX + 65, metaY + 14);

  doc.font('Helvetica-Bold').text('CONTRATO:', startX + 5, metaY + 24);
  doc.font('Helvetica').text('000414 - BARCELONA ESTACIONES / PATRULLAS', startX + 65, metaY + 24);

  doc.font('Helvetica-Bold').text('SERVICIO:', startX + 5, metaY + 36);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e3a8a')
    .text(`${patrol.code} - ${patrol.name.toUpperCase()}`, startX + 65, metaY + 36);

  const rightMetaX = startX + 480;
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
  doc.text('MES / AÑO:', rightMetaX, metaY + 4);
  doc.font('Helvetica').text(`${monthName.toUpperCase()} / ${year}`, rightMetaX + 60, metaY + 4);

  doc.font('Helvetica-Bold').text('DESTINATARIO:', rightMetaX, metaY + 14);
  doc.font('Helvetica').text('000889 - ADIF PATRULLAS', rightMetaX + 60, metaY + 14);

  doc.font('Helvetica-Bold').text('INSPECTOR:', rightMetaX, metaY + 24);
  doc.font('Helvetica').text('DANIEL RUIZ ORTIZ', rightMetaX + 60, metaY + 24);

  doc.font('Helvetica-Bold').text('ESTADO:', rightMetaX, metaY + 36);
  doc.font('Helvetica').text('OFICIAL APROBADO', rightMetaX + 60, metaY + 36);

  // Table setup
  const tableStartY = metaY + metaHeight + 6;
  const colOfficerWidth = 145;
  const colTotWidth = 36;
  const numDays = days.length;
  const colDayWidth = (tableWidth - colOfficerWidth - colTotWidth) / numDays;

  const squadOfficers = officers.filter(o => 
    o.defaultPatrolId === patrol.id || 
    assignments.some(a => a.officerId === o.id && a.patrolId === patrol.id)
  );

  let currentY = tableStartY;
  const headerHeight = 12;

  doc.rect(startX, currentY, colOfficerWidth, headerHeight * 2).fillAndStroke('#f1f5f9', '#000000');
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
    .text('VIGILANTE / TIP', startX + 4, currentY + 7);

  days.forEach((d, idx) => {
    const x = startX + colOfficerWidth + (idx * colDayWidth);
    const bgColor = d.isWeekend ? '#e2e8f0' : '#f8fafc';
    
    doc.rect(x, currentY, colDayWidth, headerHeight).fillAndStroke(bgColor, '#000000');
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(d.isWeekend ? '#b91c1c' : '#000000')
      .text(d.dayOfWeek, x, currentY + 2.5, { width: colDayWidth, align: 'center' });

    doc.rect(x, currentY + headerHeight, colDayWidth, headerHeight).fillAndStroke(bgColor, '#000000');
    doc.font('Helvetica-Bold').fontSize(6).fillColor('#000000')
      .text(String(d.dayNumber).padStart(2, '0'), x, currentY + headerHeight + 2.5, { width: colDayWidth, align: 'center' });
  });

  const totX = startX + colOfficerWidth + (numDays * colDayWidth);
  doc.rect(totX, currentY, colTotWidth, headerHeight * 2).fillAndStroke('#f1f5f9', '#000000');
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
    .text('TOTAL', totX, currentY + 7, { width: colTotWidth, align: 'center' });

  currentY += headerHeight * 2;

  const rowHeight = 21;
  const dailyTotals = new Array(numDays).fill(0);
  let grandTotalHours = 0;

  squadOfficers.forEach((officer, oIdx) => {
    const rowBg = oIdx % 2 === 0 ? '#ffffff' : '#fafafa';
    doc.rect(startX, currentY, colOfficerWidth, rowHeight).fillAndStroke(rowBg, '#000000');

    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
      .text(officer.name, startX + 3, currentY + 3, { width: colOfficerWidth - 6, height: 9, ellipsis: true });
    doc.font('Helvetica').fontSize(6).fillColor('#475569')
      .text(`TIP: ${officer.badgeNumber}`, startX + 3, currentY + 12);

    let officerTotalHours = 0;

    days.forEach((d, dIdx) => {
      const x = startX + colOfficerWidth + (dIdx * colDayWidth);
      const cellBg = d.isWeekend ? '#f8fafc' : rowBg;
      doc.rect(x, currentY, colDayWidth, rowHeight).fillAndStroke(cellBg, '#000000');

      const asgs = assignments.filter(a => a.officerId === officer.id && a.date === d.dateStr);
      const inThisPatrol = asgs.find(a => a.patrolId === patrol.id);
      const inOtherPatrol = asgs.find(a => a.patrolId && a.patrolId !== patrol.id);
      const leaveAsg = asgs.find(a => a.patrolId === null);

      if (inThisPatrol) {
        officerTotalHours += (inThisPatrol.hours || 0);
        dailyTotals[dIdx] += (inThisPatrol.hours || 0);

        doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
          .text(inThisPatrol.startTime || '18:00', x, currentY + 2.5, { width: colDayWidth, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
          .text(inThisPatrol.endTime || '06:00', x, currentY + 11.5, { width: colDayWidth, align: 'center' });
      } else if (inOtherPatrol) {
        const otherCode = patrolMap.get(inOtherPatrol.patrolId!)?.code || 'OTR';
        doc.font('Helvetica-Bold').fontSize(4.5).fillColor('#b45309')
          .text(`[${otherCode}]`, x, currentY + 3, { width: colDayWidth, align: 'center' });
        doc.font('Helvetica').fontSize(4.5).fillColor('#b45309')
          .text(inOtherPatrol.startTime || '', x, currentY + 11, { width: colDayWidth, align: 'center' });
      } else if (leaveAsg) {
        if (leaveAsg.shiftCode === 'V') {
          // Vacaciones 5.2h
          if (officer.defaultPatrolId === patrol.id) {
            officerTotalHours += (leaveAsg.hours || 5.2);
          }
          doc.font('Helvetica-Bold').fontSize(6).fillColor('#0f766e')
            .text('V', x, currentY + 3, { width: colDayWidth, align: 'center' });
          doc.font('Helvetica-Bold').fontSize(4.5).fillColor('#0f766e')
            .text('5.2h', x, currentY + 11.5, { width: colDayWidth, align: 'center' });
        } else {
          doc.font('Helvetica-Bold').fontSize(6).fillColor('#64748b')
            .text(leaveAsg.shiftCode, x, currentY + 7, { width: colDayWidth, align: 'center' });
        }
      }
    });

    grandTotalHours += officerTotalHours;

    doc.rect(totX, currentY, colTotWidth, rowHeight).fillAndStroke('#f8fafc', '#000000');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
      .text(officerTotalHours % 1 === 0 ? String(officerTotalHours) : officerTotalHours.toFixed(1), totX, currentY + 6, { width: colTotWidth, align: 'center' });

    currentY += rowHeight;
  });

  // Footer Total Row
  doc.rect(startX, currentY, colOfficerWidth, 14).fillAndStroke('#e2e8f0', '#000000');
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
    .text('TOTAL HORAS SERVICIO', startX + 4, currentY + 3.5);

  dailyTotals.forEach((tot, dIdx) => {
    const x = startX + colOfficerWidth + (dIdx * colDayWidth);
    doc.rect(x, currentY, colDayWidth, 14).fillAndStroke('#e2e8f0', '#000000');
    if (tot > 0) {
      doc.font('Helvetica-Bold').fontSize(6).fillColor('#000000')
        .text(String(tot), x, currentY + 3.5, { width: colDayWidth, align: 'center' });
    }
  });

  doc.rect(totX, currentY, colTotWidth, 14).fillAndStroke('#cbd5e1', '#000000');
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
    .text(String(grandTotalHours), totX, currentY + 3, { width: colTotWidth, align: 'center' });

  currentY += 18;

  // Summary footer boxes
  const summaryBoxWidth = tableWidth / 6;
  const summaryLabels = ['LAB. DIURNAS', 'LAB. NOCTURNAS', 'FEST. DIURNAS', 'FEST. NOCTURNAS', 'TOTAL NOCT.', 'TOTAL HORAS'];
  const summaryValues = [
    Math.round(grandTotalHours * 0.4),
    Math.round(grandTotalHours * 0.4),
    Math.round(grandTotalHours * 0.1),
    Math.round(grandTotalHours * 0.1),
    Math.round(grandTotalHours * 0.5),
    grandTotalHours
  ];

  summaryLabels.forEach((label, idx) => {
    const bx = startX + (idx * summaryBoxWidth);
    doc.rect(bx, currentY, summaryBoxWidth, 11).fillAndStroke('#f1f5f9', '#000000');
    doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
      .text(label, bx, currentY + 2.5, { width: summaryBoxWidth, align: 'center' });

    doc.rect(bx, currentY + 11, summaryBoxWidth, 13).fillAndStroke('#ffffff', '#000000');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
      .text(String(summaryValues[idx]), bx, currentY + 13.5, { width: summaryBoxWidth, align: 'center' });
  });

  return doc;
}

function generateOfficerPdf(opts: {
  officer: Officer;
  allPatrols: Patrol[];
  assignments: ShiftAssignment[];
  month: number;
  year: number;
  monthName: string;
}) {
  const { officer, allPatrols, assignments, month, year, monthName } = opts;
  const days = getDaysInMonth(year, month);
  const patrolMap = new Map(allPatrols.map(p => [p.id, p]));

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 15,
    info: {
      Title: `Cuadrante Individual - ${officer.name}`,
      Author: 'ILUNION Seguridad - ADIF'
    }
  });

  const pageWidth = 841.89;
  const startX = 20;
  const startY = 18;
  const tableWidth = 801.89;

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#333333');
  doc.text(`26/09/2026`, pageWidth - 80, startY, { align: 'right' });

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000');
  doc.text('INFORME CUADRANTE GRAFICO POR VIGILANTE', startX, startY + 8, {
    align: 'center',
    underline: true
  });

  const metaY = startY + 28;
  const metaHeight = 52;
  doc.rect(startX, metaY, tableWidth, metaHeight).strokeColor('#888888').lineWidth(0.5).stroke();

  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
  doc.text('VIGILANTE:', startX + 5, metaY + 4);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e3a8a')
    .text(`${officer.badgeNumber} - ${officer.name}`, startX + 65, metaY + 3);

  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000').text('EMPRESA:', startX + 5, metaY + 16);
  doc.font('Helvetica').text('ILUNION SEGURIDAD S.A.', startX + 65, metaY + 16);

  doc.font('Helvetica-Bold').text('CLIENTE:', startX + 5, metaY + 26);
  doc.font('Helvetica').text('000889 - ADIF', startX + 65, metaY + 26);

  doc.font('Helvetica-Bold').text('PATRULLA BASE:', startX + 5, metaY + 36);
  doc.font('Helvetica').text(patrolMap.get(officer.defaultPatrolId)?.name || 'Barcelona I', startX + 65, metaY + 36);

  const rightMetaX = startX + 480;
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
  doc.text('MES / AÑO:', rightMetaX, metaY + 4);
  doc.font('Helvetica').text(`${monthName.toUpperCase()} / ${year}`, rightMetaX + 60, metaY + 4);

  doc.font('Helvetica-Bold').text('CONTRATO:', rightMetaX, metaY + 16);
  doc.font('Helvetica').text('000414 - BARCELONA ESTACIONES / PATRULLAS', rightMetaX + 60, metaY + 16);

  doc.font('Helvetica-Bold').text('CATEGORÍA:', rightMetaX, metaY + 26);
  doc.font('Helvetica').text(officer.rank || 'Vigilante de Seguridad', rightMetaX + 60, metaY + 26);

  doc.font('Helvetica-Bold').text('INSPECTOR:', rightMetaX, metaY + 36);
  doc.font('Helvetica').text('DANIEL RUIZ ORTIZ', rightMetaX + 60, metaY + 36);

  const tableStartY = metaY + metaHeight + 10;
  const colLabelWidth = 145;
  const colTotWidth = 36;
  const numDays = days.length;
  const colDayWidth = (tableWidth - colLabelWidth - colTotWidth) / numDays;
  const headerHeight = 12;

  let currentY = tableStartY;

  doc.rect(startX, currentY, colLabelWidth, headerHeight * 2).fillAndStroke('#f1f5f9', '#000000');
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
    .text('CONCEPTO / SERVICIO', startX + 4, currentY + 7);

  days.forEach((d, idx) => {
    const x = startX + colLabelWidth + (idx * colDayWidth);
    const bgColor = d.isWeekend ? '#e2e8f0' : '#f8fafc';
    doc.rect(x, currentY, colDayWidth, headerHeight).fillAndStroke(bgColor, '#000000');
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(d.isWeekend ? '#b91c1c' : '#000000')
      .text(d.dayOfWeek, x, currentY + 2.5, { width: colDayWidth, align: 'center' });

    doc.rect(x, currentY + headerHeight, colDayWidth, headerHeight).fillAndStroke(bgColor, '#000000');
    doc.font('Helvetica-Bold').fontSize(6).fillColor('#000000')
      .text(String(d.dayNumber).padStart(2, '0'), x, currentY + headerHeight + 2.5, { width: colDayWidth, align: 'center' });
  });

  const totX = startX + colLabelWidth + (numDays * colDayWidth);
  doc.rect(totX, currentY, colTotWidth, headerHeight * 2).fillAndStroke('#f1f5f9', '#000000');
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
    .text('TOTAL', totX, currentY + 7, { width: colTotWidth, align: 'center' });

  currentY += headerHeight * 2;

  const rowHeight = 24;
  doc.rect(startX, currentY, colLabelWidth, rowHeight).fillAndStroke('#ffffff', '#000000');
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
    .text('TURNO MENSUAL', startX + 4, currentY + 4);
  doc.font('Helvetica').fontSize(6).fillColor('#64748b')
    .text('Consolidado todas patrullas', startX + 4, currentY + 13);

  let officerTotalHours = 0;
  const patrolHoursMap: Record<string, number> = {};

  days.forEach((d, idx) => {
    const x = startX + colLabelWidth + (idx * colDayWidth);
    const cellBg = d.isWeekend ? '#f8fafc' : '#ffffff';
    doc.rect(x, currentY, colDayWidth, rowHeight).fillAndStroke(cellBg, '#000000');

    const asgs = assignments.filter(a => a.officerId === officer.id && a.date === d.dateStr);
    if (asgs.length > 0) {
      const primaryAsg = asgs[0];
      officerTotalHours += (primaryAsg.hours || 0);

      const pId = primaryAsg.patrolId || 'other';
      patrolHoursMap[pId] = (patrolHoursMap[pId] || 0) + (primaryAsg.hours || 0);

      const pCode = primaryAsg.patrolId ? (patrolMap.get(primaryAsg.patrolId)?.code || '') : '';

      if (primaryAsg.shiftCode === 'V') {
        doc.font('Helvetica-Bold').fontSize(6).fillColor('#0f766e')
          .text('V', x, currentY + 3, { width: colDayWidth, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(5).fillColor('#0f766e')
          .text('5.2h', x, currentY + 11.5, { width: colDayWidth, align: 'center' });
      } else if (primaryAsg.startTime && primaryAsg.startTime !== '-') {
        doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
          .text(primaryAsg.startTime || '18:00', x, currentY + 2.5, { width: colDayWidth, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
          .text(primaryAsg.endTime || '06:00', x, currentY + 10.5, { width: colDayWidth, align: 'center' });
        if (pCode) {
          doc.font('Helvetica-Bold').fontSize(4.5).fillColor('#1d4ed8')
            .text(pCode, x, currentY + 18, { width: colDayWidth, align: 'center' });
        }
      } else {
        doc.font('Helvetica-Bold').fontSize(6).fillColor('#64748b')
          .text(primaryAsg.shiftCode, x, currentY + 8, { width: colDayWidth, align: 'center' });
      }
    }
  });

  doc.rect(totX, currentY, colTotWidth, rowHeight).fillAndStroke('#f8fafc', '#000000');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
    .text(officerTotalHours % 1 === 0 ? String(officerTotalHours) : officerTotalHours.toFixed(1), totX, currentY + 7, { width: colTotWidth, align: 'center' });

  currentY += rowHeight + 12;

  // Desglose
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
    .text('DESGLOSE DE SERVICIOS POR PATRULLA', startX, currentY);
  currentY += 12;

  const desgloseWidth = 400;
  doc.rect(startX, currentY, desgloseWidth, 14).fillAndStroke('#f1f5f9', '#000000');
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000').text('PATRULLA / DOTACIÓN', startX + 5, currentY + 3.5);
  doc.text('HORAS ASIGNADAS', startX + 260, currentY + 3.5);
  doc.text('% MES', startX + 350, currentY + 3.5);
  currentY += 14;

  allPatrols.forEach(p => {
    const hrs = patrolHoursMap[p.id] || 0;
    const pct = officerTotalHours > 0 ? Math.round((hrs / officerTotalHours) * 100) : 0;
    doc.rect(startX, currentY, desgloseWidth, 14).fillAndStroke('#ffffff', '#000000');
    doc.font('Helvetica').fontSize(7).fillColor('#000000').text(`${p.code} - ${p.name}`, startX + 5, currentY + 3.5);
    doc.font('Helvetica-Bold').text(`${hrs} hrs`, startX + 260, currentY + 3.5);
    doc.font('Helvetica').text(`${pct}%`, startX + 350, currentY + 3.5);
    currentY += 14;
  });

  currentY += 12;

  const summaryBoxWidth = tableWidth / 6;
  const summaryLabels = ['LAB. DIURNAS', 'LAB. NOCTURNAS', 'FEST. DIURNAS', 'FEST. NOCTURNAS', 'TOTAL NOCT.', 'TOTAL LIQUIDABLE'];
  const summaryValues = [
    Math.round(officerTotalHours * 0.4),
    Math.round(officerTotalHours * 0.4),
    Math.round(officerTotalHours * 0.1),
    Math.round(officerTotalHours * 0.1),
    Math.round(officerTotalHours * 0.5),
    officerTotalHours
  ];

  summaryLabels.forEach((label, idx) => {
    const bx = startX + (idx * summaryBoxWidth);
    doc.rect(bx, currentY, summaryBoxWidth, 11).fillAndStroke('#f1f5f9', '#000000');
    doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
      .text(label, bx, currentY + 2.5, { width: summaryBoxWidth, align: 'center' });

    doc.rect(bx, currentY + 11, summaryBoxWidth, 13).fillAndStroke('#ffffff', '#000000');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
      .text(String(summaryValues[idx]), bx, currentY + 13.5, { width: summaryBoxWidth, align: 'center' });
  });

  return doc;
}

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
async function startApp() {
  const app = express();
  app.use(compression());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Health checks for Cloud Run and deployment probes
  app.get(['/health', '/healthz', '/api/health'], (_req: Request, res: Response) => {
    return res.status(200).json({ 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString() 
    });
  });

  // -------------------------------------------------------------
  // API: AUTHENTICATION (ADMIN & NON-ADMIN USERS WITH PASSWORDS)
  // -------------------------------------------------------------
  app.get('/api/auth/allowed-admins', (req: Request, res: Response) => {
    const list = Object.entries(ALLOWED_ADMINS).map(([email, info]) => {
      const adminData = db.admins[email];
      return {
        email,
        name: info.name,
        defaultRank: info.defaultRank,
        hasPasswordSet: adminData ? adminData.hasPasswordSet : false
      };
    });
    return res.json({ admins: list });
  });

  app.post('/api/auth/check-email', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Debes proporcionar un correo electrónico.' });
    }
    const lowerEmail = email.toLowerCase().trim();
    const adminInfo = ALLOWED_ADMINS[lowerEmail];
    if (adminInfo) {
      const admin = db.admins[lowerEmail];
      const hasPasswordSet = Boolean(admin && admin.hasPasswordSet && admin.passwordHash);
      return res.json({
        email: lowerEmail,
        name: adminInfo.name,
        role: adminInfo.defaultRank,
        isAdmin: true,
        hasPasswordSet
      });
    }

    if (!db.users) db.users = {};
    const existingUser = db.users[lowerEmail];

    // Check if matching any officer in personnel database
    const allOfficers = db.officers || INITIAL_OFFICERS;
    const matchedOfficer = allOfficers.find(
      o => (o.email && o.email.toLowerCase() === lowerEmail) ||
           o.name.toLowerCase().includes(lowerEmail.split('@')[0])
    );

    const userName = existingUser?.name || matchedOfficer?.name || lowerEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase() || 'Vigilante de Servicio';
    const userRole = existingUser?.role || matchedOfficer?.rank || 'Vigilante de Seguridad';
    const officerId = existingUser?.officerId || matchedOfficer?.id;
    const badgeNumber = existingUser?.badgeNumber || matchedOfficer?.badgeNumber;
    const defaultPatrolId = existingUser?.defaultPatrolId || matchedOfficer?.defaultPatrolId;
    const hasPasswordSet = Boolean(existingUser && existingUser.hasPasswordSet && existingUser.passwordHash);

    return res.json({
      email: lowerEmail,
      name: userName,
      role: userRole,
      isAdmin: false,
      officerId,
      badgeNumber,
      defaultPatrolId,
      hasPasswordSet
    });
  });

  const handlePasswordSet = (req: Request, res: Response) => {
    const { email, password, name, officerId, badgeNumber, defaultPatrolId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Debes proporcionar correo y contraseña.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const lowerEmail = email.toLowerCase().trim();
    const adminInfo = ALLOWED_ADMINS[lowerEmail];

    if (adminInfo) {
      let admin = db.admins[lowerEmail];
      if (!admin) {
        admin = {
          email: lowerEmail,
          name: adminInfo.name,
          defaultRank: adminInfo.defaultRank,
          hasPasswordSet: false,
          createdAt: new Date().toISOString()
        };
        db.admins[lowerEmail] = admin;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(password, salt);

      admin.salt = salt;
      admin.passwordHash = hash;
      admin.hasPasswordSet = true;
      admin.lastLoginAt = new Date().toISOString();

      saveDatabase();

      return res.json({
        success: true,
        user: {
          email: lowerEmail,
          name: admin.name,
          role: admin.defaultRank,
          isAdmin: true
        }
      });
    }

    // NON-ADMIN USER PASSWORD REGISTRATION / UPDATE
    if (!db.users) db.users = {};
    const allOfficers = db.officers || INITIAL_OFFICERS;
    const matchedOfficer = allOfficers.find(
      o => (o.email && o.email.toLowerCase() === lowerEmail) ||
           (officerId && o.id === officerId) ||
           o.name.toLowerCase().includes(lowerEmail.split('@')[0])
    );

    let user = db.users[lowerEmail];
    if (!user) {
      user = {
        email: lowerEmail,
        name: name || matchedOfficer?.name || lowerEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
        role: matchedOfficer?.rank || 'Vigilante de Seguridad',
        isAdmin: false,
        officerId: officerId || matchedOfficer?.id,
        badgeNumber: badgeNumber || matchedOfficer?.badgeNumber,
        defaultPatrolId: defaultPatrolId || matchedOfficer?.defaultPatrolId,
        hasPasswordSet: false,
        createdAt: new Date().toISOString()
      };
      db.users[lowerEmail] = user;
    }

    if (name) user.name = name;
    if (officerId) user.officerId = officerId;
    if (badgeNumber) user.badgeNumber = badgeNumber;
    if (defaultPatrolId) user.defaultPatrolId = defaultPatrolId;

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);

    user.salt = salt;
    user.passwordHash = hash;
    user.hasPasswordSet = true;
    user.lastLoginAt = new Date().toISOString();

    saveDatabase();

    return res.json({
      success: true,
      user: {
        email: lowerEmail,
        name: user.name,
        role: user.role,
        isAdmin: false,
        officerId: user.officerId,
        badgeNumber: user.badgeNumber,
        defaultPatrolId: user.defaultPatrolId
      }
    });
  };

  app.post('/api/auth/set-password', handlePasswordSet);
  app.post('/api/auth/setup-initial-password', handlePasswordSet);

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Faltan credenciales.' });
    }

    const lowerEmail = email.toLowerCase().trim();
    const adminInfo = ALLOWED_ADMINS[lowerEmail];

    // CASE 1: ADMINISTRATOR LOGIN (Verifies password)
    if (adminInfo) {
      if (!password) {
        return res.status(400).json({ error: 'Introduce tu contraseña de administrador.' });
      }

      const admin = db.admins[lowerEmail];
      if (!admin || !admin.hasPasswordSet || !admin.passwordHash || !admin.salt) {
        return res.status(400).json({ 
          error: 'Aún no has configurado tu contraseña. Introduce tu contraseña inicial para generarla.',
          needsPasswordSetup: true 
        });
      }

      const computedHash = hashPassword(password, admin.salt);
      if (computedHash !== admin.passwordHash) {
        return res.status(401).json({ error: 'Contraseña incorrecta. Por favor, inténtalo de nuevo.' });
      }

      admin.lastLoginAt = new Date().toISOString();
      saveDatabase();

      return res.json({
        success: true,
        user: {
          email: lowerEmail,
          name: admin.name,
          role: admin.defaultRank,
          isAdmin: true
        }
      });
    }

    // CASE 2: NON-ADMINISTRATOR USER / VIGILANTE (Strictly requires and verifies password)
    if (!password) {
      return res.status(400).json({ error: 'Debes introducir tu contraseña de acceso.' });
    }

    if (!db.users) db.users = {};
    const user = db.users[lowerEmail];

    if (!user || !user.hasPasswordSet || !user.passwordHash || !user.salt) {
      return res.status(400).json({
        error: 'Aún no has configurado tu contraseña de acceso. Configúrala a continuación.',
        needsPasswordSetup: true
      });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Contraseña incorrecta. Por favor, verifica tu clave.' });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDatabase();

    return res.json({
      success: true,
      user: {
        email: lowerEmail,
        name: user.name,
        role: user.role,
        isAdmin: false,
        officerId: user.officerId,
        badgeNumber: user.badgeNumber,
        defaultPatrolId: user.defaultPatrolId
      }
    });
  });

  // -------------------------------------------------------------
  // API: INCIDENTS / LIBRO DE NOVEDADES Y ACTUACIONES
  // -------------------------------------------------------------
  app.get('/api/incidents', (req: Request, res: Response) => {
    if (!db.incidents || db.incidents.length === 0) {
      db.incidents = [...INITIAL_INCIDENTS];
      saveDatabase();
    }
    return res.json({ incidents: db.incidents });
  });

  app.post('/api/incidents', (req: Request, res: Response) => {
    const { 
      reporterEmail, 
      reporterName, 
      reporterBadge, 
      patrolId, 
      type, 
      title, 
      location, 
      pk, 
      description, 
      actionsTaken, 
      severity 
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título y descripción son obligatorios.' });
    }

    if (!db.incidents) {
      db.incidents = [...INITIAL_INCIDENTS];
    }

    const newIncident: Incident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      reporterEmail: reporterEmail || 'vigilante@ilunion.com',
      reporterName: reporterName || 'Vigilante de Seguridad',
      reporterBadge: reporterBadge || '',
      patrolId: patrolId || 'p1',
      type: type || 'otra',
      title: title.trim(),
      location: location ? location.trim() : 'Recinto ferroviario ADIF',
      pk: pk ? pk.trim() : undefined,
      description: description.trim(),
      actionsTaken: actionsTaken ? actionsTaken.trim() : undefined,
      severity: severity || 'media',
      status: 'abierta'
    };

    db.incidents.unshift(newIncident);

    // Audit log entry
    const logEntry: AuditLogEntry = {
      id: `audit-inc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: reporterEmail || 'vigilante@ilunion.com',
      adminName: reporterName || 'Vigilante',
      actionType: 'create_shift',
      description: `Nueva novedad de servicio: [${newIncident.type.toUpperCase()}] ${newIncident.title} (${newIncident.location})`
    };
    db.auditLogs.unshift(logEntry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();

    saveDatabase();
    return res.json({ success: true, incident: newIncident });
  });

  app.put('/api/incidents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, actionsTaken, severity, notes } = req.body;

    if (!db.incidents) {
      db.incidents = [...INITIAL_INCIDENTS];
    }

    const idx = db.incidents.findIndex(i => i.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada.' });
    }

    const prev = db.incidents[idx];
    const isNowResolved = status === 'resuelta' && prev.status !== 'resuelta';

    db.incidents[idx] = {
      ...prev,
      status: status || prev.status,
      actionsTaken: actionsTaken !== undefined ? actionsTaken.trim() : prev.actionsTaken,
      severity: severity || prev.severity,
      resolvedAt: isNowResolved ? new Date().toISOString() : prev.resolvedAt
    };

    saveDatabase();
    return res.json({ success: true, incident: db.incidents[idx] });
  });

  app.delete('/api/incidents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userEmail } = req.body || {};

    if (userEmail && !ALLOWED_ADMINS[userEmail.toLowerCase().trim()]) {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar incidencias registradas.' });
    }

    if (!db.incidents) {
      db.incidents = [...INITIAL_INCIDENTS];
    }

    const idx = db.incidents.findIndex(i => i.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada.' });
    }

    const removed = db.incidents.splice(idx, 1)[0];
    saveDatabase();
    return res.json({ success: true, removed });
  });

  // -------------------------------------------------------------
  // API: QUADRANT ASSIGNMENTS
  // -------------------------------------------------------------
  app.get('/api/quadrant', (req: Request, res: Response) => {
    res.json({
      assignments: db.assignments,
      lastModified: db.auditLogs[0]?.timestamp || new Date().toISOString()
    });
  });

  app.post('/api/quadrant/assignment', (req: Request, res: Response) => {
    const { assignment, adminEmail, adminName, description } = req.body;
    if (adminEmail && !ALLOWED_ADMINS[adminEmail.toLowerCase().trim()]) {
      return res.status(403).json({ error: 'Modo solo lectura: los vigilantes no pueden editar los cuadrantes.' });
    }

    if (!assignment || !assignment.officerId || !assignment.date) {
      return res.status(400).json({ error: 'Datos de asignación incompletos.' });
    }

    const previousIdx = assignment.id 
      ? db.assignments.findIndex(a => a.id === assignment.id) 
      : -1;

    const previousState = previousIdx >= 0 ? db.assignments[previousIdx] : null;
    let savedAssignment: ShiftAssignment;

    const defaultHours = assignment.shiftCode === 'V' ? 5.2 : 12;

    if (previousIdx >= 0) {
      const hours = assignment.shiftCode === 'V' ? 5.2 : (assignment.hours ?? db.assignments[previousIdx].hours ?? defaultHours);
      savedAssignment = { ...db.assignments[previousIdx], ...assignment, hours };
      db.assignments[previousIdx] = savedAssignment;
    } else {
      const hours = assignment.shiftCode === 'V' ? 5.2 : (assignment.hours ?? defaultHours);
      savedAssignment = {
        id: assignment.id || `asg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        officerId: assignment.officerId,
        date: assignment.date,
        shiftCode: assignment.shiftCode || '18-06',
        patrolId: assignment.patrolId ?? null,
        startTime: assignment.startTime || (assignment.shiftCode === 'V' ? '-' : '18:00'),
        endTime: assignment.endTime || (assignment.shiftCode === 'V' ? '-' : '06:00'),
        hours,
        role: assignment.role,
        notes: assignment.notes,
        isAuthorizedDouble: assignment.isAuthorizedDouble
      };
      db.assignments.push(savedAssignment);
    }

    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: previousState ? 'update_shift' : 'create_shift',
      description: description || `Turno ${savedAssignment.shiftCode} asignado para el ${savedAssignment.date}`,
      date: savedAssignment.date,
      previousState,
      newState: savedAssignment
    };

    db.auditLogs.unshift(logEntry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();

    saveDatabase();
    return res.json({ success: true, assignment: savedAssignment, log: logEntry });
  });

  app.delete('/api/quadrant/assignment/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminEmail, adminName, description, officerName, date } = req.body;

    const idx = db.assignments.findIndex(a => a.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Asignación no encontrada.' });
    }

    const removed = db.assignments.splice(idx, 1)[0];

    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'delete_shift',
      description: description || `Turno eliminado (${removed.date})`,
      officerName: officerName,
      date: date || removed.date,
      previousState: removed,
      newState: null
    };

    db.auditLogs.unshift(logEntry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();

    saveDatabase();
    return res.json({ success: true, removedId: id, log: logEntry });
  });

  app.post('/api/quadrant/batch-sync', (req: Request, res: Response) => {
    const { assignments, adminEmail, adminName, description } = req.body;
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Lista de asignaciones no válida.' });
    }

    db.assignments = assignments;

    const logEntry: AuditLogEntry = {
      id: `audit-batch-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'batch_pattern',
      description: description || `Sincronización masiva de ${assignments.length} asignaciones.`
    };

    db.auditLogs.unshift(logEntry);
    saveDatabase();

    return res.json({ success: true, count: assignments.length, log: logEntry });
  });

  // -------------------------------------------------------------
  // API: OFFICERS DIRECTORY & CONTACT CARDS (FICHAS DE PERSONAL)
  // -------------------------------------------------------------
  app.get('/api/officers', (req: Request, res: Response) => {
    if (!db.officers || db.officers.length === 0) {
      db.officers = [...INITIAL_OFFICERS];
      saveDatabase();
    }
    return res.json({ officers: db.officers });
  });

  app.post('/api/officers', (req: Request, res: Response) => {
    const { name, badgeNumber, defaultPatrolId, rank, phone, email, notes, company, delegation, adminEmail, adminName } = req.body;
    if (!name || !badgeNumber) {
      return res.status(400).json({ error: 'Nombre y TIP/Número de placa son obligatorios.' });
    }

    if (!db.officers) {
      db.officers = [...INITIAL_OFFICERS];
    }

    const newOfficer: Officer = {
      id: `of-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      badgeNumber: badgeNumber.trim(),
      defaultPatrolId: defaultPatrolId || 'p1',
      rank: rank || 'Vigilante',
      company: company || '50 - ILUNION SEGURIDAD, S.A.',
      delegation: delegation || '08',
      phone: phone ? phone.trim() : undefined,
      email: email ? email.trim() : undefined,
      notes: notes ? notes.trim() : undefined
    };

    db.officers.push(newOfficer);

    const logEntry: AuditLogEntry = {
      id: `audit-officer-new-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'create_shift',
      description: `${adminName || adminEmail} creó la ficha personal de ${newOfficer.name} (TIP: ${newOfficer.badgeNumber}, Tel: ${newOfficer.phone || 'S/N'}, Email: ${newOfficer.email || 'S/E'})`
    };

    db.auditLogs.unshift(logEntry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();

    saveDatabase();
    return res.json({ success: true, officer: newOfficer, log: logEntry });
  });

  app.put('/api/officers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, badgeNumber, defaultPatrolId, phone, email, notes, rank, company, delegation, adminEmail, adminName } = req.body;

    if (!db.officers || db.officers.length === 0) {
      db.officers = [...INITIAL_OFFICERS];
    }

    const idx = db.officers.findIndex(o => o.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Vigilante no encontrado.' });
    }

    const prevOfficer = db.officers[idx];
    const updatedOfficer: Officer = {
      ...prevOfficer,
      name: name !== undefined ? name.trim() : prevOfficer.name,
      badgeNumber: badgeNumber !== undefined ? badgeNumber.trim() : prevOfficer.badgeNumber,
      defaultPatrolId: defaultPatrolId || prevOfficer.defaultPatrolId,
      phone: phone !== undefined ? phone.trim() : prevOfficer.phone,
      email: email !== undefined ? email.trim() : prevOfficer.email,
      notes: notes !== undefined ? notes.trim() : prevOfficer.notes,
      rank: rank || prevOfficer.rank,
      company: company || prevOfficer.company,
      delegation: delegation || prevOfficer.delegation
    };

    db.officers[idx] = updatedOfficer;

    const logEntry: AuditLogEntry = {
      id: `audit-officer-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'update_shift',
      description: `${adminName || adminEmail} actualizó la ficha personal de ${updatedOfficer.name} (TIP: ${updatedOfficer.badgeNumber}, Tel: ${updatedOfficer.phone || 'S/N'}, Email: ${updatedOfficer.email || 'S/E'})`
    };

    db.auditLogs.unshift(logEntry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();

    saveDatabase();
    return res.json({ success: true, officer: updatedOfficer, log: logEntry });
  });

  app.delete('/api/officers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminEmail, adminName } = req.body || {};

    if (!db.officers) {
      db.officers = [...INITIAL_OFFICERS];
    }

    const idx = db.officers.findIndex(o => o.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Vigilante no encontrado.' });
    }

    const removed = db.officers.splice(idx, 1)[0];

    const logEntry: AuditLogEntry = {
      id: `audit-officer-del-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'delete_shift',
      description: `${adminName || adminEmail} eliminó la ficha de ${removed.name} (TIP: ${removed.badgeNumber})`
    };

    db.auditLogs.unshift(logEntry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();

    saveDatabase();
    return res.json({ success: true, removedOfficer: removed, log: logEntry });
  });

  // -------------------------------------------------------------
  // API: AUDIT LOGS & ROLLBACK
  // -------------------------------------------------------------
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ logs: db.auditLogs.slice(0, 150) });
  });

  app.post('/api/audit-logs/revert/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminEmail, adminName } = req.body;

    const logIdx = db.auditLogs.findIndex(l => l.id === id);
    if (logIdx < 0) {
      return res.status(404).json({ error: 'Registro de auditoría no encontrado.' });
    }

    const log = db.auditLogs[logIdx];
    if (log.reverted) {
      return res.status(400).json({ error: 'Esta acción ya fue revertida anteriormente.' });
    }

    if (log.actionType === 'create_shift' && log.newState) {
      db.assignments = db.assignments.filter(a => a.id !== log.newState!.id);
    } else if (log.actionType === 'delete_shift' && log.previousState) {
      db.assignments.push(log.previousState);
    } else if (log.actionType === 'update_shift' && log.previousState) {
      const idx = db.assignments.findIndex(a => a.id === log.previousState!.id);
      if (idx >= 0) {
        db.assignments[idx] = log.previousState;
      } else {
        db.assignments.push(log.previousState);
      }
    }

    log.reverted = true;

    const revertLogEntry: AuditLogEntry = {
      id: `audit-revert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'administrador@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'revert_action',
      description: `Revertido por ${adminName || 'Administrador'}: "${log.description}"`,
      officerName: log.officerName,
      date: log.date
    };

    db.auditLogs.unshift(revertLogEntry);
    saveDatabase();

    return res.json({ 
      success: true, 
      message: 'Cambio revertido con éxito.', 
      assignments: db.assignments,
      logs: db.auditLogs
    });
  });

  // -------------------------------------------------------------
  // API: CHAT & PRESENCE
  // -------------------------------------------------------------
  app.get('/api/chat', (req: Request, res: Response) => {
    res.json({ messages: db.chatMessages.slice(-100) });
  });

  app.post('/api/chat', (req: Request, res: Response) => {
    const { senderEmail, senderName, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      senderEmail: senderEmail || 'admin@ilunion.com',
      senderName: senderName || 'Administrador',
      text: text.trim()
    };

    db.chatMessages.push(newMsg);
    if (db.chatMessages.length > 200) db.chatMessages.shift();

    saveDatabase();
    return res.json({ success: true, message: newMsg });
  });

  app.post('/api/presence/heartbeat', (req: Request, res: Response) => {
    const { email, name } = req.body;
    if (email && ALLOWED_ADMINS[email]) {
      db.presence[email] = {
        email,
        name: name || ALLOWED_ADMINS[email].name,
        lastSeen: Date.now()
      };
    }
    return res.json({ success: true });
  });

  app.get('/api/presence', (req: Request, res: Response) => {
    const now = Date.now();
    const threshold = 35000;

    const onlineUsers = Object.entries(ALLOWED_ADMINS).map(([email, info]) => {
      const p = db.presence[email];
      const isOnline = p ? (now - p.lastSeen) < threshold : false;
      return {
        email,
        name: info.name,
        isOnline,
        lastSeen: p ? p.lastSeen : null
      };
    });

    return res.json({ onlineUsers });
  });

  // -------------------------------------------------------------
  // API: OFFICIAL VECTOR PDF DOWNLOAD (Native Vector Engine)
  // -------------------------------------------------------------
  app.get('/api/pdf/patrol/:patrolId', (req: Request, res: Response) => {
    try {
      const { patrolId } = req.params;
      const patrol = INITIAL_PATROLS.find(p => p.id === patrolId) || INITIAL_PATROLS[0];
      const month = Number(req.query.month) || 10;
      const year = Number(req.query.year) || 2026;
      const monthName = 'Octubre';

      const doc = generatePatrolPdf({
        patrol,
        allPatrols: INITIAL_PATROLS,
        officers: INITIAL_OFFICERS,
        assignments: db.assignments,
        month,
        year,
        monthName
      });

      const cleanCode = patrol.code.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Cuadrante_Oficial_Patrulla_${cleanCode}_${monthName}_${year}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.end();
    } catch (err) {
      console.error('Error generating Patrol PDF:', err);
      res.status(500).json({ error: 'Error al generar el PDF de la patrulla' });
    }
  });

  app.get('/api/pdf/officer/:officerId', (req: Request, res: Response) => {
    try {
      const { officerId } = req.params;
      const officer = INITIAL_OFFICERS.find(o => o.id === officerId) || INITIAL_OFFICERS[0];
      const month = Number(req.query.month) || 10;
      const year = Number(req.query.year) || 2026;
      const monthName = 'Octubre';

      const doc = generateOfficerPdf({
        officer,
        allPatrols: INITIAL_PATROLS,
        assignments: db.assignments,
        month,
        year,
        monthName
      });

      const cleanName = officer.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Cuadrante_Individual_${cleanName}_${monthName}_${year}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.end();
    } catch (err) {
      console.error('Error generating Officer PDF:', err);
      res.status(500).json({ error: 'Error al generar el PDF individual del vigilante' });
    }
  });

  // Reset data API
  app.post('/api/quadrant/reset', (req: Request, res: Response) => {
    const { adminEmail, adminName } = req.body;
    db.assignments = SEED_DATA.seedAssignments || [];
    db.auditLogs.unshift({
      id: `audit-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'sistema@ilunion.com',
      adminName: adminName || 'Administrador',
      actionType: 'create_shift',
      description: `El administrador ${adminName || adminEmail} restableció todos los cuadrantes a los datos oficiales de Octubre 2026.`
    });
    saveDatabase();
    return res.json({ success: true, assignments: db.assignments });
  });

  // -------------------------------------------------------------
  // API: RAILWAY PK POINTS (KMZ / KML DATA) - PERSISTENT & HOSTED
  // -------------------------------------------------------------
  const PK_FILE = path.resolve(DATA_DIR, 'pk_database.json');
  const PK_BACKUP_FILE = path.resolve(DATA_DIR, 'pk_database.bak.json');
  const PK_KMZ_FILE = path.resolve(DATA_DIR, 'uploaded_kmz.kmz');
  const PK_META_FILE = path.resolve(DATA_DIR, 'pk_metadata.json');
  let cachedPkPoints: any[] | null = null;
  
  function getPkMetadata(): { filename?: string; count: number; uploadedAt?: string; hasHostedFile: boolean } {
    if (cachedPkPoints === null) {
      loadPkDatabase();
    }
    try {
      if (fs.existsSync(PK_META_FILE)) {
        const meta = JSON.parse(fs.readFileSync(PK_META_FILE, 'utf-8'));
        return {
          ...meta,
          count: meta.count || (cachedPkPoints ? cachedPkPoints.length : 0),
          hasHostedFile: fs.existsSync(PK_KMZ_FILE)
        };
      }
    } catch {}
    return {
      count: cachedPkPoints ? cachedPkPoints.length : 0,
      hasHostedFile: fs.existsSync(PK_KMZ_FILE)
    };
  }

  function loadPkDatabase(): any[] {
    if (cachedPkPoints !== null && cachedPkPoints.length > 0) {
      return cachedPkPoints;
    }

    // 1. Try primary file
    try {
      if (fs.existsSync(PK_FILE)) {
        const raw = fs.readFileSync(PK_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedPkPoints = parsed;
          return cachedPkPoints;
        }
      }
    } catch (e) {
      console.error('Error loading pk_database.json:', e);
    }

    // 2. Try backup file
    try {
      if (fs.existsSync(PK_BACKUP_FILE)) {
        const raw = fs.readFileSync(PK_BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedPkPoints = parsed;
          // Restore primary file
          try { fs.writeFileSync(PK_FILE, raw, 'utf-8'); } catch {}
          return cachedPkPoints;
        }
      }
    } catch (e) {
      console.error('Error loading pk_database.bak.json:', e);
    }

    // 3. Try recovering from hosted raw KMZ file
    try {
      if (fs.existsSync(PK_KMZ_FILE)) {
        console.log('Restoring PK points from hosted KMZ file on disk...');
        const buf = fs.readFileSync(PK_KMZ_FILE);
        // Synchronously or asynchronously parsed
        parseKmzOrKmlBuffer(buf, 'uploaded_kmz.kmz').then(points => {
          if (points && points.length > 0) {
            savePkDatabase(points, 'uploaded_kmz.kmz', 'sistema@adif.es', 'Sistema (Auto-Restauración)');
          }
        }).catch(() => {});
      }
    } catch {}

    cachedPkPoints = cachedPkPoints || [];
    return cachedPkPoints;
  }

  function savePkDatabase(data: any[], filename?: string, adminEmail?: string, adminName?: string) {
    try {
      cachedPkPoints = data;
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const jsonString = JSON.stringify(data);
      // Save primary
      fs.writeFileSync(PK_FILE, jsonString, 'utf-8');
      // Save backup
      fs.writeFileSync(PK_BACKUP_FILE, jsonString, 'utf-8');

      // Save metadata
      const meta = {
        filename: filename || 'adif_red_ferroviaria.kmz',
        count: data.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: adminName || adminEmail || 'Administrador'
      };
      fs.writeFileSync(PK_META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving pk_database.json:', e);
      throw e;
    }
  }

  // GET /api/pk: Fetch all PK points (supports filtering or full export for offline phone storage)
  app.get('/api/pk', (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const limitQuery = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : null;
    let points = loadPkDatabase();

    if (q) {
      points = points.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.pk && p.pk.toLowerCase().includes(q)) ||
        (p.linea && p.linea.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.folder && p.folder.toLowerCase().includes(q))
      );
    }

    const returnPoints = (limitQuery && limitQuery > 0) ? points.slice(0, limitQuery) : points;

    return res.json({
      total: points.length,
      points: returnPoints,
      metadata: getPkMetadata()
    });
  });

  // GET /api/pk/meta: Return hosting info & total points
  app.get('/api/pk/meta', (_req: Request, res: Response) => {
    return res.json(getPkMetadata());
  });

  // GET /api/pk/download: Download the hosted KMZ/KML file directly to phone or computer
  app.get('/api/pk/download', (_req: Request, res: Response) => {
    if (fs.existsSync(PK_KMZ_FILE)) {
      const meta = getPkMetadata();
      const fname = meta.filename || 'adif_puntos_kilometricos.kmz';
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      res.setHeader('Content-Type', fname.endsWith('.kml') ? 'application/vnd.google-earth.kml+xml' : 'application/vnd.google-earth.kmz');
      return fs.createReadStream(PK_KMZ_FILE).pipe(res);
    }
    return res.status(404).json({ error: 'No hay ningún archivo KMZ alojado actualmente en el servidor.' });
  });

  // POST /api/pk/upload-file: Binary upload of raw KMZ or KML file (Fast, lightweight, no JSON serialization)
  app.post('/api/pk/upload-file', express.raw({ type: '*/*', limit: '100mb' }), async (req: Request, res: Response) => {
    try {
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return res.status(400).json({ error: 'No se ha recibido el archivo binario KMZ/KML.' });
      }

      const filename = (req.headers['x-filename'] as string) || (req.query.filename as string) || 'adif_puntos.kmz';
      const adminEmail = (req.headers['x-admin-email'] as string) || 'admin@adif.es';
      const adminName = (req.headers['x-admin-name'] as string) || 'Administrador';

      // 1. Permanently host the raw KMZ/KML file on disk
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PK_KMZ_FILE, buffer);

      // 2. Parse the buffer on server using fast, robust parser
      const parsedPoints = await parseKmzOrKmlBuffer(buffer, filename);
      if (!parsedPoints || parsedPoints.length === 0) {
        return res.status(400).json({ error: 'El archivo KMZ/KML se subió pero no contiene puntos kilométricos reconocibles.' });
      }

      // 3. Save parsed points and metadata
      savePkDatabase(parsedPoints, filename, adminEmail, adminName);

      // 4. Audit log
      db.auditLogs.unshift({
        id: `audit-pk-${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail,
        adminName,
        actionType: 'create_shift',
        description: `${adminName} alojó archivo ${filename} en el servidor con ${parsedPoints.length.toLocaleString()} Puntos Kilométricos (PK) permanentes.`
      });
      saveDatabase();

      return res.json({
        success: true,
        count: parsedPoints.length,
        filename,
        points: parsedPoints,
        message: `Archivo ${filename} alojado en el servidor con éxito (${parsedPoints.length.toLocaleString()} puntos kilométricos).`
      });
    } catch (err: any) {
      console.error('Error in /api/pk/upload-file:', err);
      return res.status(500).json({ error: 'Error procesando archivo en el servidor: ' + (err.message || 'desconocido') });
    }
  });

  // POST /api/pk/sync: Intelligent bi-directional synchronization between IndexedDB and server
  app.post('/api/pk/sync', (req: Request, res: Response) => {
    try {
      const { clientCount = 0, points, filename, adminEmail, adminName } = req.body;
      const currentPoints = loadPkDatabase();
      const meta = getPkMetadata();

      // Case 1: Server currently has 0 points, but client has points -> auto-restore server!
      if (currentPoints.length === 0 && Array.isArray(points) && points.length > 0) {
        savePkDatabase(points, filename || meta.filename || 'adif_puntos_restaurados.kmz', adminEmail, adminName);
        db.auditLogs.unshift({
          id: `audit-pk-sync-${Date.now()}`,
          timestamp: new Date().toISOString(),
          adminEmail: adminEmail || 'sistema@adif.es',
          adminName: adminName || 'Sincronizador Persistente',
          actionType: 'create_shift',
          description: `Sincronización automática: Servidor restauró ${points.length.toLocaleString()} Puntos Kilométricos (PK) desde base de datos persistente local del usuario.`
        });
        saveDatabase();
        return res.json({
          synced: true,
          action: 'server_restored',
          serverCount: points.length,
          metadata: getPkMetadata(),
          message: `Servidor resincronizado y restaurado con ${points.length.toLocaleString()} puntos.`
        });
      }

      // Case 2: Server has points (> clientCount) -> client needs to download server points
      if (currentPoints.length > clientCount) {
        return res.json({
          synced: true,
          action: 'client_needs_points',
          serverCount: currentPoints.length,
          points: currentPoints,
          metadata: meta,
          message: `El servidor tiene ${currentPoints.length.toLocaleString()} puntos disponibles para sincronizar localmente.`
        });
      }

      // Case 3: Client provided more points than server -> update server
      if (Array.isArray(points) && points.length > currentPoints.length) {
        savePkDatabase(points, filename || meta.filename, adminEmail, adminName);
        return res.json({
          synced: true,
          action: 'server_updated',
          serverCount: points.length,
          metadata: getPkMetadata(),
          message: `Servidor actualizado con ${points.length.toLocaleString()} puntos.`
        });
      }

      // Case 4: Perfectly synchronized
      return res.json({
        synced: true,
        action: 'already_synced',
        serverCount: currentPoints.length,
        metadata: meta,
        message: `Sincronización verificada: ${currentPoints.length.toLocaleString()} puntos en servidor.`
      });
    } catch (err: any) {
      console.error('Error in /api/pk/sync:', err);
      return res.status(500).json({ error: 'Error en sincronización: ' + (err.message || 'desconocido') });
    }
  });

  // POST /api/pk/import: JSON array import of PK points
  app.post('/api/pk/import', (req: Request, res: Response) => {
    try {
      const { points, filename, adminEmail, adminName } = req.body;
      if (!Array.isArray(points) || points.length === 0) {
        return res.status(400).json({ error: 'No se han recibido puntos válidos para importar.' });
      }

      savePkDatabase(points, filename, adminEmail, adminName);

      // Add audit log
      db.auditLogs.unshift({
        id: `audit-pk-${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: adminEmail || 'sistema@adif.es',
        adminName: adminName || 'Administrador',
        actionType: 'create_shift',
        description: `${adminName || adminEmail} importó ${points.length} Puntos Kilométricos (PK) desde archivo ${filename || 'KMZ'}.`
      });
      saveDatabase();

      return res.json({
        success: true,
        count: points.length,
        message: `Se han guardado ${points.length} puntos kilométricos permanentemente en el servidor.`
      });
    } catch (err: any) {
      console.error('Error in /api/pk/import:', err);
      return res.status(500).json({ error: 'Error en el servidor al guardar los puntos: ' + (err.message || 'desconocido') });
    }
  });

  app.delete('/api/pk', (req: Request, res: Response) => {
    savePkDatabase([], undefined, 'sistema@adif.es', 'Sistema');
    try {
      if (fs.existsSync(PK_KMZ_FILE)) fs.unlinkSync(PK_KMZ_FILE);
      if (fs.existsSync(PK_META_FILE)) fs.unlinkSync(PK_META_FILE);
    } catch {}
    return res.json({ success: true, message: 'Base de datos y archivo KMZ del servidor eliminados con éxito.' });
  });

  // -------------------------------------------------------------
  // API: ADIF RAILWAY DICTIONARY & AI CONSULTATION
  // -------------------------------------------------------------
  app.get('/api/dictionary', (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const letter = typeof req.query.letter === 'string' ? req.query.letter.trim().toUpperCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    let list = ADIF_RAILWAY_DICTIONARY;

    if (letter && letter !== 'TODAS') {
      list = list.filter(t => t.letter === letter);
    }

    if (category && category !== 'Todas') {
      list = list.filter(t => t.category === category);
    }

    if (q) {
      list = list.filter(t => 
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.securityContext && t.securityContext.toLowerCase().includes(q)) ||
        (t.relatedTerms && t.relatedTerms.some(r => r.toLowerCase().includes(q)))
      );
    }

    return res.json({ terms: list, total: list.length });
  });

  app.post('/api/ai/dictionary-chat', async (req: Request, res: Response) => {
    const { question, history } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Debes proporcionar una consulta ferroviaria.' });
    }

    // 1. Prepare grounding context from ADIF Railway Dictionary
    const dictionaryContext = ADIF_RAILWAY_DICTIONARY.map(t => 
      `TÉRMINO: ${t.term}\nCATEGORÍA: ${t.category}\nDEFINICIÓN: ${t.definition}\nCONTEXTO OPERATIVO Y SEGURIDAD EN VÍA: ${t.securityContext || 'N/A'}\nTÉRMINOS RELACIONADOS: ${t.relatedTerms?.join(', ') || 'N/A'}`
    ).join('\n---\n');

    const systemInstruction = `Eres el Asistente Técnico y Operativo del Diccionario Ferroviario Oficial de ADIF (Administrador de Infraestructuras Ferroviarias) para las dotaciones de seguridad, vigilancia y mandos de patrulla en Barcelona y Cataluña.
Tu labor es responder a las preguntas y dudas operativas de los usuarios basándote estricta y fielmente en las definiciones oficiales de ADIF (del Diccionario Ferroviario de ADIF: https://www.adif.es/comunicacion/diccionario-ferroviario#f), la normativa RCF (Reglamento de Circulación Ferroviaria) y las normas de seguridad en infraestructura ferroviaria.

Directrices obligatorias de respuesta:
1. Define el término o concepto ferroviario con precisión técnica oficial según el Diccionario de ADIF.
2. Si la consulta tiene implicaciones de seguridad personal o de patrulla (ej. cercanía a catenaria, agujas, vías de maniobras, piquetes de entrevías, arrollamientos, pasos a nivel, cerramientos forzados), detalla siempre las precauciones que el vigilante o patrullero debe tener en cuenta (distancia mínima de seguridad, chaleco de alta visibilidad, notificación a CECOM / Puesto de Mando).
3. Si el usuario pregunta por un término no explícitamente listado o una abreviatura, relaciónalo con los conceptos ferroviarios de ADIF correspondientes.
4. Mantén un tono profesional, claro, directo y estructurado con viñetas o negritas legibles. Cita los términos relacionados pertinentes.
5. Menciona la referencia a la fuente oficial de ADIF al final.

DICCIONARIO OFICIAL ADIF DE REFERENCIA:
${dictionaryContext}`;

    try {
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
        
        // Build contents with conversation history
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const msg of history.slice(-6)) {
            if (msg.role === 'user' || msg.role === 'model') {
              contents.push({
                role: msg.role,
                parts: [{ text: msg.text }]
              });
            }
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: question }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
          }
        });

        const answerText = response.text || 'No se pudo generar respuesta.';

        // Find mentioned terms in the response
        const matchedTerms = ADIF_RAILWAY_DICTIONARY.filter(t => 
          question.toLowerCase().includes(t.term.toLowerCase()) || 
          answerText.toLowerCase().includes(t.term.toLowerCase())
        ).slice(0, 5);

        return res.json({
          answer: answerText,
          relatedTerms: matchedTerms,
          source: 'ADIF Diccionario Ferroviario Oficial (IA Gemini 3.8 Flash)'
        });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, using intelligent dictionary fallback:', err?.message || err);
    }

    // Local deterministic fallback if Gemini API is unreachable
    const query = question.toLowerCase();
    const matches = ADIF_RAILWAY_DICTIONARY.filter(t => 
      query.includes(t.term.toLowerCase()) || 
      t.term.toLowerCase().includes(query) ||
      (t.relatedTerms && t.relatedTerms.some(r => query.includes(r.toLowerCase())))
    );

    if (matches.length > 0) {
      const top = matches[0];
      const fallbackAnswer = `**Definición oficial de ADIF:**\n\n**${top.term}** (${top.category}):\n${top.definition}\n\n${top.securityContext ? `**Implicaciones de Seguridad para la Patrulla:**\n${top.securityContext}\n\n` : ''}${top.relatedTerms ? `*Términos relacionados:* ${top.relatedTerms.join(', ')}` : ''}\n\n*(Fuente: Diccionario Ferroviario de ADIF - https://www.adif.es/comunicacion/diccionario-ferroviario#f)*`;

      return res.json({
        answer: fallbackAnswer,
        relatedTerms: matches.slice(0, 4),
        source: 'ADIF Diccionario Ferroviario Oficial'
      });
    }

    return res.json({
      answer: `No se ha encontrado una definición exacta para tu consulta en el glosario básico. En la infraestructura de ADIF se recomienda consultar el Diccionario Ferroviario oficial en https://www.adif.es/comunicacion/diccionario-ferroviario#f o contactar con el Puesto de Mando (PM) / CECOM para aclaraciones operativas reglamentarias.`,
      relatedTerms: [],
      source: 'ADIF Diccionario Ferroviario'
    });
  });

  // -------------------------------------------------------------
  // CLIENT SERVING (Production Static vs Dev Vite Middleware)
  // -------------------------------------------------------------
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtml = path.join(distDir, 'index.html');

  if (fs.existsSync(distDir) && fs.existsSync(indexHtml)) {
    console.log('Serving production build from dist');
    app.use(express.static(distDir, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(indexHtml);
    });
  } else {
    console.log('Serving dev mode via Vite middlewares');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown handling for Cloud Run & container deployments
  const gracefulShutdown = (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server gracefully`);
    server.close(() => {
      console.log('HTTP server closed cleanly');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startApp().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
