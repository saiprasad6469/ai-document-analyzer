import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
    if (!form.password) return "Password is required";
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

      // Backend expected route example:
      // POST http://localhost:5000/auth/login
      const res = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Typical backend returns token like: { token: "...", user: {...} }
      const token = res.data?.token;

      if (token) {
        localStorage.setItem("token", token);
        setAuthToken(token);
      }

      setMsg({ type: "success", text: res.data?.message || "Login successful" });

      // For now, navigate anywhere (replace with your dashboard route later)
      setTimeout(() => navigate("/dashboard"), 250);
    } catch (error) {
      const text =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Welcome back</h1>
        <p className="authSub">Login to continue</p>

        {msg.text ? (
          <div className={`alert ${msg.type === "error" ? "alertError" : "alertSuccess"}`}>
            {msg.text}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="authForm">
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
            placeholder="Your password"
            autoComplete="current-password"
          />

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="authFooter">
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}