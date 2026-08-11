export default function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = null,
  addLabel,
  onAdd,
}) {
  return (
    <div className="table-toolbar">
      <div className="d-flex flex-fill flex-wrap gap-2 align-items-center">
        {onSearchChange && (
          <div className="search-box">
            <i className="bi bi-search text-muted-brand me-2" />
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {filters}
      </div>
      {onAdd && (
        <button className="btn btn-outline-danger rounded-3 px-3 d-flex align-items-center gap-2 flex-shrink-0" onClick={onAdd}>
          <i className="bi bi-trash" /> <span>{addLabel}</span>
        </button>
      )}
    </div>
  );
}
