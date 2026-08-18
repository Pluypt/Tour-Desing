export default function Loading() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "16px"
    }}>
      <div style={{
        width: "42px",
        height: "42px",
        border: "3px solid #f0f0f0",
        borderTop: "3px solid var(--pr-red)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ color: "var(--pr-text-muted)", fontSize: "0.95rem", fontWeight: 500 }}>
        กำลังโหลดข้อมูล...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
