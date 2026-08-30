// import { Link, useLocation, useNavigate } from 'react-router-dom'
// import { logout } from '../services/api'
// import NotificationBell from './NotificationBell'

// function Navbar() {
//   const { pathname } = useLocation()
//   const navigate = useNavigate()

//   function handleLogout() {
//     logout()
//     navigate('/login')
//   }

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

//         .navbar {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           z-index: 100;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0 2rem;
//           height: 60px;
//           background: rgba(8,8,16,0.85);
//           backdrop-filter: blur(12px);
//           -webkit-backdrop-filter: blur(12px);
//           border-bottom: 1px solid rgba(255,255,255,0.06);
//           font-family: 'Inconsolata', monospace;
//         }

//         .nav-slot {
//           height: 60px;
//         }

//         .nav-logo {
//           font-family: 'Syne', sans-serif;
//           font-size: 1.15rem;
//           font-weight: 800;
//           color: #fff;
//           text-decoration: none;
//           letter-spacing: -0.02em;
//         }
//         .nav-logo span { color: #f59e0b; }

//         .nav-links {
//           display: flex;
//           align-items: center;
//           gap: 0.25rem;
//         }

//         .nav-link {
//           position: relative;
//           padding: 0.4rem 0.9rem;
//           font-family: 'Inconsolata', monospace;
//           font-size: 0.82rem;
//           font-weight: 500;
//           letter-spacing: 0.08em;
//           text-transform: uppercase;
//           color: rgba(232,232,240,0.4);
//           text-decoration: none;
//           border-radius: 6px;
//           transition: color 0.2s, background 0.2s;
//         }
//         .nav-link:hover {
//           color: rgba(232,232,240,0.85);
//           background: rgba(255,255,255,0.05);
//         }
//         .nav-link.active {
//           color: #f59e0b;
//           background: rgba(245,158,11,0.08);
//         }
//         .nav-link.active::after {
//           content: '';
//           position: absolute;
//           bottom: -1px;
//           left: 0.9rem;
//           right: 0.9rem;
//           height: 1px;
//           background: #f59e0b;
//           border-radius: 1px;
//         }

//         button.nav-link {
//           background: transparent;
//           border: none;
//           cursor: pointer;
//           font-family: inherit;
//         }

//         @media (max-width: 500px) {
//           .navbar { padding: 0 1rem; }
//           .nav-link { padding: 0.4rem 0.6rem; font-size: 0.75rem; }
//           .nav-logo { font-size: 1rem; }
//         }
//       `}</style>

//       <nav className="navbar">
//         <Link to="/dashboard" className="nav-logo">
//           spend<span>wise</span>
//         </Link>

//         <div className="nav-links">
//           <Link to="/dashboard" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
//             Dashboard
//           </Link>
//           <Link to="/add" className={`nav-link${pathname === '/add' ? ' active' : ''}`}>
//             Add
//           </Link>
//           <Link to="/expenses" className={`nav-link${pathname === '/expenses' ? ' active' : ''}`}>
//             Expenses
//           </Link>
//           <Link to="/budgets" className={`nav-link${pathname === '/budgets' ? ' active' : ''}`}>
//             Budgets
//           </Link>
//           <Link to="/recurring-expenses" className={`nav-link${pathname === '/recurring-expenses' ? ' active' : ''}`}>
//             Recurring Expenses
//           </Link>
//           <Link to="/chat" className={`nav-link${pathname === '/chat' ? ' active' : ''}`}>
//             Chat
//           </Link>
//           <Link to="/settings" className={`nav-link${pathname === '/settings' ? ' active' : ''}`}>
//             Settings
//           </Link>
//           <NotificationBell />
//           <button className="nav-link nav-logout" onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       </nav>
//       <div className="nav-slot" />
//     </>
//   )
// }

