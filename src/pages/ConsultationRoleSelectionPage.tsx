import { Link } from "react-router-dom"
import { doctors, wards } from "./consultation/shared"

export default function ConsultationRoleSelectionPage() {
  return (
    <div className="consultation-root">
      <div className="page role-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Hospital Video Call Dashboard</p>
            <h1>Choose your role</h1>
            <p className="subtitle">
              Secure, fast ward communication for doctors and nursing stations.
            </p>
          </div>
          <div className="status-chip status-chip--ready">2 Doctors - 2 Wards</div>
        </header>

        <div className="role-grid">
          <section className="role-card role-card--doctor">
            <div className="role-card__icon">MD</div>
            <h2>Doctor</h2>
            <p>Pick a doctor profile to open the console.</p>
            <div className="select-list">
              {doctors.map((doctor) => (
                <Link
                  key={doctor.id}
                  to={`/consultation/doctor/${doctor.id}`}
                  className="select-link"
                >
                  <span className="select-name">{doctor.name}</span>
                  <span className="select-tag">Doctor</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="role-card role-card--ward">
            <div className="role-card__icon">WARD</div>
            <h2>Ward</h2>
            <p>Choose a ward station to receive calls.</p>
            <div className="select-list">
              {wards.map((ward) => (
                <Link
                  key={ward.id}
                  to={`/consultation/ward/${ward.id}`}
                  className="select-link"
                >
                  <span className="select-name">{ward.name}</span>
                  <span className="select-tag">Ward</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}