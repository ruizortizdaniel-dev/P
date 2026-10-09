import { Officer, Patrol, ShiftAssignment } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';

/**
 * Normalizes a phone number for WhatsApp API
 * (Strips spaces, symbols, adds Spanish +34 prefix if 9 digits starting with 6 or 7)
 */
export function formatPhoneForWhatsApp(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // If 9 digits starting with 6, 7 or 8, assume Spanish number and prepend 34
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7') || digits.startsWith('8'))) {
    return `34${digits}`;
  }

  // If starts with 00, replace with international
  if (digits.startsWith('00')) {
    return digits.substring(2);
  }

  return digits;
}

/**
 * Generates an official, structured summary text for an officer's monthly quadrant
 * Matches the official format of ILUNION / ADIF
 */
export function buildOfficerQuadrantShareText(
  officer: Officer,
  month: number,
  year: number,
  monthName: string,
  assignments: ShiftAssignment[],
  patrolMap: Map<string, Patrol>
): string {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const officerAsgs = assignments
    .filter(a => a.officerId === officer.id && a.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalHours = officerAsgs.reduce((s, a) => s + (a.hours || 0), 0);
  const vacationAsgs = officerAsgs.filter(a => a.shiftCode === 'V');
  const vacationDays = vacationAsgs.length;
  // Convenio ADIF / ILUNION: 5,2 horas por día de vacaciones
  const vacationHours = vacationAsgs.reduce((s, a) => s + (a.hours || 5.2), 0);
  const workDaysCount = officerAsgs.filter(a => SHIFT_DEFINITIONS[a.shiftCode]?.isWorkShift).length;
  const offDaysCount = officerAsgs.filter(a => a.shiftCode === 'L').length;
  const sickDaysCount = officerAsgs.filter(a => a.shiftCode === 'B').length;

  // Build PDF link for direct official download
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pdfLink = `${origin}/api/pdf/officer/${officer.id}?month=${month}&year=${year}`;

  const defaultPatrol = patrolMap.get(officer.defaultPatrolId);

  const lines: string[] = [
    `👮 *ILUNION SEGURIDAD, S.A. - ADIF BARCELONA*`,
    `📋 *CUADRANTE OFICIAL DE SERVICIO INDIVIDUAL*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Vigilante:* ${officer.name}`,
    `🆔 *TIP / Placa:* ${officer.badgeNumber}`,
    `🏢 *Puesto:* ${officer.rank} · ${defaultPatrol?.name || defaultPatrol?.code || 'Patrullas ADIF'}`,
    `📅 *Mes:* ${monthName.toUpperCase()} ${year}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📊 *RESUMEN OFICIAL DE JORNADA:*`,
    `⏱️ *Total Horas Computadas:* ${totalHours.toFixed(2).replace('.', ',')} h`,
    `🛡️ *Turnos de Servicio:* ${workDaysCount} días`,
  ];

  if (vacationDays > 0) {
    lines.push(`🏖️ *Vacaciones:* ${vacationDays} días (${vacationHours.toFixed(1).replace('.', ',')}h reglamentarias a 5,2h/día)`);
  }
  if (offDaysCount > 0) {
    lines.push(`🛌 *Descansos (L):* ${offDaysCount} días`);
  }
  if (sickDaysCount > 0) {
    lines.push(`🏥 *Bajas Médicas (B):* ${sickDaysCount} días`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🗓️ *DETALLE DE TURNOS ASIGNADOS:*`);

  if (officerAsgs.length === 0) {
    lines.push(`_Sin asignaciones registradas para este periodo._`);
  } else {
    officerAsgs.forEach(asg => {
      const dayNum = asg.date.split('-')[2];
      const pCode = asg.patrolId ? (patrolMap.get(asg.patrolId)?.code || '') : '';
      if (asg.shiftCode === 'V') {
        lines.push(`• *Día ${dayNum}:* VACACIONES (5,2h)`);
      } else if (asg.shiftCode === 'L') {
        lines.push(`• *Día ${dayNum}:* LIBRE / DESCANSO`);
      } else if (asg.shiftCode === 'B') {
        lines.push(`• *Día ${dayNum}:* BAJA MÉDICA`);
      } else if (asg.shiftCode === 'AP') {
        lines.push(`• *Día ${dayNum}:* ASUNTOS PROPIOS`);
      } else {
        const patrolStr = pCode ? ` [${pCode}]` : '';
        lines.push(`• *Día ${dayNum}:* ${asg.startTime}-${asg.endTime}${patrolStr} (${asg.hours}h)`);
      }
    });
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📄 *DESCARGA DE INFORME OFICIAL PDF (A4):*`);
  lines.push(`${pdfLink}`);
  lines.push(`_Jefatura de Patrullas ADIF Barcelona · ILUNION Seguridad_`);

  return lines.join('\n');
}

/**
 * Triggers WhatsApp Web or App with pre-filled message safely (avoiding window.open popup block)
 */
export function openWhatsApp(phone: string | undefined, message: string) {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // Safe navigation without window.open
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
  }, 100);
}

/**
 * Triggers mailto client with pre-filled subject and body safely
 */
export function openEmail(email: string | undefined, subject: string, body: string) {
  const targetEmail = email ? encodeURIComponent(email) : '';
  const url = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const a = document.createElement('a');
  a.href = url;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
  }, 100);
}

/**
 * Helper to copy quadrant share text to clipboard
 */
export async function copyQuadrantText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}
