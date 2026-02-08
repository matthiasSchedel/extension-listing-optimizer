import type { ScoreSummary } from '@/types';

export function scoreToLabel(score: number): string {
  if (score >= 90) {
    return 'Excellent';
  }
  if (score >= 75) {
    return 'Strong';
  }
  if (score >= 60) {
    return 'Needs polish';
  }
  if (score >= 40) {
    return 'At risk';
  }
  return 'Critical';
}

export function gradeColor(grade: ScoreSummary['grade']): string {
  switch (grade) {
    case 'A':
      return 'text-mint';
    case 'B':
      return 'text-ocean';
    case 'C':
      return 'text-amber-700';
    case 'D':
      return 'text-orange-700';
    case 'F':
      return 'text-red-700';
    default:
      return 'text-ink';
  }
}

export function severityClasses(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'info':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
