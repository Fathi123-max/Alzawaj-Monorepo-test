"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <div style={{ padding: "2rem" }}>
          <h2>Something went wrong!</h2>
          <p>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
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
