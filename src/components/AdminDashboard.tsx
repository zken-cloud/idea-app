"use client";

import { useState } from "react";
import Papa from "papaparse";
import Link from "next/link";
import styles from "./AdminDashboard.module.css";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  image: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: Date | string;
  userName: string;
  userEmail: string;
}

interface SummaryRecipient {
  id: string;
  email: string;
}

interface AdminDashboardProps {
  initialUsers: User[];
  initialAuditLogs: AuditLog[];
  initialRecipients: SummaryRecipient[];
  isAdmin?: boolean;
}

export default function AdminDashboard({ initialUsers, initialAuditLogs, initialRecipients, isAdmin = false }: AdminDashboardProps) {
  const [view, setView] = useState<"users" | "audit" | "notifications">("users");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [recipients, setRecipients] = useState<SummaryRecipient[]>(initialRecipients);
  const [newRecipient, setNewRecipient] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" });
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/admin/summary-recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newRecipient }),
    });
    if (response.ok) {
      const created = await response.json();
      setRecipients([...recipients, created]);
      setNewRecipient("");
    } else {
      const data = await response.json();
      alert(data.error || "Failed to add recipient");
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    const response = await fetch(`/api/admin/summary-recipients/${id}`, { method: "DELETE" });
    if (response.ok) {
      setRecipients(recipients.filter((r) => r.id !== id));
    } else {
      alert("Failed to remove recipient");
    }
  };

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/admin/send-summary", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        alert(`Summary sent to ${data.recipients} recipient(s).`);
      } else {
        alert(data.error || "Failed to send summary");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (response.ok) {
      const createdUser = await response.json();
      setUsers([...users, createdUser]);
      setNewUser({ name: "", email: "", role: "user" });
    } else {
      alert("Failed to add user");
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("Parsed CSV:", results.data);
        const response = await fetch("/api/admin/users/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(results.data),
        });

        setIsUploading(false);
        if (response.ok) {
          const result = await response.json();
          alert(`Successfully uploaded ${result.count} users`);
          // Refresh user list
          const updatedUsers = await fetch("/api/admin/users").then((r) => r.json());
          setUsers(updatedUsers);
        } else {
          alert("Failed to upload CSV");
        }
      },
      error: (error) => {
        setIsUploading(false);
        alert(`CSV Parse Error: ${error.message}`);
      },
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
    } else {
        const data = await response.json();
        alert(data.error || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setUsers(users.filter((u) => u.id !== userId));
    } else {
      const data = await response.json();
      alert(data.error || "Failed to delete user");
    }
  };

  const parseDetails = (details: string) => {
    const parts = details.split(/(post c[a-z0-9]{24}|comment c[a-z0-9]{24})/g);
    return parts.map((part, index) => {
      if (part.startsWith("post ")) {
        const id = part.replace("post ", "");
        return (
          <span key={index}>
            post <Link href={`/#post-${id}`} className={styles.link}>{id}</Link>
          </span>
        );
      } else if (part.startsWith("comment ")) {
        const id = part.replace("comment ", "");
        const nextPart = parts[index + 2];
        if (nextPart && nextPart.startsWith("post ")) {
          const postId = nextPart.replace("post ", "");
          return (
            <span key={index}>
              comment <Link href={`/#post-${postId}#comment-${id}`} className={styles.link}>{id}</Link>
            </span>
          );
        }
        return (
          <span key={index}>
            comment <Link href={`/#comment-${id}`} className={styles.link}>{id}</Link>
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          onClick={() => setView("users")}
          className={view === "users" ? styles.activeTab : styles.tab}
        >
          User Management
        </button>
        <button
          onClick={() => setView("audit")}
          className={view === "audit" ? styles.activeTab : styles.tab}
        >
          Audit Logs
        </button>
        {isAdmin && (
          <button
            onClick={() => setView("notifications")}
            className={view === "notifications" ? styles.activeTab : styles.tab}
          >
            Weekly Summary
          </button>
        )}
      </div>

      {view === "users" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>User Management</h2>
          
          {isAdmin && (
          <div className={styles.actions}>
            <form onSubmit={handleAddUser} className={styles.form}>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className={styles.input}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className={styles.select}
              >
                <option value="user">User</option>
                <option value="Admin">Admin</option>
                <option value="Moderator">Moderator</option>
              </select>
              <button type="submit" className={styles.button}>Add User</button>
            </form>

            <div className={styles.csvUpload}>
              <label className={styles.uploadLabel}>
                {isUploading ? "Uploading..." : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className={styles.fileInput}
                  disabled={isUploading}
                />
              </label>
              <Link href="/csv_template_users.csv" className={styles.downloadLink}>
                Download Template
              </Link>
            </div>
          </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.input}
              style={{ width: "100%", maxWidth: "300px" }}
            />
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users
                .filter(
                  (user) =>
                    (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                    (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                )
                .map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role || "user"}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={!isAdmin || user.email === "admin@local"}
                      className={styles.select}
                    >
                      <option value="user">User</option>
                      <option value="Admin">Admin</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                  </td>
                  {isAdmin && (
                  <td>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.email === "admin@local"}
                      className={styles.deleteButton}
                      style={user.email === "admin@local" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    >
                      Delete
                    </button>
                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "notifications" && isAdmin && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Weekly Summary Recipients</h2>
          <p style={{ color: "#666", marginTop: 0 }}>
            These addresses receive the weekly summary email (Mondays). If the list is empty,
            it defaults to all users with the Admin role.
          </p>

          <form onSubmit={handleAddRecipient} className={styles.form}>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.button}>Add Recipient</button>
          </form>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ color: "#888" }}>
                    No recipients configured — defaulting to all Admin users.
                  </td>
                </tr>
              ) : (
                recipients.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteRecipient(r.id)}
                        className={styles.deleteButton}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: "1.5rem", borderTop: "1px solid #eee", paddingTop: "1.5rem" }}>
            <h3 style={{ marginTop: 0 }}>Send on demand</h3>
            <p style={{ color: "#666", marginTop: 0 }}>
              Immediately send the summary email (covering the last 7 days) to the recipients above.
            </p>
            <button onClick={handleSendNow} disabled={isSending} className={styles.button}>
              {isSending ? "Sending..." : "Send Summary Now"}
            </button>
          </div>
        </div>
      )}

      {view === "audit" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Audit Logs</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{parseDetails(log.details)}</td>
                  <td>{log.userName} ({log.userEmail})</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
