import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PolarisLogo } from "./PolarisLogo";
import "./Contact.css";

export function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation check
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("https://formsubmit.co/ajax/surakshasharma303@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Name: form.name,
          Email: form.email,
          Company: form.company || "N/A",
          Subject: form.subject,
          Message: form.message
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === "false") {
        throw new Error(data.message || "Failed to send message.");
      }

      setSubmitted(true);
      setForm({ name: "", email: "", company: "", subject: "", message: "" });
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Top bar */}
      <header className="contact-header">
        <button className="contact-back" onClick={() => navigate(-1)}>
          <span className="contact-back__arrow">←</span>
          <span>Back</span>
        </button>
        <div className="contact-header__logo">
          <PolarisLogo />
        </div>
      </header>

      <main className="contact-main">
        {/* Left: heading + info */}
        <div className="contact-left">
          <div className="contact-left__inner">
            <span className="contact-eyebrow">Contact</span>
            <h1 className="contact-heading">
              Let's build something together.
            </h1>
            <p className="contact-subheading">
              Have a question about Polaris, want to collaborate, or just want to talk logistics?
              Send us a message and we'll get back to you within 24 hours.
            </p>

            <div className="contact-info">
              <div className="contact-info__item">
                <span className="contact-info__label">Email</span>
                <a href="mailto:hello@polaris.app" className="contact-info__value">
                  hello@polaris.app
                </a>
              </div>
              <div className="contact-info__item">
                <span className="contact-info__label">Based in</span>
                <span className="contact-info__value">Punjab, India</span>
              </div>
              <div className="contact-info__item">
                <span className="contact-info__label">Response time</span>
                <span className="contact-info__value">Within 24 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="contact-right">
          {submitted ? (
            <div className="contact-success">
              <div className="contact-success__icon">✓</div>
              <h3 className="contact-success__title">Message sent.</h3>
              <p className="contact-success__body">
                Thank you for reaching out. We will process your message shortly. 
                <br />
                <span style={{ fontSize: "12px", opacity: 0.8 }}>
                  Note: If this is your first submission, please check your inbox to confirm activation.
                </span>
              </p>
              <button className="ps-btn ps-btn--secondary" onClick={() => setSubmitted(false)}>
                Send another
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div style={{ color: "#ff4444", marginBottom: "20px", fontSize: "14px", fontWeight: "500" }}>
                  {error}
                </div>
              )}

              <div className="contact-form__row">
                <div className="contact-form__field">
                  <label className="contact-form__label" htmlFor="name">
                    Full name <span className="contact-form__req">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="contact-form__input"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="contact-form__field">
                  <label className="contact-form__label" htmlFor="email">
                    Email address <span className="contact-form__req">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="contact-form__input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="company">
                  Company / Organisation
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className="contact-form__input"
                  placeholder="Where do you work?"
                  value={form.company}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="subject">
                  Subject <span className="contact-form__req">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="contact-form__input"
                  placeholder="What's this about?"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="message">
                  Message <span className="contact-form__req">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  className="contact-form__textarea"
                  placeholder="Tell us what you need..."
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>

              <button 
                type="submit" 
                className="contact-form__submit ps-btn ps-btn--primary"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send message"}
                {!submitting && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="contact-form__submit-icon">
                    <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

