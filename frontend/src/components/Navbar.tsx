import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const { pathname } = useLocation()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

        .navbar {
          position: sticky;
          top: 0;
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
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .nav-logo span { color: #f59e0b; }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .nav-link {
          position: relative;
          padding: 0.4rem 0.9rem;
          font-family: 'Inconsolata', monospace;
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.4);
          text-decoration: none;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover {
          color: rgba(232,232,240,0.85);
          background: rgba(255,255,255,0.05);
        }
        .nav-link.active {
          color: #f59e0b;
          background: rgba(245,158,11,0.08);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0.9rem;
          right: 0.9rem;
          height: 1px;
          background: #f59e0b;
          border-radius: 1px;
        }

        @media (max-width: 500px) {
          .navbar { padding: 0 1rem; }
          .nav-link { padding: 0.4rem 0.6rem; font-size: 0.75rem; }
          .nav-logo { font-size: 1rem; }
        }
      `}</style>

      <nav className="navbar">
        <Link to="/" className="nav-logo">
          spend<span>wise</span>
        </Link>

        <div className="nav-links">
          <Link to="/dashboard" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/add" className={`nav-link${pathname === '/add' ? ' active' : ''}`}>
            Add
          </Link>
          <Link to="/expenses" className={`nav-link${pathname === '/expenses' ? ' active' : ''}`}>
            Expenses
          </Link>
        </div>
      </nav>
    </>
  )
}

export default Navbar