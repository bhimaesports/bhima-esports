import { useState, useMemo } from 'react';

export default function Table({
  columns = [],
  data = [],
  onRowClick,
  sortable = true,
  paginate = false,
  pageSize = 10,
  emptyMessage = 'No data found',
  rowClassName,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = paginate ? Math.ceil(sortedData.length / pageSize) : 1;
  const pageData = paginate
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${sortable && col.sortable !== false ? 'sortable' : ''} ${sortKey === col.key ? 'sorted' : ''}`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
                {sortKey === col.key && (
                  <span style={{ marginLeft: 4, fontSize: '0.65rem' }}>
                    {sortDir === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            pageData.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                style={onRowClick ? { cursor: 'pointer' } : {}}
                className={rowClassName ? rowClassName(row, i) : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row, i) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {paginate && totalPages > 1 && (
        <div className="table-pagination">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div className="page-buttons">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
