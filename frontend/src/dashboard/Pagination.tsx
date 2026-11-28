import { useTranslation } from "react-i18next";
import type { PageInfo } from "../../../shared/admin";

export function Pagination({
  data,
  busy,
  onPageChange,
  label,
}: {
  data: PageInfo;
  busy: boolean;
  onPageChange: (page: number) => void;
  label: string;
}) {
  const zh = useTranslation().i18n.language.startsWith("zh");
  return (
    <div className="list-pagination">
      <span>
        {data.total > 0
          ? `${((data.page - 1) * data.pageSize + 1).toLocaleString()}–${Math.min(data.page * data.pageSize, data.total).toLocaleString()} / ${data.total.toLocaleString()}`
          : "0 / 0"}
      </span>
      <nav aria-label={label}>
        <button
          disabled={busy || data.page === 1}
          onClick={() => onPageChange(1)}
        >
          {zh ? "首页" : "First"}
        </button>
        <button
          disabled={busy || data.page === 1}
          onClick={() => onPageChange(data.page - 1)}
        >
          {zh ? "上一页" : "Previous"}
        </button>
        <form
          key={`${data.page}-${data.pageSize}-${data.totalPages}`}
          onSubmit={(event) => {
            event.preventDefault();
            const target = Number(
              new FormData(event.currentTarget).get("page"),
            );
            if (
              Number.isSafeInteger(target) &&
              target >= 1 &&
              target <= data.totalPages
            )
              onPageChange(target);
          }}
        >
          <label>
            {zh ? "第" : "Page"}
            <input
              name="page"
              type="number"
              inputMode="numeric"
              aria-label={zh ? "当前页码" : "Current page"}
              min={1}
              max={data.totalPages}
              defaultValue={data.page}
              disabled={busy}
              required
            />
            / {data.totalPages.toLocaleString()}
            {zh ? " 页" : ""}
          </label>
          <button type="submit" disabled={busy}>
            {zh ? "跳转" : "Go"}
          </button>
        </form>
        <button
          disabled={busy || data.page >= data.totalPages}
          onClick={() => onPageChange(data.page + 1)}
        >
          {zh ? "下一页" : "Next"}
        </button>
        <button
          disabled={busy || data.page >= data.totalPages}
          onClick={() => onPageChange(data.totalPages)}
        >
          {zh ? "末页" : "Last"}
        </button>
      </nav>
    </div>
  );
}

export function PageSizeSelect({
  value,
  busy,
  onChange,
}: {
  value: number;
  busy: boolean;
  onChange: (size: number) => void;
}) {
  const zh = useTranslation().i18n.language.startsWith("zh");
  return (
    <select
      aria-label={zh ? "每页条数" : "Rows per page"}
      value={value}
      disabled={busy}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {[20, 50, 100].map((size) => (
        <option key={size} value={size}>
          {zh ? `${size} 条 / 页` : `${size} per page`}
        </option>
      ))}
    </select>
  );
}
