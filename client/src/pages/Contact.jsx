import { useState, useEffect } from "react";
import MobileHeader from "../components/MobileHeader";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [feedback, setFeedback] = useState({
    type: "",
    text: "",
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!feedback.text) return;

    const timer = setTimeout(() => {
      setFeedback({ type: "", text: "" });
    }, 4000);

    return () => clearTimeout(timer);
  }, [feedback]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      return setFeedback({
        type: "error",
        text: "Please fill in all fields.",
      });
    }

    try {
      setLoading(true);

      await api.post("/api/user/help", {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      setName("");
      setEmail("");
      setMessage("");

      setFeedback({
        type: "success",
        text: "Your message has been sent successfully.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileHeader title="Contact Us" />

      <div className="container py-4 px-3" style={{ maxWidth: 700 }}>
        <h2 className="fw-bold mb-4">Contact Us</h2>

        {/* Feedback */}
        {feedback.text && (
          <div
            className={`d-flex align-items-center gap-2 px-2 py-2 rounded-3 shadow-sm border mb-4 ${
              feedback.type === "success"
                ? "bg-success-subtle border-success text-success"
                : "bg-danger-subtle border-danger text-danger"
            }`}
          >
            <i
              className={`bi ${
                feedback.type === "success"
                  ? "bi-check-circle-fill"
                  : "bi-exclamation-circle-fill"
              } fs-5`}
            />

            <div className="fw-medium">{feedback.text}</div>
          </div>
        )}
        <button onClick={() => navigate("/profile")}>PROFILE</button>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Name</label>

            <input
              className="form-control py-2"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>

            <input
              type="email"
              className="form-control py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Message</label>

            <textarea
              className="form-control"
              rows={5}
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-brand w-100 py-2 fw-semibold"
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Sending...
              </>
            ) : (
              <>
                <i className="bi bi-send-fill me-2"></i>
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}