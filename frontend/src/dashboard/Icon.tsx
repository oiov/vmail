export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5 19 19 M5 19l1.5-1.5 M17.5 6.5 19 5",
    moon: "M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z",
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    key: "M15 3a6 6 0 1 1-4 10L4 20H1v-3l7-7a6 6 0 0 1 7-7Z M16 7h.01",
    mail: "M3 5h18v14H3z M3 5l9 8 9-8",
    inbox: "M4 3h16l2 14v4H2v-4L4 3Z M2 16h6l2 3h4l2-3h6",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21v-2a8 8 0 0 1 16 0v2",
    users:
      "M16 21v-2a6 6 0 0 0-12 0v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M17 4a4 4 0 0 1 0 8 M20 21v-2a6 6 0 0 0-3-5",
    log: "M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5",
    book: "M12 5v16 M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-2-10 1Z",
    arrow: "M5 12h14 M14 7l5 5-5 5",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    close: "m6 6 12 12 M18 6 6 18",
    logout: "M9 3H3v18h6 M10 12h11 M17 8l4 4-4 4",
    chevron: "m9 5 7 7-7 7",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.grid} />
    </svg>
  );
}
