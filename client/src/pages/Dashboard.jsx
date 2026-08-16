import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    const [activePage, setActivePage] = useState("Dashboard");

    // Metrics State
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalManagers: 0,
        totalSales: 0,
        pendingApprovals: 0,
        statusCounts: { Lead: 0, Qualified: 0, Customer: 0, Lost: 0 }
    });

    // Team Management, Activity & Notification States
    const [usersList, setUsersList] = useState([]);
    const [activities, setActivities] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedManagerId, setSelectedManagerId] = useState("");
    const [unassignedSalesToAssign, setUnassignedSalesToAssign] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Team Messaging State
    const [teamMsgText, setTeamMsgText] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [msgFeedback, setMsgFeedback] = useState("");

    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userInfo");
        window.location.href = "/login";
    };

    // -------------------------------------------------------------
    // FETCH ALL DASHBOARD DATA (METRICS, NOTIFICATIONS, ACTIVITIES)
    // -------------------------------------------------------------
    const fetchDashboardData = async () => {
        if (user?.role !== "Admin") return;
        try {
            setLoading(true);

            const [usersRes, customersRes, activitiesRes, notifRes] = await Promise.all([
                axios.get("http://localhost:5000/api/users", axiosConfig),
                axios.get("http://localhost:5000/api/customers", axiosConfig),
                axios.get("http://localhost:5000/api/activities", axiosConfig).catch(() => ({ data: { activities: [] } })),
                axios.get("http://localhost:5000/api/notifications", axiosConfig).catch(() => ({ data: { notifications: [] } }))
            ]);

            const rawUsers = usersRes.data.users || usersRes.data || [];
            const rawCustomers = customersRes.data.customers || customersRes.data || [];
            const rawActivities = activitiesRes.data.activities || [];
            const rawNotifs = notifRes.data.notifications || notifRes.data || [];

            setUsersList(rawUsers);
            setActivities(rawActivities);
            setNotifications(rawNotifs.filter((n) => !n.isRead));

            // Compute Counts
            const mgrs = rawUsers.filter((u) => u.role === "Manager");
            const sales = rawUsers.filter((u) => u.role === "Sales");

            const pending = rawCustomers.filter((c) => 
                c.assignmentStatus && c.assignmentStatus.includes("Pending")
            ).length;

            const counts = { Lead: 0, Qualified: 0, Customer: 0, Lost: 0 };
            rawCustomers.forEach((c) => {
                const st = c.status || "Lead";
                if (counts[st] !== undefined) counts[st]++;
            });

            setStats({
                totalCustomers: rawCustomers.length,
                totalManagers: mgrs.length,
                totalSales: sales.length,
                pendingApprovals: pending,
                statusCounts: counts
            });

        } catch (err) {
            console.error("Dashboard metrics load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [activePage]);

    // -------------------------------------------------------------
    // ASSIGN SALES USER TO MANAGER
    // -------------------------------------------------------------
    const handleAssignManager = async (salesUserId, managerId) => {
        if (!managerId) {
            alert("Please select a Manager first.");
            return;
        }
        try {
            setActionLoadingId(salesUserId);
            await axios.put(
                `http://localhost:5000/api/users/${salesUserId}/manager`,
                { managerId },
                axiosConfig
            );
            alert("Sales Representative assigned to Manager successfully!");
            setUnassignedSalesToAssign("");
            await fetchDashboardData();
        } catch (err) {
            console.error("Assign manager error:", err);
            alert(err.response?.data?.message || "Failed to assign manager.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // -------------------------------------------------------------
    // REMOVE SALES USER FROM MANAGER
    // -------------------------------------------------------------
    const handleRemoveManager = async (salesUserId) => {
        const confirmRemove = window.confirm("Remove this Sales Representative from the Manager's team?");
        if (!confirmRemove) return;

        try {
            setActionLoadingId(salesUserId);
            await axios.delete(
                `http://localhost:5000/api/users/${salesUserId}/manager`,
                axiosConfig
            );
            alert("Sales Representative unassigned from Manager.");
            await fetchDashboardData();
        } catch (err) {
            console.error("Remove manager error:", err);
            alert(err.response?.data?.message || "Failed to remove manager.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // -------------------------------------------------------------
    // SEND TEAM MESSAGE WITH @MENTION ROUTING
    // -------------------------------------------------------------
    const handleSendTeamMessage = async () => {
        if (!teamMsgText.trim()) return;

        try {
            setSendingMsg(true);
            setMsgFeedback("");

            const res = await axios.post(
                "http://localhost:5000/api/customers/message",
                { message: teamMsgText },
                axiosConfig
            );

            setMsgFeedback(res.data.message || "Message sent successfully!");
            setTeamMsgText("");
            await fetchDashboardData();
        } catch (err) {
            console.error("Send team message error:", err);
            setMsgFeedback(err.response?.data?.message || "Failed to send message.");
        } finally {
            setSendingMsg(false);
        }
    };

    const handleInsertTag = (role, name) => {
        const tag = `@${role} ${name} `;
        setTeamMsgText((prev) => prev + tag);
    };

    // Handle Quick Reply from Notification
    const handleQuickReply = (senderRole, senderName) => {
        setActivePage("Users");
        handleInsertTag(senderRole || "Manager", senderName || "Akash");
    };

    // Handle Mark Notification Read
    const handleMarkRead = async (notifId) => {
        try {
            setNotifications((prev) => prev.filter((n) => n._id !== notifId));
            await axios.put(`http://localhost:5000/api/notifications/${notifId}/read`, {}, axiosConfig);
        } catch (err) {
            console.error("Mark read error:", err);
            fetchDashboardData();
        }
    };

    // Derived Lists for Hierarchy View
    const managers = usersList.filter((u) => u.role === "Manager");
    const salesReps = usersList.filter((u) => u.role === "Sales");
    const unassignedSalesReps = salesReps.filter((u) => !u.manager);

    const selectedManagerObj = managers.find((m) => m._id === selectedManagerId);
    const selectedManagerTeam = salesReps.filter((u) => {
        const mgrId = typeof u.manager === "object" ? u.manager?._id : u.manager;
        return mgrId === selectedManagerId;
    });

    return (
        <div className="dashboard-layout">

            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>CRM</h2>
                    <span>Admin Workspace</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={activePage === "Dashboard" ? "nav-item active" : "nav-item"}
                        onClick={() => setActivePage("Dashboard")}
                    >
                        📊 Overview
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate("/customers")}
                    >
                        👥 Customers Database
                    </button>

                    <button
                        className={activePage === "Users" ? "nav-item active" : "nav-item"}
                        onClick={() => setActivePage("Users")}
                    >
                        👔 Team Hierarchy
                    </button>
                </nav>

                <button className="logout-button" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            {/* MAIN CONTENT WORKSPACE */}
            <main className="dashboard-main">

                {/* TOP HEADER */}
                <header className="dashboard-header">
                    <div>
                        <h1>{activePage === "Users" ? "Team Hierarchy & Management" : "Admin Metrics Overview"}</h1>
                        <p>CRM System Control Panel</p>
                    </div>

                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div>
                            <strong>{user?.name}</strong>
                            <span>System Admin</span>
                        </div>
                    </div>
                </header>

                {/* OVERVIEW DASHBOARD WITH COUNTS & NOTIFICATIONS */}
                {activePage === "Dashboard" && (
                    <div className="hierarchy-container">
                        
                        {/* STATS METRIC CARDS */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            <div className="hierarchy-card" style={{ borderLeft: "4px solid #2563eb" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Customers</span>
                                <h2 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0 0 0" }}>{stats.totalCustomers}</h2>
                            </div>

                            <div className="hierarchy-card" style={{ borderLeft: "4px solid #4f46e5" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Team Managers</span>
                                <h2 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0 0 0" }}>{stats.totalManagers}</h2>
                            </div>

                            <div className="hierarchy-card" style={{ borderLeft: "4px solid #16a34a" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Sales Representatives</span>
                                <h2 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0 0 0" }}>{stats.totalSales}</h2>
                            </div>

                            <div className="hierarchy-card" style={{ borderLeft: "4px solid #d97706" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Pending Approvals</span>
                                <h2 style={{ fontSize: "28px", color: "#d97706", margin: "8px 0 0 0" }}>{stats.pendingApprovals}</h2>
                            </div>
                        </div>

                        {/* DIRECT ALERTS & INCOMING TEAM MESSAGES FEED */}
                        <section className="hierarchy-card">
                            <h2 className="hierarchy-heading">🔔 Direct Alerts & Incoming Team Messages</h2>
                            <p className="hierarchy-subtext">Direct communications and mentions from Managers and Sales Representatives.</p>

                            {notifications.length === 0 ? (
                                <p style={{ color: "#64748b", fontStyle: "italic", margin: 0 }}>✓ All caught up! No unread notifications or team messages.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                                    {notifications.map((note) => (
                                        <div
                                            key={note._id}
                                            style={{
                                                padding: "14px 16px",
                                                borderRadius: "8px",
                                                borderLeft: "4px solid #2563eb",
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
                                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                    {new Date(note.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <button
                                                    onClick={() => handleQuickReply("Manager", "Akash")}
                                                    style={{
                                                        padding: "4px 10px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        backgroundColor: "#2563eb",
                                                        color: "#ffffff",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    💬 Reply
                                                </button>
                                                <button
                                                    onClick={() => handleMarkRead(note._id)}
                                                    style={{
                                                        padding: "4px 8px",
                                                        fontSize: "12px",
                                                        border: "1px solid #cbd5e1",
                                                        borderRadius: "4px",
                                                        backgroundColor: "#ffffff",
                                                        cursor: "pointer",
                                                        color: "#475569"
                                                    }}
                                                >
                                                    Mark Read
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* STATUS DISTRIBUTION COUNTERS */}
                        <section className="hierarchy-card">
                            <h2 className="hierarchy-heading">📈 Customer Pipeline Breakdown</h2>
                            <p className="hierarchy-subtext">Current status of all recorded leads and customers.</p>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                                <div style={{ background: "#fefce8", padding: "16px", borderRadius: "8px", border: "1px solid #fef08a" }}>
                                    <span style={{ fontSize: "13px", color: "#854d0e", fontWeight: "600" }}>🟡 Leads</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#854d0e" }}>{stats.statusCounts.Lead}</p>
                                </div>
                                <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                                    <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: "600" }}>🔵 Qualified</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#1e40af" }}>{stats.statusCounts.Qualified}</p>
                                </div>
                                <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                    <span style={{ fontSize: "13px", color: "#166534", fontWeight: "600" }}>🟢 Active Customers</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#166534" }}>{stats.statusCounts.Customer}</p>
                                </div>
                                <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                                    <span style={{ fontSize: "13px", color: "#991b1b", fontWeight: "600" }}>🔴 Lost Deals</span>
                                    <p style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 0 0", color: "#991b1b" }}>{stats.statusCounts.Lost}</p>
                                </div>
                            </div>
                        </section>

                        {/* RECENT SYSTEM ACTIVITIES */}
                        <section className="hierarchy-card">
                            <h2 className="hierarchy-heading">⚡ Recent System Audit Activity</h2>
                            <p className="hierarchy-subtext">Latest workflow changes and system events across team accounts.</p>

                            {activities.length === 0 ? (
                                <p style={{ color: "#64748b", fontStyle: "italic", margin: 0 }}>No recent activity logged.</p>
                            ) : (
                                <div className="table-responsive-wrapper">
                                    <table className="hierarchy-table">
                                        <thead>
                                            <tr>
                                                <th>Action</th>
                                                <th>Details</th>
                                                <th>Performed By</th>
                                                <th>Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.slice(0, 6).map((act) => (
                                                <tr key={act._id}>
                                                    <td>
                                                        <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "#f1f5f9", fontWeight: "600", color: "#334155" }}>
                                                            {act.action}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: "#0f172a" }}>{act.description}</td>
                                                    <td style={{ color: "#475569" }}>{act.user?.name || act.user?.email || "System"}</td>
                                                    <td style={{ color: "#94a3b8", fontSize: "12px" }}>{new Date(act.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* TEAM HIERARCHY PAGE WITH MESSAGING */}
                {activePage === "Users" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
                        
                        {/* LEFT COLUMN: TEAM CONFIGURATION & UNASSIGNED REPS */}
                        <div className="hierarchy-container">
                            
                            {/* SELECT MANAGER & MANAGE TEAM */}
                            <section className="hierarchy-card">
                                <h2 className="hierarchy-heading">👔 MANAGER TEAM CONFIGURATION</h2>
                                <p className="hierarchy-subtext">Select a Manager to view their assigned Sales Representatives or add new members to their team.</p>

                                <div className="manager-select-box">
                                    <label className="manager-select-label">Select Manager:</label>
                                    <select
                                        className="hierarchy-select-main"
                                        value={selectedManagerId}
                                        onChange={(e) => setSelectedManagerId(e.target.value)}
                                    >
                                        <option value="">-- Choose a Manager --</option>
                                        {managers.map((m) => (
                                            <option key={m._id} value={m._id}>
                                                {m.name} ({m.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* SELECTED MANAGER'S TEAM VIEW */}
                                {selectedManagerObj && (
                                    <div className="team-view-box">
                                        <h3 className="team-view-title">
                                            Team Members assigned to <span className="highlight-manager-name">{selectedManagerObj.name}</span> ({selectedManagerTeam.length})
                                        </h3>

                                        {/* ADD NEW SALES REP TO THIS MANAGER */}
                                        <div className="add-rep-bar">
                                            <span className="add-rep-label">+ Add Sales Rep to {selectedManagerObj.name}:</span>
                                            <select
                                                className="hierarchy-select-inline"
                                                value={unassignedSalesToAssign}
                                                onChange={(e) => setUnassignedSalesToAssign(e.target.value)}
                                            >
                                                <option value="">-- Select Unassigned Sales Rep --</option>
                                                {unassignedSalesReps.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.name} ({s.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn-add-team"
                                                disabled={!unassignedSalesToAssign || actionLoadingId === unassignedSalesToAssign}
                                                onClick={() => handleAssignManager(unassignedSalesToAssign, selectedManagerId)}
                                            >
                                                {actionLoadingId === unassignedSalesToAssign ? "Adding..." : "+ Add to Team"}
                                            </button>
                                        </div>

                                        {/* CURRENT TEAM TABLE */}
                                        {selectedManagerTeam.length === 0 ? (
                                            <p className="empty-team-msg">No Sales Representatives currently assigned to {selectedManagerObj.name}.</p>
                                        ) : (
                                            <div className="table-responsive-wrapper">
                                                <table className="hierarchy-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Sales Rep Name</th>
                                                            <th>Email</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedManagerTeam.map((rep) => (
                                                            <tr key={rep._id}>
                                                                <td className="rep-name-cell">{rep.name}</td>
                                                                <td className="rep-email-cell">{rep.email}</td>
                                                                <td>
                                                                    <button
                                                                        className="btn-remove-team"
                                                                        disabled={actionLoadingId === rep._id}
                                                                        onClick={() => handleRemoveManager(rep._id)}
                                                                    >
                                                                        {actionLoadingId === rep._id ? "Removing..." : "✕ Remove from Team"}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* UNASSIGNED SALES REPS OVERVIEW */}
                            <section className="hierarchy-card">
                                <h2 className="hierarchy-heading">⚠️ UNASSIGNED SALES REPRESENTATIVES ({unassignedSalesReps.length})</h2>
                                <p className="hierarchy-subtext">These Sales reps must be linked to a Manager before customers can be assigned to them.</p>

                                {unassignedSalesReps.length === 0 ? (
                                    <p className="all-assigned-banner">✓ All Sales Representatives are currently assigned to a Manager!</p>
                                ) : (
                                    <div className="table-responsive-wrapper">
                                        <table className="hierarchy-table">
                                            <thead>
                                                <tr>
                                                    <th>Sales Rep Name</th>
                                                    <th>Email</th>
                                                    <th>Assign Manager</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {unassignedSalesReps.map((rep) => (
                                                    <tr key={rep._id}>
                                                        <td className="rep-name-cell">{rep.name}</td>
                                                        <td className="rep-email-cell">{rep.email}</td>
                                                        <td>
                                                            <div className="assign-cell-group">
                                                                <select
                                                                    className="hierarchy-select-sm"
                                                                    defaultValue=""
                                                                    id={`select-mgr-${rep._id}`}
                                                                >
                                                                    <option value="" disabled>-- Select Manager --</option>
                                                                    {managers.map((m) => (
                                                                        <option key={m._id} value={m._id}>
                                                                            {m.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    className="btn-assign-manager"
                                                                    disabled={actionLoadingId === rep._id}
                                                                    onClick={() => {
                                                                        const sel = document.getElementById(`select-mgr-${rep._id}`);
                                                                        handleAssignManager(rep._id, sel.value);
                                                                    }}
                                                                >
                                                                    {actionLoadingId === rep._id ? "Assigning..." : "Assign"}
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

                        {/* RIGHT COLUMN: TEAM MESSAGING WITH @MENTIONS */}
                        <aside className="hierarchy-card" style={{ height: "fit-content" }}>
                            <h2 className="hierarchy-heading" style={{ fontSize: "16px" }}>💬 Send Team Message</h2>
                            <p className="hierarchy-subtext">Tag team members using <code>@Role Name</code> to route direct notifications.</p>

                            {/* QUICK TAG HELPER BUTTONS */}
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Click to tag member:</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {managers.map((m) => (
                                        <button
                                            key={m._id}
                                            type="button"
                                            onClick={() => handleInsertTag("Manager", m.name)}
                                            style={{ padding: "3px 8px", background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            @{m.name}
                                        </button>
                                    ))}
                                    {salesReps.map((s) => (
                                        <button
                                            key={s._id}
                                            type="button"
                                            onClick={() => handleInsertTag("Sales", s.name)}
                                            style={{ padding: "3px 8px", background: "#fef3c7", color: "#92400e", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            @{s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MESSAGE TEXTAREA */}
                            <textarea
                                rows="5"
                                placeholder="e.g. @Manager Akash please check customer Karan at Infynexa"
                                value={teamMsgText}
                                onChange={(e) => setTeamMsgText(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "none", marginBottom: "10px" }}
                            />

                            {msgFeedback && (
                                <p style={{ fontSize: "12px", color: msgFeedback.includes("sent") ? "#166534" : "#991b1b", margin: "0 0 10px 0" }}>
                                    {msgFeedback}
                                </p>
                            )}

                            <button
                                onClick={handleSendTeamMessage}
                                disabled={sendingMsg || !teamMsgText.trim()}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    background: "#2563eb",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: teamMsgText.trim() ? "pointer" : "not-allowed",
                                    opacity: teamMsgText.trim() ? 1 : 0.6
                                }}
                            >
                                {sendingMsg ? "Sending Alert..." : "📨 Dispatch Message"}
                            </button>
                        </aside>

                    </div>
                )}

            </main>
        </div>
    );
}

export default Dashboard;