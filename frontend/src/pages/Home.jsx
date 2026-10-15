import { Link, useOutletContext } from 'react-router-dom'

function Home() {
  // Fetched from /customers/me by ProtectedRoute
  const { customer } = useOutletContext()

  return (
    <main className="home">
      <section className="welcome">
        <h1>Welcome, {customer.fullName.split(' ')[0]}! 👋</h1>
        <p>Happy shopping at ShopKart.</p>
      </section>

      <section className="card profile">
        <div className="avatar">{customer.fullName.charAt(0).toUpperCase()}</div>
        <dl>
          <dt>Name</dt>
          <dd>{customer.fullName}</dd>
          <dt>Email</dt>
          <dd>{customer.email}</dd>
          <dt>Phone</dt>
          <dd>{customer.phone}</dd>
        </dl>
      </section>

      <Link to="/products" className="btn btn-primary btn-cta">
        Browse products →
      </Link>
    </main>
  )
}

export default Home
