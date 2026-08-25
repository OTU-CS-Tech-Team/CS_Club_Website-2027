import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        CS Club
      </Link>
      <Link to="/">Home</Link>
      <Link to="/team">Team</Link>
      <Link to="/hackhive">HackHive</Link>
      <Link to="/events">Events</Link>
      <Link to="/careers">Careers</Link>
      <Link to="/login">Log in</Link>
      <Link to="/passport">Passport</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
}

export default Navbar;
