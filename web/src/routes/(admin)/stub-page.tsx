// Màn nằm trong sidebar nhưng backend chưa có endpoint — stub như design.
export function AdminStubPage({ title }: { title: string }) {
  return (
    <div
      style={{
        background: 'var(--c-white)',
        border: '3px solid var(--c-ink)',
        borderRadius: 12,
        boxShadow: '5px 5px 0 var(--c-ink)',
        padding: 60,
        textAlign: 'center',
        maxWidth: 560,
        margin: '40px auto',
      }}
    >
      <div style={{ fontSize: 46 }}>🚧</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, marginTop: 10 }}>{title}</div>
      <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>
        Màn này cần endpoint backend (đối soát/đơn hàng/quản lý user) — chưa nằm trong phạm vi hiện tại.
      </div>
    </div>
  );
}
