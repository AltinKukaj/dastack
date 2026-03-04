"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily:
            "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.6875rem",
              letterSpacing: "0.2em",
              color: "#404040",
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            500
          </p>
          <h1
            style={{
              margin: "20px 0 0",
              fontSize: "1.875rem",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "0.875rem",
              lineHeight: 1.75,
              color: "#525252",
            }}
          >
            A critical error occurred while rendering the application.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "32px",
              borderRadius: "8px",
              border: "1px solid #262626",
              backgroundColor: "transparent",
              padding: "10px 20px",
              fontSize: "0.875rem",
              color: "#a3a3a3",
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
