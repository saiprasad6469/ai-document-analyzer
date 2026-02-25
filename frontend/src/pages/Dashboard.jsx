import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, setAuthToken } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// ---------- user ----------
function readUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "US";
  const base = s.includes("@") ? s.split("@")[0] : s;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const two = (parts[0] || base).replace(/[^a-zA-Z0-9]/g, "").slice(0, 2);
  return (two || "US").toUpperCase();
}

function hashToHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
function makeAvatarBg(seed) {
  const hue = hashToHue(seed || "user");
  const h1 = hue;
  const h2 = (hue + 40) % 360;
  const h3 = (hue + 80) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h1} 85% 55%), hsl(${h2} 85% 50%), hsl(${h3} 85% 45%))`,
    boxShadow: `0 10px 25px rgba(0,0,0,0.35), 0 0 0 3px rgba(255,255,255,0.10) inset`,
  };
}

function truncate(str, n) {
  const s = str || "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function isMobileWidth() {
  return window.matchMedia("(max-width: 980px)").matches;
}

export default function Dashboard() {
  const fileRef = useRef(null);
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(() => readUser());
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileWidth());

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [docs, setDocs] = useState([]);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (token) setAuthToken(token);
    else setAuthToken(null);
  }, [token]);

  useEffect(() => {
    const onResize = () => {
      if (isMobileWidth()) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const dbUser = res.data?.user;
        if (dbUser) {
          setUser(dbUser);
          localStorage.setItem("user", JSON.stringify(dbUser));
        }
      } catch {}
    })();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const loadChats = async () => {
      const res = await api.get("/chats");
      const list = res.data?.chats || [];

      if (!list.length) {
        const created = await api.post("/chats");
        const chat = created.data?.chat;
        setChats([chat]);
        setActiveChatId(chat?.id || null);
      } else {
        setChats(list);
        setActiveChatId((prev) => prev || list[0]?.id || null);
      }
    };

    loadChats();
  }, [token]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const activeSessionId = activeChat?.sessionId || null;

  useEffect(() => {
    if (!token || !activeChatId) return;
    (async () => {
      const res = await api.get(`/chats/${activeChatId}`);
      setMessages(res.data?.chat?.messages || []);
    })();
  }, [token, activeChatId]);

  useEffect(() => {
    if (!token || !activeSessionId) return;
    (async () => {
      const res = await api.get("/docs/mine", {
        headers: { "x-session-id": activeSessionId },
      });
      setDocs(res.data?.docs || []);
    })();
  }, [token, activeSessionId]);

  const docsCountText = useMemo(() => {
    const count = docs.length;
    if (count === 0) return "No documents uploaded";
    if (count === 1) return "1 document ready";
    return `${count} documents ready`;
  }, [docs]);

  const displayName =
    user?.name || user?.fullName || user?.username || user?.email || "User";
  const displaySub =
    user?.email && displayName !== user.email ? user.email : "";
  const initials = getInitials(displayName);

  const avatarBg = makeAvatarBg(displayName);
  const avatarStyle = {
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
    userSelect: "none",
    color: "white",
    ...avatarBg,
    border: "1px solid rgba(255,255,255,0.22)",
  };

  const newChat = async () => {
    const res = await api.post("/chats");
    const chat = res.data?.chat;
    if (!chat?.id) return;

    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setQuestion("");
    setDocs([]);
    setMessages(chat.messages || []);

    if (isMobileWidth()) setSidebarOpen(false);
  };

  const deleteChat = async (id) => {
    await api.delete(`/chats/${id}`);
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const nextActive =
        (activeChatId === id ? next[0]?.id : activeChatId) || null;
      setActiveChatId(nextActive);
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    window.location.href = "/login";
  };

  const onPickFiles = () => fileRef.current?.click();

  const askQuestion = async () => {
    const q = question.trim();
    if (!q || !activeChatId || !activeSessionId) return;

    setQuestion("");

    try {
      setAsking(true);

      await api.post(`/chats/${activeChatId}/messages`, {
        role: "user",
        content: q,
      });

      const res = await api.post(
        "/docs/ask",
        { question: q },
        { headers: { "x-session-id": activeSessionId } }
      );

      await api.post(`/chats/${activeChatId}/messages`, {
        role: "assistant",
        content: res.data?.answer || "No answer returned.",
      });

      const chatRes = await api.get(`/chats/${activeChatId}`);
      setMessages(chatRes.data?.chat?.messages || []);
    } catch (err) {
      const text =
        err?.response?.data?.message || err.message || "Question failed";

      await api.post(`/chats/${activeChatId}/messages`, {
        role: "assistant",
        content: `❌ ${text}`,
      });

      const chatRes = await api.get(`/chats/${activeChatId}`);
      setMessages(chatRes.data?.chat?.messages || []);
    } finally {
      setAsking(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!asking) askQuestion();
    }
  };

  const onSelectChat = (id) => {
    setActiveChatId(id);
    if (isMobileWidth()) setSidebarOpen(false);
  };

  return (
    <div className="appShell">
      {sidebarOpen && isMobileWidth() ? (
        <div
          className="sidebarBackdrop"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebarTop">
          <div className="sidebarBrand">AI Document Analyzer</div>
          <button className="btnPrimary" onClick={newChat}>
            + New chat
          </button>
        </div>

        <div className="sidebarList">
          {chats.map((c) => {
            const active = c.id === activeChatId;
            return (
              <div
                key={c.id}
                className={`chatRow ${active ? "active" : ""}`}
                onClick={() => onSelectChat(c.id)}
              >
                <div className="chatRowTitle">{c.title || "New chat"}</div>
                <button
                  className="iconBtn"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    deleteChat(c.id);
                  }}
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>

        <div className="sidebarBottom">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={avatarStyle}>{initials}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{displayName}</div>
              {displaySub && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>{displaySub}</div>
              )}
            </div>
          </div>

          <div className="pill">{token ? "Logged in" : "No token"}</div>
          <button className="btnGhost" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="mainHeader">
          <div className="headerLeft">
            <button
              className="hamburgerBtn headerHamburger"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              ☰
            </button>

            <div>
              <div className="headerTitle">Ask Questions</div>
              <div className="headerSub">{docsCountText}</div>
            </div>
          </div>

          <div className="headerRight">
            {uploading && <div className="pill">Uploading…</div>}
            {asking && <div className="pill">Thinking…</div>}
          </div>
        </header>

        <div className="chatBox">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`msg ${m.role === "user" ? "msgUser" : "msgAi"}`}
            >
              <div className="msgRole">
                {m.role === "user" ? "You" : "AI"}
              </div>
              <div className="msgText">{m.content}</div>
            </div>
          ))}
        </div>

        <div className="chatInputBar">
          <button className="plusBtn" onClick={onPickFiles}>
            +
          </button>

          <textarea
            className="chatInput"
            placeholder="Ask a question…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
          />

          <button className="btnPrimary" onClick={askQuestion}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}