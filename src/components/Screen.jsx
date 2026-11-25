// Screen shell: a full-page <main> with the big title, or — when `embedded`
// — just the content, so a screen can live inside another tab (Load inside
// Dashboard, Sessions/Progress inside History) without a second page title.
export function Screen({ title, embedded = false, titleStyle, children }) {
  if (embedded) return <div className="embedded">{children}</div>;
  return (
    <main className="screen">
      {title && (
        <div className="title-xl" style={titleStyle}>
          {title}
        </div>
      )}
      {children}
    </main>
  );
}
