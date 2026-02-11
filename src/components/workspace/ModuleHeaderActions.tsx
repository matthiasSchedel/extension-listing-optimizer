import type { WorkspaceViewModel } from '@/types';

import { exportModuleCsv, exportModuleJson } from '@/utils/export';

interface ModuleHeaderActionsProps {
  moduleName: string;
  viewModel: WorkspaceViewModel;
  rows: Array<Record<string, string | number | null | undefined>>;
  payload: unknown;
}

export function ModuleHeaderActions({ moduleName, viewModel, rows, payload }: ModuleHeaderActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm text-[color:var(--text)]"
        onClick={() => exportModuleCsv(moduleName, rows, viewModel)}
      >
        Export CSV
      </button>
      <button
        type="button"
        className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm text-[color:var(--text)]"
        onClick={() => exportModuleJson(moduleName, payload, viewModel)}
      >
        Export JSON
      </button>
    </div>
  );
}
