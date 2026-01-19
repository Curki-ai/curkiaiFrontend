import "../../../Styles/BroadcastMessage.css";

const BroadcastMessage = ({ message }) => {
  const variant = message.variant || "info"; // info | success

  return (
    <div className="broadcast-wrapper">
      <div className={`broadcast-bubble ${variant}`}>
        <div className="broadcast-body">
          {message.text}
        </div>
      </div>

      <div className="broadcast-time">
        {message.time}
      </div>
    </div>
  );
};

export default BroadcastMessage;
