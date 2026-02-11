import type { WorkspaceViewModel } from '@/types';

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const serialized = String(value);
  if (serialized.includes(',') || serialized.includes('"') || serialized.includes('\n')) {
    return `"${serialized.replace(/"/g, '""')}"`;
  }

  return serialized;
}

function toCsv(rows: Array<Record<string, string | number | null | undefined>>): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }

  return lines.join('\n');
}

function downloadFile(fileName: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildExportName(prefix: string, extensionId: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${extensionId}-${stamp}`;
}

export function exportModuleCsv(
  moduleName: string,
  rows: Array<Record<string, string | number | null | undefined>>,
  viewModel: WorkspaceViewModel,
): void {
  const baseRows = rows.map((row) => ({
    extensionId: viewModel.exportsMeta.extensionId,
    generatedAt: viewModel.exportsMeta.generatedAt,
    ...row,
  }));

  downloadFile(
    `${buildExportName(moduleName, viewModel.extensionId)}.csv`,
    toCsv(baseRows),
    'text/csv;charset=utf-8;',
  );
}

export function exportModuleJson(
  moduleName: string,
  payload: unknown,
  viewModel: WorkspaceViewModel,
): void {
  const body = {
    module: moduleName,
    extensionId: viewModel.exportsMeta.extensionId,
    generatedAt: viewModel.exportsMeta.generatedAt,
    payload,
  };

  downloadFile(
    `${buildExportName(moduleName, viewModel.extensionId)}.json`,
    JSON.stringify(body, null, 2),
    'application/json;charset=utf-8;',
  );
}
