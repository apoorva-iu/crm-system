import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api/customers";

// ==========================================
// INLINED SALES SETTINGS COMPONENT
// ==========================================
const SalesSettings = ({ user }) => {
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

            setStatus({ type: "success", message: "Profile updated successfully!" });
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
                <h2 className="hierarchy-heading" style={{ fontSize: "20px" }}>⚙️ Sales Representative Settings</h2>
                <p className="hierarchy-subtext" style={{ marginBottom: "20px" }}>
                    Update your personal profile information, account credentials, and notification preferences.
                </p>

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
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0" }}>🔑 Change Password</h3>

                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Enter current password"
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="New password"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
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
                            Receive Email notifications when a new customer is assigned to you
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={msgAlerts}
                                onChange={(e) => setMsgAlerts(e.target.checked)}
                            />
                            Receive direct @mention message notifications from Admin and Managers
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop: "16px",
                            padding: "10px 24px",
                            background: "#4f46e5",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
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

// ==========================================
// MAIN SALES DASHBOARD
// ==========================================
function SalesDashboard() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("Overview");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    const [customers, setCustomers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: "", message: "" });

    const [showMsgModal, setShowMsgModal] = useState(false);
    const [teamMsgText, setTeamMsgText] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "Lead",
    });
    const [note, setNote] = useState("");
    const [addingNote, setAddingNote] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const getAuthHeader = () => {
        const currentToken = localStorage.getItem("token") || token;
        return {
            headers: {
                Authorization: `Bearer ${currentToken}`,
                "Content-Type": "application/json",
            },
        };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleString();
        } catch (e) {
            return dateStr;
        }
    };

    const resolveFileUrl = (doc) => {
        if (!doc) return "#";
        if (doc.fileUrl) return doc.fileUrl;
        if (doc.url) return doc.url;

        const rawPath = doc.filePath || doc.path || "";
        if (!rawPath) return "#";

        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            return rawPath;
        }

        // Normalize any backslashes (Windows paths) to forward slashes before building the URL
        const normalizedPath = rawPath.replace(/\\/g, "/");

        if (normalizedPath.includes("uploads")) {
            const relativePath = normalizedPath.substring(normalizedPath.indexOf("uploads"));
            return `http://localhost:5000/${relativePath}`;
        }

        return "#";
    };

    const formatAuthor = (createdBy) => {
        if (!createdBy) return "";
        if (typeof createdBy === "object") {
            return createdBy.name || createdBy.email || createdBy._id || "";
        }
        return createdBy;
    };

    const getNoteFields = (item) => {
        const text = item?.text || item?.note || "";
        const author = formatAuthor(item?.createdBy || item?.author);
        const date = item?.createdAt || item?.date;
        return { text, author, date };
    };

    const fetchSalesData = async () => {
        try {
            setLoading(true);

            const [custRes, notifRes, usersRes] = await Promise.all([
                axios.get(API_URL, getAuthHeader()),
                axios.get("http://localhost:5000/api/notifications", getAuthHeader()).catch(() => ({ data: [] })),
                axios.get("http://localhost:5000/api/users", getAuthHeader()).catch(() => ({ data: [] }))
            ]);

            const custData = custRes.data.customers || custRes.data || [];
            const rawNotifs = notifRes.data.notifications || notifRes.data || [];
            const rawUsers = usersRes.data.users || usersRes.data || [];

            setCustomers(custData);
            setNotifications(rawNotifs.filter((n) => !n.isRead));
            setUsersList(rawUsers);

            if (selectedCustomer) {
                const updated = custData.find(c => c._id === selectedCustomer._id);
                if (updated) setSelectedCustomer(updated);
            }
        } catch (err) {
            console.error("Sales dashboard load error:", err);
            showFeedback("error", "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSalesData();
        } else {
            navigate("/login");
        }
    }, [token]);

    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    };

    const fetchSingleCustomer = async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
        return response.data.customer || response.data;
    };

    const handleViewCustomer = async (customer) => {
        try {
            setViewLoading(true);
            setSelectedCustomer(customer);
            const fullDetails = await fetchSingleCustomer(customer._id);
            setSelectedCustomer(fullDetails);
        } catch (err) {
            alert("Failed to load customer details.");
        } finally {
            setViewLoading(false);
        }
    };

    const handleOpenEditModal = async (customer) => {
        setModalError("");
        setModalSuccess("");
        setEditLoading(true);
        setEditingCustomer(customer);

        setFormData({
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            company: customer.company || "",
            status: customer.status || "Lead",
        });

        setNote("");
        setSelectedFile(null);
        setShowEditModal(true);

        try {
            const fullDetails = await fetchSingleCustomer(customer._id);
            setEditingCustomer(fullDetails);

            setFormData({
                name: fullDetails.name || "",
                email: fullDetails.email || "",
                phone: fullDetails.phone || "",
                company: fullDetails.company || "",
                status: fullDetails.status || "Lead",
            });
        } catch (err) {
            console.error("Fetch latest edit details error:", err);
        } finally {
            setEditLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveCustomer = async (e) => {
        if (e) e.preventDefault();
        setModalError("");
        setModalSuccess("");

        if (!editingCustomer) return;

        try {
            setSaving(true);
            const response = await axios.put(
                `${API_URL}/${editingCustomer._id}`,
                {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    status: formData.status,
                },
                getAuthHeader()
            );

            const savedCustomer = response.data.customer;

            showFeedback("success", "Customer updated successfully.");
            setShowEditModal(false);

            // Optimistically reflect the new status in local state immediately,
            // then reconcile with the server via fetchSalesData()
            if (savedCustomer) {
                setCustomers((prev) =>
                    prev.map((c) => (c._id === savedCustomer._id ? savedCustomer : c))
                );
                if (selectedCustomer && selectedCustomer._id === savedCustomer._id) {
                    setSelectedCustomer(savedCustomer);
                }
            }

            fetchSalesData();
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to save customer changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async () => {
        if (!editingCustomer || !note.trim()) {
            setModalError("Please enter note text before saving.");
            return;
        }

        try {
            setAddingNote(true);
            setModalError("");
            setModalSuccess("");

            await axios.post(
                `${API_URL}/${editingCustomer._id}/notes`,
                { note: note.trim() },
                getAuthHeader()
            );

            setNote("");
            setModalSuccess("Note added successfully.");

            const refreshed = await fetchSingleCustomer(editingCustomer._id);
            setEditingCustomer(refreshed);
            if (selectedCustomer && selectedCustomer._id === editingCustomer._id) {
                setSelectedCustomer(refreshed);
            }
            fetchSalesData();
        } catch (err) {
            console.error("Add note error:", err);
            setModalError(err.response?.data?.message || "Failed to add note.");
        } finally {
            setAddingNote(false);
        }
    };

    const handleUploadFile = async () => {
        if (!editingCustomer || !selectedFile) {
            setModalError("Please select a file to upload.");
            return;
        }

        try {
            setUploadingFile(true);
            setModalError("");
            setModalSuccess("");

            const data = new FormData();
            data.append("file", selectedFile);

            const tokenVal = localStorage.getItem("token") || token;

            // IMPORTANT: Do NOT set "Content-Type": "multipart/form-data" manually here.
            // When you set it yourself, the browser can't attach the multipart boundary,
            // and Multer fails to parse the request body (boundary/ENOENT-style errors).
            // Only set Authorization — let Axios/the browser set Content-Type + boundary.
            await axios.post(
                `${API_URL}/${editingCustomer._id}/upload`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${tokenVal}`,
                    },
                }
            );

            setSelectedFile(null);
            setModalSuccess("File uploaded successfully.");
            const refreshed = await fetchSingleCustomer(editingCustomer._id);
            setEditingCustomer(refreshed);
            if (selectedCustomer && selectedCustomer._id === editingCustomer._id) {
                setSelectedCustomer(refreshed);
            }
            fetchSalesData();
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to upload file.");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSendTeamMessage = async () => {
        if (!teamMsgText.trim()) return;

        try {
            setSendingMsg(true);
            const tokenVal = localStorage.getItem("token") || token;
            const res = await fetch(`${API_URL}/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenVal}`,
                },
                body: JSON.stringify({ message: teamMsgText }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send message.");

            showFeedback("success", data.message || "Message dispatched successfully!");
            setTeamMsgText("");
            setShowMsgModal(false);
            fetchSalesData();
        } catch (err) {
            showFeedback("error", err.message);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleInsertTag = (role, name) => {
        const tag = `@${role} ${name} `;
        setTeamMsgText((prev) => prev + tag);
    };

    const handleMarkRead = async (notifId) => {
        try {
            setNotifications((prev) => prev.filter((n) => n._id !== notifId));
            const tokenVal = localStorage.getItem("token") || token;
            await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenVal}`,
                },
            });
        } catch (error) {
            console.error("Mark notification read error:", error);
            fetchSalesData();
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const totalCustomers = customers.length;
    const leadsCount = customers.filter((c) => (c.status || "Lead") === "Lead").length;
    const qualifiedCount = customers.filter((c) => c.status === "Qualified").length;
    const activeCustomersCount = customers.filter((c) => c.status === "Customer").length;
    const lostDealsCount = customers.filter((c) => c.status === "Lost").length;

    const admins = usersList.filter((u) => u.role === "Admin");
    const managers = usersList.filter((u) => u.role === "Manager");

    const viewNotes = selectedCustomer?.notes || [];
    const viewDocuments =
        selectedCustomer?.attachments ||
        selectedCustomer?.documents ||
        selectedCustomer?.files ||
        [];

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
                <p style={{ color: "#666", fontSize: "16px" }}>Loading Sales Portal...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">

            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>CRM</h2>
                    <span>Sales Portal</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={activeTab === "Overview" ? "nav-item active" : "nav-item"}
                        onClick={() => setActiveTab("Overview")}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={activeTab === "Customers" ? "nav-item active" : "nav-item"}
                        onClick={() => setActiveTab("Customers")}
                    >
                        👥 My Customers
                    </button>
                    <button
                        className={activeTab === "Settings" ? "nav-item active" : "nav-item"}
                        onClick={() => setActiveTab("Settings")}
                    >
                        ⚙️ Settings
                    </button>
                </nav>

                <button className="logout-button" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            {/* MAIN WORKSPACE */}
            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>{activeTab === "Overview" ? "Sales Overview" : activeTab === "Customers" ? "My Customer Accounts" : "Account Settings"}</h1>
                        <p>Logged in as: <strong>{user?.name || user?.email}</strong> (Sales Representative)</p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {activeTab === "Customers" && (
                            <button
                                onClick={() => setShowMsgModal(true)}
                                style={{
                                    padding: "8px 16px",
                                    background: "#4f46e5",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                💬 Send Message
                            </button>
                        )}
                    </div>
                </header>

                {feedback.message && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "20px",
                            borderRadius: "8px",
                            backgroundColor: feedback.type === "error" ? "#fef2f2" : "#f0fdf4",
                            color: feedback.type === "error" ? "#991b1b" : "#166534",
                            border: `1px solid ${feedback.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                        }}
                    >
                        {feedback.message}
                    </div>
                )}

                {/* TAB 1: OVERVIEW */}
                {activeTab === "Overview" && (
                    <div className="hierarchy-container">

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            <div className="hierarchy-card" style={{ borderLeft: "4px solid #2563eb" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Assigned Accounts</span>
                                <h2 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0 0 0" }}>{totalCustomers}</h2>
                            </div>

                            <div className="hierarchy-card" style={{ borderLeft: "4px solid #16a34a" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Customers</span>
                                <h2 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0 0 0" }}>{activeCustomersCount}</h2>
                            </div>
                        </div>

                        <section className="hierarchy-card">
                            <h2 className="hierarchy-heading">📈 My Pipeline Status</h2>
                            <p className="hierarchy-subtext">Current distribution of customer leads assigned to you.</p>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                                <div style={{ background: "#fefce8", padding: "16px", borderRadius: "8px", border: "1px solid #fef08a" }}>
                                    <span style={{ fontSize: "13px", color: "#854d0e", fontWeight: "600" }}>🟡 Leads</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#854d0e" }}>{leadsCount}</p>
                                </div>
                                <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                                    <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: "600" }}>🔵 Qualified</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#1e40af" }}>{qualifiedCount}</p>
                                </div>
                                <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                    <span style={{ fontSize: "13px", color: "#166534", fontWeight: "600" }}>🟢 Active Customers</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#166534" }}>{activeCustomersCount}</p>
                                </div>
                                <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                                    <span style={{ fontSize: "13px", color: "#991b1b", fontWeight: "600" }}>🔴 Lost Deals</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#991b1b" }}>{lostDealsCount}</p>
                                </div>
                            </div>
                        </section>

                    </div>
                )}

                {/* TAB 2: MY CUSTOMERS */}
                {activeTab === "Customers" && (
                    <div className="hierarchy-container">

                        <section className="hierarchy-card">
                            <h2 className="hierarchy-heading" style={{ marginBottom: "12px" }}>🔔 Direct Alerts & Instructions</h2>
                            {notifications.length === 0 ? (
                                <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", color: "#64748b", fontSize: "13px", fontStyle: "italic" }}>
                                    ✓ All caught up! No unread instructions or messages.
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {notifications.map((note) => (
                                        <div
                                            key={note._id}
                                            style={{
                                                padding: "12px 16px",
                                                borderRadius: "8px",
                                                borderLeft: "4px solid #4f46e5",
                                                backgroundColor: "#eff6ff",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div>
                                                <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#1e293b", fontWeight: "600" }}>
                                                    {note.message}
                                                </p>
                                                {note.customer && (
                                                    <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                                                        Customer: {note.customer.name} ({note.customer.company || note.customer.email})
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleMarkRead(note._id)}
                                                style={{ padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#ffffff", cursor: "pointer" }}
                                            >
                                                Mark Read
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="hierarchy-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div>
                                    <h2 className="hierarchy-heading">💼 Active "My Customers" Portfolio</h2>
                                    <p className="hierarchy-subtext">Click 👁 to view details or ✏️ to update status, scratchpad notes, and files.</p>
                                </div>
                                <span style={{ fontSize: "12px", backgroundColor: "#e0e7ff", color: "#4338ca", padding: "4px 12px", borderRadius: "12px", fontWeight: "700" }}>
                                    {customers.length} Accounts
                                </span>
                            </div>

                            {customers.length === 0 ? (
                                <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                                    No customer records assigned to your portfolio yet.
                                </div>
                            ) : (
                                <div className="table-responsive-wrapper">
                                    <table className="hierarchy-table">
                                        <thead>
                                            <tr>
                                                <th>Customer Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Company</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: "center" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.map((cust) => (
                                                <tr key={cust._id}>
                                                    <td className="rep-name-cell">{cust.name}</td>
                                                    <td>{cust.email || "-"}</td>
                                                    <td>{cust.phone || "-"}</td>
                                                    <td style={{ color: "#334155" }}>{cust.company || "N/A"}</td>
                                                    <td>
                                                        <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", background: "#fef3c7", color: "#854d0e" }}>
                                                            {cust.status || "Lead"}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="icon-btn icon-btn-view"
                                                                title="View customer details"
                                                                onClick={() => handleViewCustomer(cust)}
                                                            >
                                                                👁
                                                            </button>
                                                            <button
                                                                className="icon-btn icon-btn-edit"
                                                                title="Edit customer & notes"
                                                                onClick={() => handleOpenEditModal(cust)}
                                                            >
                                                                ✏️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                    </div>
                )}

                {/* TAB 3: SETTINGS */}
                {activeTab === "Settings" && (
                    <SalesSettings user={user} />
                )}

            </main>

            {/* VIEW MODAL */}
            {selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal customer-details-modal">
                        <div className="modal-header">
                            <div className="header-left">
                                <span className="modal-icon">👤</span>
                                <div>
                                    <h2>Customer Details</h2>
                                    <p className="subtitle">{selectedCustomer.name}</p>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedCustomer(null)}>✕</button>
                        </div>

                        <div className="modal-body">
                            {viewLoading && (
                                <p style={{ fontSize: "12px", color: "var(--cp-purple)" }}>Refreshing latest information...</p>
                            )}

                            <div className="details-card">
                                <h3 className="section-heading">CUSTOMER INFORMATION</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">NAME</span>
                                        <span className="info-value font-semibold">{selectedCustomer.name}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">EMAIL</span>
                                        <span className="info-value">{selectedCustomer.email || "-"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">PHONE</span>
                                        <span className="info-value">{selectedCustomer.phone || "-"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">COMPANY</span>
                                        <span className="info-value">{selectedCustomer.company || "-"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">STATUS</span>
                                        <span className="info-value">{selectedCustomer.status || "Lead"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">ASSIGNED TO</span>
                                        <span className="info-value">{selectedCustomer.assignedTo?.name || selectedCustomer.assignedTo?.email || "You"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-card">
                                <h3 className="section-heading">📝 PRIVATE SCRATCHPAD NOTES</h3>
                                {viewNotes.length > 0 ? (
                                    <div className="notes-list">
                                        {viewNotes.map((item, index) => {
                                            const { text: noteText, author, date: noteDate } = getNoteFields(item);
                                            return (
                                                <div className="note-item" key={item._id || index}>
                                                    <p className="note-text">{noteText}</p>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                                                        {author && <span>By: {author}</span>}
                                                        {noteDate && <span>{formatDate(noteDate)}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No private notes recorded yet.</p>
                                )}
                            </div>

                            <div className="details-card">
                                <h3 className="section-heading">📎 DOCUMENTS</h3>
                                {viewDocuments.length > 0 ? (
                                    <div className="documents-grid">
                                        {viewDocuments.map((doc, index) => {
                                            const fileName = doc.fileName || doc.originalName || doc.name || `Document ${index + 1}`;
                                            const fileUrl = resolveFileUrl(doc);
                                            return (
                                                <div className="document-card" key={doc._id || index}>
                                                    <span className="document-name">{fileName}</span>
                                                    {fileUrl !== "#" && (
                                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="doc-action-btn">Open</a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No files uploaded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-modal-close" onClick={() => setSelectedCustomer(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal customer-details-modal">
                        <div className="modal-header">
                            <div className="header-left">
                                <span className="modal-icon">✏️</span>
                                <div>
                                    <h2>Edit Customer</h2>
                                    <p className="subtitle">{editingCustomer ? editingCustomer.name : "Customer details"}</p>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            {modalError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>{modalError}</div>}
                            {modalSuccess && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>{modalSuccess}</div>}

                            <div className="details-card">
                                <h3 className="section-heading">CUSTOMER INFORMATION</h3>

                                <div className="edit-form-grid">
                                    <div>
                                        <label>Name *</label>
                                        <input name="name" value={formData.name} onChange={handleFormChange} required placeholder="Full Name" />
                                    </div>

                                    <div>
                                        <label>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="email@domain.com" />
                                    </div>

                                    <div>
                                        <label>Phone</label>
                                        <input name="phone" value={formData.phone} onChange={handleFormChange} placeholder="Phone number" />
                                    </div>

                                    <div>
                                        <label>Company</label>
                                        <input name="company" value={formData.company} onChange={handleFormChange} placeholder="Company name" />
                                    </div>

                                    <div className="form-full-width">
                                        <label>Status</label>
                                        <select name="status" value={formData.status} onChange={handleFormChange}>
                                            <option value="Lead">Lead</option>
                                            <option value="Qualified">Qualified</option>
                                            <option value="Customer">Customer</option>
                                            <option value="Lost">Lost</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ADD PRIVATE NOTE */}
                            {editingCustomer && (
                                <>
                                    <div className="details-card">
                                        <h3 className="section-heading">📝 ADD PRIVATE SCRATCHPAD NOTE</h3>
                                        <div className="note-input-container">
                                            <textarea
                                                className="notes-textarea"
                                                placeholder="Write a private note..."
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                            />
                                            <div className="note-actions">
                                                <button
                                                    type="button"
                                                    className="btn-save-note"
                                                    onClick={handleAddNote}
                                                    disabled={addingNote || !note.trim()}
                                                >
                                                    {addingNote ? "Adding..." : "+ Add Private Note"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="details-card">
                                        <h3 className="section-heading">📎 DOCUMENTS</h3>
                                        <div className="file-upload-card">
                                            <input
                                                type="file"
                                                id="sales-edit-file-upload"
                                                className="hidden-file-input"
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                            />
                                            {!selectedFile ? (
                                                <label htmlFor="sales-edit-file-upload" className="dropzone-area">
                                                    <span className="upload-icon">📁</span>
                                                    <span className="upload-title">Upload customer files</span>
                                                </label>
                                            ) : (
                                                <div className="selected-file-wrapper">
                                                    <span>Selected file: {selectedFile.name}</span>
                                                    <button
                                                        type="button"
                                                        className="btn-upload-file"
                                                        onClick={handleUploadFile}
                                                        disabled={uploadingFile}
                                                    >
                                                        {uploadingFile ? "Uploading..." : "⬆ Upload File"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Immediate reflection of uploaded documents inside the edit modal itself */}
                                        {editingCustomer.attachments && editingCustomer.attachments.length > 0 && (
                                            <div className="documents-grid" style={{ marginTop: "12px" }}>
                                                {editingCustomer.attachments.map((doc, index) => {
                                                    const fileName = doc.fileName || `Document ${index + 1}`;
                                                    const fileUrl = resolveFileUrl(doc);
                                                    return (
                                                        <div className="document-card" key={doc._id || index}>
                                                            <span className="document-name">{fileName}</span>
                                                            {fileUrl !== "#" && (
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="doc-action-btn">Open</a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-modal-close"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-save-note"
                                onClick={handleSaveCustomer}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SEND MESSAGE MODAL */}
            {showMsgModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: "520px", width: "90%", padding: "24px", borderRadius: "12px", background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>💬 Dispatch Team Message</h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Tag members using <code>@Role Name</code> to send direct notifications.</p>
                            </div>
                            <button onClick={() => setShowMsgModal(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>Click to insert tag:</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {admins.map((a) => (
                                        <button
                                            key={a._id}
                                            type="button"
                                            onClick={() => handleInsertTag("Admin", a.name)}
                                            style={{ padding: "4px 10px", background: "#dbeafe", color: "#1e40af", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            @{a.name}
                                        </button>
                                    ))}
                                    {managers.map((m) => (
                                        <button
                                            key={m._id}
                                            type="button"
                                            onClick={() => handleInsertTag("Manager", m.name)}
                                            style={{ padding: "4px 10px", background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            @{m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                rows="4"
                                placeholder="Type your message here..."
                                value={teamMsgText}
                                onChange={(e) => setTeamMsgText(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                            <button
                                type="button"
                                onClick={() => setShowMsgModal(false)}
                                style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSendTeamMessage}
                                disabled={sendingMsg || !teamMsgText.trim()}
                                style={{ padding: "8px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "13px", cursor: teamMsgText.trim() ? "pointer" : "not-allowed", opacity: teamMsgText.trim() ? 1 : 0.6 }}
                            >
                                {sendingMsg ? "Sending..." : "📨 Dispatch Message"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default SalesDashboard;