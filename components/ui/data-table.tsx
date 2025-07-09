'use client';

import React, { useState, useMemo } from 'react';

export interface Column<T> {
  /** Header label */
  header: string;
  /** Row accessor: either a key of the row object or a render function */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Whether column is sortable */
  sortable?: boolean;
  /** Optional custom cell renderer */
  Cell?: (row: T) => React.ReactNode;
  /** Optional min width (Tailwind class, e.g., 'w-40') */
  widthClass?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  /** Optional pagination config */
  pagination?: Pagination;
}

/**
 * Generic, lightweight data table component for the admin dashboard.
 * Designed to avoid heavy dependencies to keep bundle size minimal.
 * Supports:
 *  - Column sorting (client-side when data array is provided)
 *  - Basic pagination controls (external data loading supported)
 *  - Custom cell renderers
 *
 * NOTE: For very large datasets, fetch data server-side using cursor-based pagination
 *       and pass a limited dataset + Pagination information.
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  className = '',
  pagination,
}: DataTableProps<T>) {
  // Local sort state – key refers to column accessor (string only) | undefined
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Handler to toggle sort direction
  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Memoise sorted data (client-side only)
  const processedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortKey, sortDir]);

  const canPaginate = Boolean(pagination);
  const { currentPage = 1, pageSize = processedData.length } = pagination ?? {};

  const paginatedData = useMemo(() => {
    if (!canPaginate) return processedData;
    const startIdx = (currentPage - 1) * pageSize;
    return processedData.slice(startIdx, startIdx + pageSize);
  }, [processedData, canPaginate, currentPage, pageSize]);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable && typeof col.accessor === 'string';
              const isActiveSort = isSortable && sortKey === col.accessor;
              return (
                <th
                  key={col.header}
                  scope="col"
                  className={`px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-left whitespace-nowrap ${col.widthClass ?? ''} ${isSortable ? 'cursor-pointer select-none' : ''}`}
                  onClick={() =>
                    isSortable && toggleSort(col.accessor as string)
                  }
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {isSortable && (
                      <span className="text-gray-400">
                        {isActiveSort ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => {
                const cellContent = col.Cell
                  ? col.Cell(row)
                  : typeof col.accessor === 'function'
                  ? col.accessor(row)
                  : (row[col.accessor as keyof typeof row] as React.ReactNode);

                return (
                  <td
                    key={col.header}
                    className="px-4 py-3 whitespace-nowrap text-gray-700"
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      {canPaginate && (
        <div className="flex justify-between items-center py-4">
          <span className="text-sm text-gray-600">
            Page {pagination!.currentPage} of {pagination!.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={pagination!.currentPage === 1}
              onClick={() =>
                pagination!.onPageChange?.(pagination!.currentPage - 1)
              }
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={
                pagination!.currentPage === pagination!.totalPages ||
                pagination!.totalPages === 0
              }
              onClick={() =>
                pagination!.onPageChange?.(pagination!.currentPage + 1)
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 