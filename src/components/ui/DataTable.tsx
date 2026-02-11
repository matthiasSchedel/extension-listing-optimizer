import { useMemo, useState } from 'react';

interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  caption: string;
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  rowKey: (row: T) => string;
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function DataTable<T>({
  caption,
  rows,
  columns,
  rowKey,
  initialSortBy,
  initialSortDirection = 'desc',
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  const sortedRows = useMemo(() => {
    if (!sortBy) {
      return rows;
    }

    const column = columns.find((item) => item.id === sortBy);
    if (!column?.sortValue) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      const valueA = column.sortValue!(a);
      const valueB = column.sortValue!(b);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const compare = String(valueA).localeCompare(String(valueB));
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [rows, columns, sortBy, sortDirection]);

  const toggleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(columnId);
    setSortDirection('desc');
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm" role="table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const isActiveSort = sortBy === column.id;

                return (
                  <th key={column.id} scope="col" className={`px-3 py-3 text-left font-semibold ${column.className ?? ''}`}>
                    {sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)]"
                        onClick={() => toggleSort(column.id)}
                        aria-label={`Sort by ${column.header}`}
                      >
                        <span>{column.header}</span>
                        <span aria-hidden="true">{isActiveSort ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--surface-soft)]">
                {columns.map((column) => (
                  <td key={column.id} className={`px-3 py-3 align-top text-[color:var(--text)] ${column.className ?? ''}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { DataTableColumn };
