import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
    if (!form.password) return "Password is required";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const token = res.data?.token;

      if (token) {
        localStorage.setItem("token", token);
        setAuthToken(token);
      }

      setMsg({ type: "success", text: res.data?.message || "Registered successfully." });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const text = error?.response?.data?.message || error?.message || "Registration failed";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Create account</h1>
        <p className="authSub">AI Document Analyzer • Frontend</p>

        {msg.text ? (
          <div className={`alert ${msg.type === "error" ? "alertError" : "alertSuccess"}`}>
            {msg.text}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="authForm">
          <label className="label">Name</label>
          <input
            className="input"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Your name"
            autoComplete="name"
          />

          <label className="label">Email</label>
          <input
            className="input"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label className="label">Password</label>
          <input
            className="input"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <div className="authFooter">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}