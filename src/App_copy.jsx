import { useState, useRef, useEffect } from "react";

const SAMPLE_TODOS = [
  { id: 1, title: "Review design mockups", tag: "Design", completed: false, createdAt: Date.now() - 3600000 },
  { id: 2, title: "Fix login bug", tag: "Dev", completed: false, createdAt: Date.now() - 7200000 },
  { id: 3, title: "Write unit tests", tag: "Dev", completed: true, createdAt: Date.now() - 86400000 },
];

const TAG_COLORS = {
  Design: { bg: "#FFF0E6", text: "#C4521A", dot: "#F97316" },
  Dev: { bg: "#E8F0FF", text: "#1A3CB4", dot: "#3B5BDB" },
  Research: { bg: "#F0FFF4", text: "#1A7A40", dot: "#22C55E" },
  Meeting: { bg: "#FFF8E6", text: "#B45309", dot: "#F59E0B" },
  Other: { bg: "#F5F0FF", text: "#5B21B6", dot: "#8B5CF6" },
};

const TAGS = Object.keys(TAG_COLORS);

function getTag(tag) {
  return TAG_COLORS[tag] || TAG_COLORS["Other"];
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function TodoPage() {
  const [todos, setTodos] = useState(SAMPLE_TODOS);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Dev");
  const [completing, setCompleting] = useState(null);
  const [removing, setRemoving] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  const active = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  function addTodo() {
    if (!newTitle.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), title: newTitle.trim(), tag: newTag, completed: false, createdAt: Date.now() },
    ]);
    setNewTitle("");
    setNewTag("Dev");
    setShowModal(false);
  }

  function completeTodo(id) {
    setCompleting(id);
    setTimeout(() => {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
      setCompleting(null);
    }, 420);
  }

  function removeTodo(id) {
    setRemoving(id);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setRemoving(null);
    }, 350);
  }

  function restoreTodo(id) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
  }

  return (
    <div style={styles.page}>
      {/* Background grid */}
      <div style={styles.gridBg} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.eyebrowWrap}>
            <div style={styles.eyebrow}>DASHBOARD</div>
            <h1 style={styles.title}>To Do</h1>
          </div>
          <button style={styles.addBtn} onClick={() => setShowModal(true)}>
            <span style={styles.addBtnPlus}>+</span>
            <span>New Task</span>
          </button>

        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={{ ...styles.statNum, color: "#1A1A2E" }}>{active.length}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={{ ...styles.statNum, color: "#22C55E" }}>{done.length}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={{ ...styles.statNum, color: "#3B5BDB" }}>{todos.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          {todos.length > 0 && (
            <>
              <div style={styles.statDivider} />
              <div style={{ ...styles.stat, flex: 2 }}>
                <div style={styles.progressBarWrap}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${Math.round((done.length / todos.length) * 100)}%`,
                    }}
                  />
                </div>
                <span style={styles.statLabel}>{Math.round((done.length / todos.length) * 100)}% done</span>
              </div>
            </>
          )}
        </div>

        {/* Active tasks */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Active</span>
            <span style={styles.sectionCount}>{active.length}</span>
          </div>

          {active.length === 0 ? (
            <div style={styles.empty}>
              <span style={styles.emptyIcon}>✓</span>
              <span style={styles.emptyText}>All clear! Add a new task above.</span>
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {active.map((todo) => {
                const tag = getTag(todo.tag);
                const isLeaving = completing === todo.id;
                return (
                  <div
                    key={todo.id}
                    style={{
                      ...styles.card,
                      ...(isLeaving ? styles.cardLeaving : {}),
                    }}
                  >
                    <div style={styles.cardTop}>
                      <span
                        style={{
                          ...styles.tagPill,
                          background: tag.bg,
                          color: tag.text,
                        }}
                      >
                        <span style={{ ...styles.tagDot, background: tag.dot }} />
                        {todo.tag}
                      </span>
                      <button
                        style={styles.removeBtn}
                        onClick={() => removeTodo(todo.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                    <p style={styles.cardTitle}>{todo.title}</p>
                    <div style={styles.cardBottom}>
                      <span style={styles.timeAgo}>{timeAgo(todo.createdAt)}</span>
                      <button style={styles.doneBtn} onClick={() => completeTodo(todo.id)}>
                        Done ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed tasks */}
        {done.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={{ ...styles.sectionTitle, color: "#22C55E" }}>Completed</span>
              <span style={{ ...styles.sectionCount, background: "#DCFCE7", color: "#16A34A" }}>{done.length}</span>
            </div>
            <div style={styles.cardGrid}>
              {done.map((todo) => {
                const tag = getTag(todo.tag);
                const isLeaving = removing === todo.id;
                return (
                  <div
                    key={todo.id}
                    style={{
                      ...styles.card,
                      ...styles.cardDone,
                      ...(isLeaving ? styles.cardLeaving : {}),
                    }}
                  >
                    <div style={styles.cardTop}>
                      <span
                        style={{
                          ...styles.tagPill,
                          background: tag.bg,
                          color: tag.text,
                          opacity: 0.6,
                        }}
                      >
                        <span style={{ ...styles.tagDot, background: tag.dot }} />
                        {todo.tag}
                      </span>
                      <button style={styles.removeBtn} onClick={() => removeTodo(todo.id)} title="Delete">×</button>
                    </div>
                    <p style={{ ...styles.cardTitle, textDecoration: "line-through", opacity: 0.45 }}>
                      {todo.title}
                    </p>
                    <div style={styles.cardBottom}>
                      <span style={styles.timeAgo}>{timeAgo(todo.createdAt)}</span>
                      <button
                        style={{ ...styles.doneBtn, ...styles.restoreBtn }}
                        onClick={() => restoreTodo(todo.id)}
                      >
                        Restore ↩
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Task</h2>
              <button style={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>

            <label style={styles.label}>Task name</label>
            <input
              ref={inputRef}
              style={styles.input}
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />

            <label style={styles.label}>Category</label>
            <div style={styles.tagGrid}>
              {TAGS.map((t) => {
                const tc = TAG_COLORS[t];
                const selected = newTag === t;
                return (
                  <button
                    key={t}
                    onClick={() => setNewTag(t)}
                    style={{
                      ...styles.tagOption,
                      background: selected ? tc.bg : "#F8F8F8",
                      color: selected ? tc.text : "#888",
                      border: selected ? `1.5px solid ${tc.dot}` : "1.5px solid transparent",
                    }}
                  >
                    <span style={{ ...styles.tagDot, background: tc.dot }} />
                    {t}
                  </button>
                );
              })}
            </div>

            <button
              style={{
                ...styles.submitBtn,
                opacity: newTitle.trim() ? 1 : 0.4,
                cursor: newTitle.trim() ? "pointer" : "not-allowed",
              }}
              onClick={addTodo}
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F1EC; }

        button:hover { filter: brightness(0.95); }

        .done-btn:hover { background: #16a34a !important; color: white !important; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: scale(0.94) translateY(-8px); }
        }
        `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#979797",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflowX: "hidden"
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "48px 24px 80px",
    position: "relative",
    zIndex: 1,
    background: "#A4F1EC",
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 32,
    background: "#e00700",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "#999",
    fontWeight: 500,
    marginBottom: 4,
    background: "#00e034db",
  },
  eyebrowWrap: {

    background: "#00ace09a",
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 48,
    fontWeight: 400,
    color: "#1A1A2E",
    lineHeight: 1,
    background: "#a400e09a",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#1A1A2E",
    color: "#F4F1EC",
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.01em",
    boxShadow: "15px 4px 16px rgba(26,26,46,0.98)",
    transition: "all 0.18s",
  },
  addBtnPlus: {
    fontSize: 20,
    lineHeight: 1,
    fontWeight: 300,
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    background: "white",
    borderRadius: 16,
    padding: "16px 28px",
    marginBottom: 36,
    boxShadow: "100px 2px 12px rgba(0,0,0,0.06)",
    gap: 0,
    background: "#00ff95",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    gap: 2,
    background: "#ffea00",
  },
  statNum: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1,
    fontFamily: "'DM Serif Display', serif",
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 36,
    background: "#c98600",
    margin: "0 8px",
  },
  progressBarWrap: {
    width: "80%",
    height: 6,
    background: "#E8E4DC",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #22C55E, #16A34A)",
    borderRadius: 99,
    transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
  },
  section: {
    marginBottom: 40,
        background: "#fa0000",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
     background: "#00fa0c",
  },
  sectionTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    color: "#1A1A2E",
    fontWeight: 400,
  },
  sectionCount: {
    background: "#E8E4DC",
    color: "#666",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    padding: "2px 10px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 16,
    background: "#0068fa",
  },
  card: {
    background: "white",
    borderRadius: 18,
    padding: "18px 18px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
    animation: "slideIn 0.35s cubic-bezier(.4,0,.2,1) both",
    transition: "box-shadow 0.18s, transform 0.18s",
    background: "#d57917",
  },
  cardDone: {
    background: "#FAFAF8",
    boxShadow: "none",
    border: "1px dashed #DDD",
  },
  cardLeaving: {
    animation: "fadeOut 0.35s forwards",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#d5d517",
  },
  tagPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    borderRadius: 99,
    padding: "3px 10px 3px 7px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#CCC",
    fontSize: 18,
    cursor: "pointer",
    lineHeight: 1,
    padding: "0 2px",
    fontFamily: "sans-serif",
    transition: "color 0.15s",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: "#1A1A2E",
    lineHeight: 1.4,
    flex: 1,
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeAgo: {
    fontSize: 11,
    color: "#BBB",
  },
  doneBtn: {
    background: "#F0FFF4",
    color: "#16A34A",
    border: "none",
    borderRadius: 8,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.15s, color 0.15s",
  },
  restoreBtn: {
    background: "#F0F4FF",
    color: "#3B5BDB",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "28px 24px",
    background: "white",
    borderRadius: 18,
    border: "1.5px dashed #DDD",
  },
  emptyIcon: {
    fontSize: 22,
    color: "#22C55E",
  },
  emptyText: {
    color: "#AAA",
    fontSize: 14,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20,20,40,0.35)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    animation: "slideIn 0.2s both",
  },
  modal: {
    background: "white",
    borderRadius: 24,
    padding: "32px 28px 28px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
    animation: "slideIn 0.28s cubic-bezier(.4,0,.2,1) both",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    background: "#1da942"
  },
  modalTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: "#1A1A2E",
    fontWeight: 400,
  },
  modalClose: {
    background: "#F4F1EC",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    fontSize: 18,
    cursor: "pointer",
    color: "#888",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 8,
    background: "#add6b8"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1.5px solid #E8E4DC",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1A1A2E",
    background: "#FAFAF8",
    outline: "none",
    marginBottom: 20,
    transition: "border 0.15s",
  },
  tagGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    background: "#1cb846"
  },
  tagOption: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 99,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  submitBtn: {
    width: "100%",
    background: "#1A1A2E",
    color: "#F4F1EC",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.15s",
    letterSpacing: "0.02em",
  },
};
