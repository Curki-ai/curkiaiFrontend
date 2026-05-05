import React from "react";
import "../../../Styles/RosteringModule/ClientDetailsPage.css";
import "../../../Styles/RosteringModule/SMSBroadcastSuccess.css";
import BroadcastSuccess from "./BroadCaseSucces";
import tickImage from "../../../Images/Tick.jpg"
const ClientDetailsPage = ({
  client,
  interactionHistory,
  supportWorkers = [],
  onBroadcastClick,
  smsBroadcasted,
}) => {
  console.log(supportWorkers);
  console.log("client",client);
  if (smsBroadcasted) {
    return <BroadcastSuccess imageSrc={tickImage} message="SMS Broadcasted" />;
  }
  return (
    <div className="client-page-container">
      <nav className="breadcrumb">
        <span className="breadcrumb-link">Visual Care</span> /{" "}
        <span className="breadcrumb-current">{client.name}</span>
      </nav>

      <div className="client-header">
        <img
          src={client.image.clientImage}
          alt={client.name}
          className="client-avatar"
        />
        <div className="client-info">
          <h2 className="client-name">{client.name}</h2>
          <p className="client-dob">DOB: {client.dob}</p>
        </div>
      </div>

      <section className="details-section">
        <h3 className="section-title">Service Details</h3>
        <div className="service-details-row">
          <div className="service-type">In-Home Care</div>
          <div className="service-date">Starting date {client.startDate}</div>
        </div>
      </section>

      <section className="details-section">
        <h3 className="section-title">Contact Information</h3>
        <div className="contact-row">
          <div className="contact-item">
            <strong className="contact-label">Address</strong>
            <p className="contact-value">{client.address}</p>
          </div>
          <div className="contact-item">
            <strong className="contact-label">Phone</strong>
            <p className="contact-value">{client.phone}</p>
          </div>
        </div>
      </section>

      <section className="details-section">
        <h3 className="section-title">Interaction History</h3>
        <div className="interaction-list">
          {interactionHistory.map((item, index) => (
            <div key={index} className="interaction-item">
              <div className="interaction-icon">
                {item.type === "meeting" ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                )}
              </div>
              <div className="interaction-content">
                <p className="interaction-title">{item.title}</p>
                <p className="interaction-date">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="broadcast-container">
        <button className="broadcast-btn" onClick={onBroadcastClick}>
          Broadcast SMS to Workers
        </button>
      </div>

      <section className="workers-section">
        <div className="workers-grid">
          {supportWorkers.map((worker, index) => (
            <div className="worker-card" key={index}>
              <div className="worker-avatar-container">
                <img
                  src={worker.image.supportWorkerImage}
                  alt={worker.name}
                  className="worker-avatar"
                />
              </div>
              <h4 className="worker-name">{worker.name}</h4>
              <a href={worker.profileLink} className="view-profile-link">
                View Full Profile
              </a>
              <div className="worker-details">
                <p className="worker-rate">{worker.rate}</p>
                <p className="worker-demographics">{worker.ageGender}</p>
                <p className="worker-experience">{worker.experience}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ClientDetailsPage;
