const legacyRedirectScript = `
(() => {
  const path = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;

  if (/\\/settings\\/data(?:\\/|\\/index\\.html)?$/.test(path)) {
    const nextPath = path.replace(/\\/settings\\/data(?:\\/index\\.html)?\\/?$/, '/settings/database/');
    window.location.replace(nextPath + search + hash);
  }
})();
`;

export default function NotFound() {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#fff',
          color: '#111827',
        }}
      >
        <script dangerouslySetInnerHTML={{ __html: legacyRedirectScript }} />
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>404</h1>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
            This page could not be found.
          </p>
        </div>
      </body>
    </html>
  );
}
