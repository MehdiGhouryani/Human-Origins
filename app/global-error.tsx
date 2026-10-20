'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main className="route-error" role="alert">
          <div className="route-error-card">
            <span className="eyebrow">SYSTEM ERROR</span>
            <h1>An unexpected error occurred.</h1>
            <p>The application encountered an unexpected error. Resetting the view is safe.</p>
            <button type="button" onClick={() => reset()}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  )
}
