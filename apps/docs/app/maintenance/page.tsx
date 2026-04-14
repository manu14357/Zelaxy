type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function MaintenancePage({ searchParams }: { searchParams: SearchParams }) {
  const resolved = await searchParams
  const error = typeof resolved.error === 'string' ? resolved.error : ''
  const nextPath = typeof resolved.next === 'string' ? resolved.next : '/'

  const errorMessage =
    error === 'invalid'
      ? 'Access key is invalid. Please try again.'
      : error === 'config'
        ? 'Access is not configured yet. Please contact the administrator.'
        : ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #000000;
          --surface: rgba(255,255,255,0.04);
          --surface-hover: rgba(255,255,255,0.07);
          --border: rgba(255,255,255,0.09);
          --border-focus: rgba(255,255,255,0.25);
          --text-primary: #f0f0f0;
          --text-secondary: rgba(240,240,240,0.45);
          --text-tertiary: rgba(240,240,240,0.28);
          --accent: #ffffff;
          --accent-btn: rgba(255,255,255,0.92);
          --accent-btn-text: #000000;
          --error-bg: rgba(255,80,80,0.06);
          --error-border: rgba(255,80,80,0.18);
          --error-text: #ff8080;
          --dot: rgba(255,255,255,0.55);
        }

        body {
          font-family: 'Geist', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .page {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          overflow: hidden;
        }

        .page::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 110%, rgba(255,255,255,0.025) 0%, transparent 60%);
          pointer-events: none;
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%);
          pointer-events: none;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 460px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--surface);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          padding: 48px 44px 44px;
          animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 20px; right: 20px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.18) 60%, transparent);
          border-radius: 1px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 99px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 36px;
          animation: fadeUp 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }

        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          animation: pulse 2.4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }

        .icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
          animation: fadeUp 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) both;
        }

        .icon-wrap svg {
          opacity: 0.65;
        }

        h1 {
          font-size: 26px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: var(--text-primary);
          margin-bottom: 12px;
          animation: fadeUp 0.7s 0.18s cubic-bezier(0.22,1,0.36,1) both;
        }

        .sub {
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-secondary);
          font-weight: 400;
          max-width: 340px;
          animation: fadeUp 0.7s 0.22s cubic-bezier(0.22,1,0.36,1) both;
        }

        .private-toggle {
          animation: fadeUp 0.7s 0.26s cubic-bezier(0.22,1,0.36,1) both;
          margin-top: 36px;
          text-align: center;
        }

        details { list-style: none; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }

        .toggle-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-tertiary);
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: color 0.15s;
          user-select: none;
          outline: none;
          border: none;
          background: none;
          padding: 0;
        }

        .toggle-link:hover { color: var(--text-secondary); }

        .toggle-link svg {
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), opacity 0.15s;
          opacity: 0.5;
        }

        details[open] .toggle-link svg.chevron {
          transform: rotate(180deg);
        }

        .form-reveal {
          overflow: hidden;
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.32s cubic-bezier(0.22,1,0.36,1);
          margin-top: 0;
        }

        details[open] .form-reveal {
          grid-template-rows: 1fr;
          margin-top: 20px;
        }

        .form-inner {
          min-height: 0;
        }

        .input-wrap {
          position: relative;
          margin-bottom: 10px;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.3;
          pointer-events: none;
        }

        input[type="password"] {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 13px 16px 13px 42px;
          font-size: 14px;
          font-family: inherit;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
        }

        input[type="password"]::placeholder { color: var(--text-tertiary); }

        input[type="password"]:focus {
          border-color: var(--border-focus);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.04);
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid var(--error-border);
          background: var(--error-bg);
          font-size: 13px;
          color: var(--error-text);
          margin-bottom: 10px;
        }

        button[type="submit"] {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          border: none;
          background: var(--accent-btn);
          color: var(--accent-btn-text);
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }

        button[type="submit"]:hover { opacity: 0.88; transform: translateY(-1px); }
        button[type="submit"]:active { opacity: 0.75; transform: translateY(0); }

        .footer {
          margin-top: 28px;
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: center;
          animation: fadeUp 0.7s 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }

        @media (max-width: 480px) {
          .card { padding: 36px 28px 32px; border-radius: 16px; }
          h1 { font-size: 22px; }
        }
      `}</style>

      <main className='page'>
        <div className='grid-bg' aria-hidden='true' />

        <div className='card'>
          <div>
            <div className='status-pill'>
              <span className='status-dot' />
              Maintenance in progress
            </div>
          </div>

          <div className='icon-wrap'>
            <svg
              viewBox='0 0 24 24'
              width='22'
              height='22'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.6'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
          </div>

          <h1>Down for maintenance</h1>
          <p className='sub'>
            We're making improvements to deliver a better experience. Public access is temporarily
            paused and will be restored shortly.
          </p>

          <div className='private-toggle'>
            <details open={!!errorMessage || undefined}>
              <summary className='toggle-link'>
                <svg
                  width='13'
                  height='13'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='3' y='11' width='18' height='11' rx='2' />
                  <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                </svg>
                Private access
                <svg
                  className='chevron'
                  width='12'
                  height='12'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M6 9l6 6 6-6' />
                </svg>
              </summary>

              <div className='form-reveal'>
                <div className='form-inner'>
                  <form action='/api/maintenance/unlock' method='POST'>
                    <input type='hidden' name='next' value={nextPath} />

                    <div className='input-wrap'>
                      <span className='input-icon'>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <rect x='3' y='11' width='18' height='11' rx='2' />
                          <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                        </svg>
                      </span>
                      <input
                        id='password'
                        name='password'
                        type='password'
                        autoComplete='off'
                        required
                        placeholder='Access key'
                        aria-label='Access key'
                      />
                    </div>

                    {errorMessage && (
                      <div className='error-msg' role='alert'>
                        <svg
                          width='13'
                          height='13'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <circle cx='12' cy='12' r='10' />
                          <path d='M12 8v4M12 16h.01' />
                        </svg>
                        {errorMessage}
                      </div>
                    )}

                    <button type='submit'>Continue →</button>
                  </form>
                </div>
              </div>
            </details>
          </div>

          <p className='footer'>Thanks for your patience — we'll be back shortly.</p>
        </div>
      </main>
    </>
  )
}
