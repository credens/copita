// Tokens del DESIGN.md de Patreon (github.com/Khalidabdi1/design-ai),
// compartidos entre las páginas de exploración /demo-patreon y
// /demo-patreon-home. Acotado con la clase .patreon-demo — no toca
// globals.css ni el resto del sitio.
export function PatreonDemoStyles() {
  return (
    <style>{`
      .patreon-demo {
        --pd-coral: #FF424D;
        --pd-ink: #111111;
        --pd-surface: #FFFFFF;
        --pd-bg: #FFF7F6;
        --pd-muted: #666666;
        --pd-border: #E9DDDA;
        background: var(--pd-bg);
        font-family: Inter, "Helvetica Neue", system-ui, sans-serif;
        color: var(--pd-ink);
        padding-bottom: 64px;
        min-height: 100vh;
      }
      .patreon-demo h1, .patreon-demo h2, .patreon-demo h3 {
        font-family: Inter, "Helvetica Neue", system-ui, sans-serif;
        font-weight: 700;
      }
      .pd-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
      .pd-banner { background: var(--pd-ink); color: #fff; font-size: 13px; padding: 10px 24px; text-align: center; }
      .pd-banner a { color: #fff; text-decoration: underline; }
      .pd-hero { height: 200px; background: linear-gradient(135deg, var(--pd-coral), #ffb3b8); }
      .pd-card {
        background: var(--pd-surface);
        border: 1px solid var(--pd-border);
        border-radius: 24px;
        box-shadow: 0 12px 24px rgba(0,0,0,0.06);
        padding: 24px;
      }
      .pd-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        border-radius: 999px; min-height: 46px; padding: 0 24px;
        font-weight: 700; font-size: 15px; cursor: pointer; border: none;
        text-decoration: none;
      }
      .pd-btn-primary { background: var(--pd-ink); color: #fff; }
      .pd-btn-secondary { background: #fff; color: var(--pd-ink); border: 1px solid var(--pd-ink); }
      .pd-tag { display: inline-block; background: var(--pd-bg); border: 1px solid var(--pd-border); color: var(--pd-muted); border-radius: 999px; padding: 4px 12px; font-size: 13px; }
      .pd-badge { display: inline-block; background: var(--pd-coral); color: #fff; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
      .pd-field { margin-bottom: 16px; }
      .pd-field label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--pd-muted); }
      .pd-field input, .pd-field textarea {
        width: 100%; border: 1px solid var(--pd-border); border-radius: 12px; padding: 10px 14px;
        font-family: inherit; font-size: 15px; box-sizing: border-box;
      }
      .pd-avatar { border-radius: 999px; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.12); object-fit: cover; }
      .pd-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; }
      .pd-wordmark { font-size: 20px; font-weight: 700; color: var(--pd-ink); text-decoration: none; }
    `}</style>
  );
}
