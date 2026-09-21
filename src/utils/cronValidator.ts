export interface CronValidationResult {
  isValid: boolean;
  error?: string;
  description?: string;
}

/**
 * Validate a single cron field with range and step checks.
 */
function isValidCronField(field: string, min: number, max: number): boolean {
  if (!field) return false;
  if (field === '*') return true;

  // Step expressions: */15 or 10-30/5
  if (field.includes('/')) {
    const [base, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) return false;
    if (base === '*') return true;
    return isValidCronField(base, min, max);
  }

  // Lists: 1,2,5
  if (field.includes(',')) {
    const parts = field.split(',');
    return parts.every(p => isValidCronField(p, min, max));
  }

  // Ranges: 1-5
  if (field.includes('-')) {
    const [startStr, endStr] = field.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end)) return false;
    return start >= min && end <= max && start <= end;
  }

  // Pure integer
  const num = parseInt(field, 10);
  if (isNaN(num)) return false;
  return num >= min && num <= max && String(num) === field;
}

/**
 * Validates a 5-field cron expression:
 * minute (0-59) hour (0-23) day-of-month (1-31) month (1-12) day-of-week (0-7)
 */
export function validateCronExpression(expr: string): CronValidationResult {
  if (!expr || typeof expr !== 'string') {
    return { isValid: false, error: 'Cron expression cannot be empty' };
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      isValid: false,
      error: `Expected 5 fields (minute hour day month weekday), got ${parts.length}`,
    };
  }

  const [min, hr, dom, mon, dow] = parts;

  if (!isValidCronField(min, 0, 59)) {
    return { isValid: false, error: `Invalid minute field '${min}'. Must be 0-59 or *` };
  }
  if (!isValidCronField(hr, 0, 23)) {
    return { isValid: false, error: `Invalid hour field '${hr}'. Must be 0-23 or *` };
  }
  if (!isValidCronField(dom, 1, 31)) {
    return { isValid: false, error: `Invalid day of month field '${dom}'. Must be 1-31 or *` };
  }
  if (!isValidCronField(mon, 1, 12)) {
    return { isValid: false, error: `Invalid month field '${mon}'. Must be 1-12 or *` };
  }
  if (!isValidCronField(dow, 0, 7)) {
    return { isValid: false, error: `Invalid day of week field '${dow}'. Must be 0-7 or *` };
  }

  return { isValid: true, description: describeCron(expr) };
}

/**
 * Generate human-friendly description for common cron patterns.
 */
export function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [min, hr, dom, mon, dow] = parts;

  if (min === '*' && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every minute';
  }
  if (min.startsWith('*/') && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return `Every ${min.replace('*/', '')} minutes`;
  }
  if (min === '0' && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Hourly at minute 0';
  }
  if (min === '0' && hr.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    return `Every ${hr.replace('*/', '')} hours at minute 0`;
  }
  if (!min.includes('*') && !hr.includes('*') && dom === '*' && mon === '*' && dow === '*') {
    const pad = (n: string) => n.padStart(2, '0');
    return `Daily at ${pad(hr)}:${pad(min)}`;
  }
  if (min === '0' && hr === '0' && dom === '*' && mon === '*' && dow === '0') {
    return 'Weekly on Sunday at midnight (00:00)';
  }
  if (min === '0' && !hr.includes('*') && dom === '*' && mon === '*' && dow === '0') {
    return `Weekly on Sunday at ${hr.padStart(2, '0')}:00`;
  }

  return 'Custom schedule';
}