// export default Navbar

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/api'
import NotificationBell from './NotificationBell'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/add', label: 'Add' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/recurring-expenses', label: 'Recurring' },
  { to: '/chat', label: 'Chat' },
  { to: '/settings', label: 'Settings' },
]

// Small terminal-style clock — echoes the ticker/scanline touches on the
// dashboard so the "live system" feel carries across the whole app.
function useClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time.toLocaleTimeString('en-GB', { hour12: false })
}

function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const clock = useClock()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  })

  const activePath =
    NAV_ITEMS.find((item) => item.to === pathname)?.to ??
    (pathname === '/' ? '/dashboard' : undefined)

  useLayoutEffect(() => {
    const el = activePath ? linkRefs.current[activePath] : null
    if (el) {
      setPillStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
    } else {
      setPillStyle((s) => ({ ...s, opacity: 0 }))
    }
  }, [activePath, menuOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 60px;
          background: rgba(8,8,16,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-family: 'Inconsolata', monospace;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .navbar.scrolled {
          border-bottom-color: rgba(245,158,11,0.18);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }

        .nav-slot {
          height: 60px;
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
        }
        .nav-logo span { color: #f59e0b; }
        .nav-logo::after {
          content: '_';
          color: #f59e0b;
          margin-left: 2px;
          animation: blink 1.1s steps(1) infinite;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-links {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .nav-pill {
          position: absolute;
          top: 0;
          bottom: 0;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.22);
          border-radius: 6px;
          transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
          pointer-events: none;
        }

        .nav-link {
          position: relative;
          z-index: 1;
          padding: 0.4rem 0.9rem;
          font-family: 'Inconsolata', monospace;
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.4);
          text-decoration: none;
          border-radius: 6px;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: rgba(232,232,240,0.85);
        }
        .nav-link.active {
          color: #f59e0b;
        }

        .nav-link:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }

        button.nav-link {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .nav-clock {
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: rgba(232,232,240,0.35);
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .nav-clock-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 5px rgba(16,185,129,0.9);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .nav-divider {
          width: 1px;
          height: 20px;
          background: rgba(255,255,255,0.1);
        }

        .nav-hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .nav-hamburger span {
          width: 20px;
          height: 2px;
          background: #e8e8f0;
          transition: transform 0.25s, opacity 0.25s;
        }

        .nav-hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .nav-hamburger.open span:nth-child(2) { opacity: 0; }
        .nav-hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        .nav-mobile-panel {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 99;
          background: rgba(8,8,16,0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(245,158,11,0.15);
          display: flex;
          flex-direction: column;
          padding: 0.5rem 1rem 1rem;
          animation: slideDown 0.22s ease both;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-mobile-panel .nav-link {
          padding: 0.75rem 0.5rem;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-logo::after { animation: none; }
          .nav-clock-dot { animation: none; }
          .nav-pill { transition: none; }
          .nav-mobile-panel { animation: none; }
        }

        @media (max-width: 860px) {
          .nav-center { display: none; }
          .nav-hamburger { display: flex; }
          .nav-clock { display: none; }
        }

        @media (max-width: 500px) {
          .navbar { padding: 0 1rem; }
          .nav-logo { font-size: 1rem; }
        }
      `}</style>

      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/dashboard" className="nav-logo">
          spend<span>wise</span>
        </Link>

        <div className="nav-center">
          <div className="nav-links">
            <div className="nav-pill" style={pillStyle} aria-hidden="true" />
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                ref={(el) => {
                  linkRefs.current[item.to] = el
                }}
                className={`nav-link${activePath === item.to ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-right">
          <span className="nav-clock" title="Local time">
            <span className="nav-clock-dot" aria-hidden="true" />
            {clock}
          </span>
          <div className="nav-divider" />
          <NotificationBell />
          <button className="nav-link" onClick={handleLogout}>
            Logout
          </button>
          <button
            className={`nav-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-mobile-panel">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link${activePath === item.to ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <div className="nav-slot" />
    </>
  )
}

export default Navbar