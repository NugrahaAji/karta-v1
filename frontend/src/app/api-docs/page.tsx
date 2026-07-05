"use client";
import { useState, useEffect } from "react";

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.25)" },
  POST: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  PUT: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  DELETE: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.25)j" },
};

const ACCESS_COLORS: Record<string, string> = {
  Public: "#22c55e",
  Authenticated: "#3b82f6",
  superAdmin: "#a855f7",
  Company: "#f59e0b",
};

interface Endpoint {
  method: string;
  path: string;
  description: string;
  access: string;
  request?: { headers?: Record<string, string>; body?: unknown };
  response?: { status: number; body: unknown };
}

interface Category {
  name: string;
  description: string;
  endpoints: Endpoint[];
}

interface ApiDoc {
  title: string;
  version: string;
  baseUrl: string;
  categories: Category[];
}

export default function ApiDocsPage() {
  const [docs, setDocs] = useState<ApiDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/docs`)
      .then((r) => r.json())
      .then((data) => { setDocs(data); setActiveCategory(data.categories?.[0]?.name || null); })
      .catch(() => setError("Failed to load API documentation"))
      .finally(() => setLoading(false));
  }, []);

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredCategories = docs?.categories
    ?.map((cat) => ({
      ...cat,
      endpoints: cat.endpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.description.toLowerCase().includes(search.toLowerCase()) ||
          ep.method.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.endpoints.length > 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: "#8b8b8b", marginTop: 16 }}>Loading API Documentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: "#ef4444", fontSize: 18 }}>⚠️ {error}</p>
        <p style={{ color: "#8b8b8b", marginTop: 8, fontSize: 14 }}>Make sure the backend is running on port 5000</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.title}>
              <span style={styles.logo}>Karta</span> API Documentation
            </h1>
            <p style={styles.subtitle}>v{docs?.version} · Base URL: <code style={styles.code}>{docs?.baseUrl}</code></p>
          </div>
          <div style={styles.searchWrap}>
            <input
              type="text"
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav>
            <p style={styles.sidebarTitle}>Categories</p>
            {filteredCategories?.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                style={{
                  ...styles.sidebarItem,
                  ...(activeCategory === cat.name ? styles.sidebarItemActive : {}),
                }}
              >
                <span>{cat.name}</span>
                <span style={styles.badge}>{cat.endpoints.length}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {filteredCategories
            ?.filter((cat) => !activeCategory || cat.name === activeCategory)
            .map((cat) => (
              <section key={cat.name} style={styles.section}>
                <h2 style={styles.sectionTitle}>{cat.name}</h2>
                <p style={styles.sectionDesc}>{cat.description}</p>

                <div style={styles.endpointList}>
                  {cat.endpoints.map((ep, i) => {
                    const key = `${cat.name}-${i}`;
                    const isOpen = expandedEndpoints.has(key);
                    const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;

                    return (
                      <div key={key} style={{ ...styles.endpointCard, borderColor: isOpen ? mc.border : "rgba(255,255,255,0.06)" }}>
                        <button onClick={() => toggleEndpoint(key)} style={styles.endpointHeader}>
                          <div style={styles.endpointMeta}>
                            <span style={{ ...styles.methodBadge, background: mc.bg, color: mc.text, borderColor: mc.border }}>
                              {ep.method}
                            </span>
                            <code style={styles.pathText}>{ep.path}</code>
                          </div>
                          <div style={styles.endpointRight}>
                            <span style={{ ...styles.accessBadge, color: ACCESS_COLORS[ep.access] || "#8b8b8b" }}>
                              {ep.access}
                            </span>
                            <span style={{ ...styles.chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                          </div>
                        </button>
                        <p style={styles.endpointDesc}>{ep.description}</p>

                        {isOpen && (
                          <div style={styles.endpointBody}>
                            {ep.request?.headers && (
                              <div style={styles.jsonBlock}>
                                <p style={styles.jsonLabel}>Headers</p>
                                <pre style={styles.pre}>{JSON.stringify(ep.request.headers, null, 2)}</pre>
                              </div>
                            )}
                            {ep.request?.body && (
                              <div style={styles.jsonBlock}>
                                <p style={styles.jsonLabel}>Request Body</p>
                                <pre style={styles.pre}>
                                  {typeof ep.request.body === "string" ? ep.request.body : JSON.stringify(ep.request.body, null, 2)}
                                </pre>
                              </div>
                            )}
                            {ep.response && (
                              <div style={styles.jsonBlock}>
                                <p style={styles.jsonLabel}>
                                  Response <span style={{ ...styles.statusBadge, color: ep.response.status < 300 ? "#22c55e" : "#f59e0b" }}>
                                    {ep.response.status}
                                  </span>
                                </p>
                                <pre style={styles.pre}>
                                  {typeof ep.response.body === "string" ? ep.response.body : JSON.stringify(ep.response.body, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#070707", color: "#ededed", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  loadingContainer: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#070707" },
  spinner: { width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent-from)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: { borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(7,7,7,0.8)", position: "sticky" as const, top: 0, zIndex: 50 },
  headerInner: { maxWidth: 1400, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 16 },
  title: { fontSize: 24, fontWeight: 800, margin: 0, color: "#fff" },
  logo: { background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { fontSize: 14, color: "#8b8b8b", margin: "4px 0 0" },
  code: { background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 6, fontSize: 13, color: "#a855f7" },
  searchWrap: {},
  searchInput: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: "#ededed", fontSize: 14, width: 280, outline: "none" },
  layout: { maxWidth: 1400, margin: "0 auto", display: "flex", gap: 0, minHeight: "calc(100vh - 80px)" },
  sidebar: { width: 240, minWidth: 240, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 16px", position: "sticky" as const, top: 80, height: "calc(100vh - 80px)", overflowY: "auto" as const },
  sidebarTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5, color: "#6b6b6b", margin: "0 0 12px 8px" },
  sidebarItem: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#8b8b8b", cursor: "pointer", fontSize: 14, textAlign: "left" as const, transition: "all 0.15s", marginBottom: 2 },
  sidebarItemActive: { background: "rgba(168,85,247,0.1)", color: "#a855f7" },
  badge: { background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 10, fontSize: 12 },
  main: { flex: 1, padding: "32px 40px", overflowY: "auto" as const },
  section: { marginBottom: 48 },
  sectionTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#fff" },
  sectionDesc: { fontSize: 14, color: "#8b8b8b", margin: "0 0 20px" },
  endpointList: { display: "flex", flexDirection: "column" as const, gap: 10 },
  endpointCard: { border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, background: "rgba(255,255,255,0.02)", overflow: "hidden", transition: "border-color 0.2s" },
  endpointHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "14px 18px 4px", border: "none", background: "transparent", color: "#ededed", cursor: "pointer", textAlign: "left" as const },
  endpointMeta: { display: "flex", alignItems: "center", gap: 12 },
  methodBadge: { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "monospace", border: "1px solid", letterSpacing: 0.5 },
  pathText: { fontSize: 14, color: "#d4d4d4", fontFamily: "monospace" },
  endpointRight: { display: "flex", alignItems: "center", gap: 12 },
  accessBadge: { fontSize: 12, fontWeight: 600 },
  chevron: { fontSize: 14, color: "#6b6b6b", transition: "transform 0.2s" },
  endpointDesc: { fontSize: 13, color: "#8b8b8b", margin: "0 18px 14px", padding: 0 },
  endpointBody: { padding: "0 18px 18px", display: "flex", flexDirection: "column" as const, gap: 12, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 },
  jsonBlock: {},
  jsonLabel: { fontSize: 12, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 },
  pre: { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 18px", fontSize: 13, color: "#a5f3fc", fontFamily: "'Fira Code', 'JetBrains Mono', monospace", overflow: "auto", margin: 0, lineHeight: 1.6, maxHeight: 400 },
  statusBadge: { fontSize: 12, fontWeight: 700, marginLeft: 8 },
};
