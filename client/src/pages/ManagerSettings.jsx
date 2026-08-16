import React, { useState } from "react";
import axios from "axios";

const ManagerSettings = ({ user }) => {
    const token = localStorage.getItem("token");

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [emailAlerts, setEmailAlerts] = useState(true);
    const [msgAlerts, setMsgAlerts] = useState(true);

    const [status, setStatus] = useState({ type: "", message: "" });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setStatus({ type: "", message: "" });

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: "error", message: "New passwords do not match." });
            return;
        }

        try {
            setSaving(true);
            await axios.put(
                "http://localhost:5000/api/users/profile",
                {
                    name: formData.name,
                    email: formData.email,
                    currentPassword: formData.currentPassword || undefined,
                    newPassword: formData.newPassword || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStatus({ type: "success", message: "Manager profile updated successfully!" });
            setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        } catch (err) {
            console.error("Profile update error:", err);
            setStatus({
                type: "error",
                message: err.response?.data?.message || "Failed to update profile settings.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="hierarchy-container" style={{ width: "100%" }}>
            <section className="hierarchy-card" style={{ width: "100%", padding: "28px" }}>
                <h2 className="hierarchy-heading" style={{ fontSize: "20px" }}>⚙️ Manager Profile Settings</h2>
                <p className="hierarchy-subtext" style={{ marginBottom: "20px" }}>Update your personal profile information, account credentials, and notification preferences.</p>

                {status.message && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "6px",
                            marginBottom: "20px",
                            fontSize: "13px",
                            backgroundColor: status.type === "error" ? "#fef2f2" : "#f0fdf4",
                            color: status.type === "error" ? "#991b1b" : "#166534",
                            border: `1px solid ${status.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                        }}
                    >
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0" }}>🔑 Change Password</h3>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Enter current password"
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="New password"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0" }}>🔔 Notification Preferences</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={emailAlerts}
                                onChange={(e) => setEmailAlerts(e.target.checked)}
                            />
                            Receive Email notifications for new customer assignments
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={msgAlerts}
                                onChange={(e) => setMsgAlerts(e.target.checked)}
                            />
                            Receive direct @mention message notifications
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop: "16px",
                            padding: "10px 24px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                            alignSelf: "flex-start",
                        }}
                    >
                        {saving ? "Saving Changes..." : "💾 Save Settings"}
                    </button>
                </form>
            </section>
        </div>
    );
};

export default ManagerSettings;