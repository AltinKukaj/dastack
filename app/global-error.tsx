/** Global error boundary — renders a standalone HTML shell when the root layout itself errors. */
"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          <p
            style={{
              fontSize: 11,
              color: "#555",
              fontFamily: "monospace",
            }}
          >
            500
          </p>
          <h1 style={{ marginTop: 20, fontSize: 28, fontWeight: 400 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#666", lineHeight: 1.7 }}>
            A critical error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              padding: "10px 20px",
              fontSize: 14,
              color: "#999",
              background: "transparent",
              border: "1px solid #333",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
