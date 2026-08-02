import { useState, useMemo } from "react";

/**
 * Generic search + filter hook.
 * Decouples filtering logic from any specific page component.
 *
 * @param {Array}    items        - Source array
 * @param {Array}    searchKeys   - Object keys to search against
 * @param {string}   statusKey    - Key used for status filter (e.g. "status")
 * @returns {{ filtered, search, setSearch, statusFilter, setStatusFilter }}
 */
export function useFilter(items, searchKeys = [], statusKey = "status") {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q || searchKeys.some((key) => String(item[key] || "").toLowerCase().includes(q));
      const matchStatus =
        statusFilter === "all" || item[statusKey] === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter, searchKeys, statusKey]);

  return { filtered, search, setSearch, statusFilter, setStatusFilter };
}
