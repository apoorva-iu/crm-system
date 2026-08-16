import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api/customers";

function Customers() {
    const navigate = useNavigate();

    // Logged in user info & Role Checks
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    const userRole = user?.role?.toLowerCase();
    const isAdmin = userRole === "admin";
    const isManager = userRole === "manager";
    const isAllowed = isAdmin || isManager;

    // ---------------------------------------
    // ACCESS GUARD (ADMIN & MANAGER ALLOWED)
    // ---------------------------------------
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        if (!isAllowed) {
            navigate("/dashboard");
        }
    }, [isAllowed, token, navigate]);

    // Main customer list states
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Controls states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showMyCustomers, setShowMyCustomers] = useState(false);

    // View Modal State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    // Edit Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    // Inline Table Assignment State
    const [selectedSalesAssignments, setSelectedSalesAssignments] = useState({});
    const [assigningId, setAssigningId] = useState(null);

    // Edit Form & Action States
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "Lead",
        assignedTo: "",
    });

    const [note, setNote] = useState("");
    const [addingNote, setAddingNote] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [saving, setSaving] = useState(false);
    const [salesUsers, setSalesUsers] = useState([]);

    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    // ---------------------------------------
    // AXIOS CONFIG
    // ---------------------------------------
    const axiosConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // Helper: File Type & Icon Detector
    const getFileMeta = (fileName) => {
        if (!fileName) return { icon: "📄", label: "Document" };
        const ext = fileName.split(".").pop()?.toLowerCase();
        if (["xls", "xlsx", "csv"].includes(ext)) {
            return { icon: "📊", label: "Excel Spreadsheet" };
        }
        if (["pdf"].includes(ext)) {
            return { icon: "📕", label: "PDF Document" };
        }
        if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
            return { icon: "🖼️", label: "Image" };
        }
        if (["doc", "docx"].includes(ext)) {
            return { icon: "📘", label: "Word Document" };
        }
        return { icon: "📄", label: "File" };
    };

    // Helper: Safe Date Formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleString();
        } catch (e) {
            return dateStr;
        }
    };

    // Helper: Resolves backend file URLs safely
    const resolveFileUrl = (doc) => {
        if (!doc) return "#";
        if (doc.fileUrl) return doc.fileUrl;
        if (doc.url) return doc.url;

        const rawPath = doc.filePath || doc.path || "";
        if (!rawPath) return "#";

        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            return rawPath;
        }

        if (rawPath.includes("uploads")) {
            const relativePath = rawPath.substring(rawPath.indexOf("uploads"));
            return `http://localhost:5000/${relativePath.replace(/\\/g, "/")}`;
        }

        return "#";
    };

    // Helper: Extracts author name safely from createdBy
    const formatAuthor = (createdBy) => {
        if (!createdBy) return "";
        if (typeof createdBy === "object") {
            return createdBy.name || createdBy.email || createdBy._id || "";
        }
        return createdBy;
    };

    // Helper: Safely extracts note fields
    const getNoteFields = (item) => {
        const text = item?.text || item?.note || "";
        const author = formatAuthor(item?.createdBy || item?.author);
        const date = item?.createdAt || item?.date;
        return { text, author, date };
    };

    // ---------------------------------------
    // FETCH SALES USERS ONLY (FOR ASSIGNMENT)
    // ---------------------------------------
    useEffect(() => {
        if (isAllowed && token) {
            const fetchUsers = async () => {
                try {
                    const response = await axios.get(
                        "http://localhost:5000/api/users",
                        axiosConfig
                    );
                    const data = response.data;
                    let allUsers = [];

                    if (Array.isArray(data)) {
                        allUsers = data;
                    } else if (Array.isArray(data.users)) {
                        allUsers = data.users;
                    }

                    // Filter ONLY users whose role is "Sales"
                    const onlySales = allUsers.filter(
                        (u) => u.role === "Sales"
                    );
                    setSalesUsers(onlySales);
                } catch (err) {
                    console.error("Failed to fetch sales users for assignment:", err);
                }
            };
            fetchUsers();
        }
    }, [isAllowed, token]);

    // ---------------------------------------
    // GET CUSTOMERS
    // ---------------------------------------
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError("");

            const url = showMyCustomers
                ? `${API_URL}/my/customers`
                : API_URL;

            const response = await axios.get(url, axiosConfig);
            const data = response.data;

            if (Array.isArray(data)) {
                setCustomers(data);
            } else if (Array.isArray(data.customers)) {
                setCustomers(data.customers);
            } else {
                setCustomers([]);
            }
        } catch (err) {
            console.error("Customer fetch error:", err);
            setError(
                err.response?.data?.message || "Failed to load customers."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && isAllowed) {
            fetchCustomers();
        }
    }, [showMyCustomers, token, isAllowed]);

    // ---------------------------------------
    // FETCH SINGLE CUSTOMER DETAILS
    // ---------------------------------------
    const fetchSingleCustomer = async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`, axiosConfig);
            return response.data.customer || response.data;
        } catch (err) {
            console.error("Fetch single customer error:", err);
            throw err;
        }
    };

    // ---------------------------------------
    // FORM CHANGE HANDLER
    // ---------------------------------------
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // ---------------------------------------
    // VIEW CUSTOMER (READ-ONLY)
    // ---------------------------------------
    const handleView = async (customer) => {
        try {
            setViewLoading(true);
            setSelectedCustomer(customer);
            const fullDetails = await fetchSingleCustomer(customer._id);
            setSelectedCustomer(fullDetails);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to load customer details.");
        } finally {
            setViewLoading(false);
        }
    };

    // ---------------------------------------
    // OPEN ADD CUSTOMER MODAL
    // ---------------------------------------
    const openAddModal = () => {
        setEditingCustomer(null);
        setModalError("");
        setModalSuccess("");
        setFormData({
            name: "",
            email: "",
            phone: "",
            company: "",
            status: "Lead",
            assignedTo: "",
        });
        setNote("");
        setSelectedFile(null);
        setShowModal(true);
    };

    // ---------------------------------------
    // OPEN EDIT CUSTOMER MODAL
    // ---------------------------------------
    const openEditModal = async (customer) => {
        setModalError("");
        setModalSuccess("");
        setEditLoading(true);
        setEditingCustomer(customer);

        const assignedId =
            typeof customer.assignedTo === "object"
                ? customer.assignedTo?._id || ""
                : customer.assignedTo || "";

        setFormData({
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            company: customer.company || "",
            status: customer.status || "Lead",
            assignedTo: assignedId,
        });

        setNote("");
        setSelectedFile(null);
        setShowModal(true);

        try {
            const fullDetails = await fetchSingleCustomer(customer._id);
            setEditingCustomer(fullDetails);

            const updatedAssignedId =
                typeof fullDetails.assignedTo === "object"
                    ? fullDetails.assignedTo?._id || ""
                    : fullDetails.assignedTo || "";

            setFormData({
                name: fullDetails.name || "",
                email: fullDetails.email || "",
                phone: fullDetails.phone || "",
                company: fullDetails.company || "",
                status: fullDetails.status || "Lead",
                assignedTo: updatedAssignedId,
            });
        } catch (err) {
            console.error("Could not fetch latest edit details:", err);
        } finally {
            setEditLoading(false);
        }
    };

    // ---------------------------------------
    // DIRECT INLINE TABLE ASSIGNMENT
    // ---------------------------------------
    const handleInlineAssign = async (customerId) => {
        const selectedSalesId = selectedSalesAssignments[customerId];
        if (!selectedSalesId) {
            alert("Please select a Sales user first.");
            return;
        }

        try {
            setAssigningId(customerId);
            await axios.put(
                `${API_URL}/${customerId}/assign`,
                { assignedTo: selectedSalesId },
                axiosConfig
            );
            alert("Customer assigned successfully!");
            await fetchCustomers();
        } catch (err) {
            console.error("Inline assign error:", err);
            alert(err.response?.data?.message || "Failed to assign customer.");
        } finally {
            setAssigningId(null);
        }
    };

    // ---------------------------------------
    // ADD / UPDATE CUSTOMER
    // ---------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError("");
        setModalSuccess("");

        try {
            setSaving(true);

            if (editingCustomer) {
                await axios.put(
                    `${API_URL}/${editingCustomer._id}`,
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        company: formData.company,
                        status: formData.status,
                    },
                    axiosConfig
                );

                if (formData.assignedTo) {
                    await axios.put(
                        `${API_URL}/${editingCustomer._id}/assign`,
                        { assignedTo: formData.assignedTo },
                        axiosConfig
                    );
                }

                alert("Customer updated successfully.");
            } else {
                await axios.post(
                    API_URL,
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        company: formData.company,
                        status: formData.status,
                        assignedTo: formData.assignedTo || undefined,
                    },
                    axiosConfig
                );

                alert("Customer added successfully.");
            }

            setShowModal(false);
            await fetchCustomers();
        } catch (err) {
            console.error("Customer save error:", err);
            setModalError(
                err.response?.data?.message || "Failed to save customer changes."
            );
        } finally {
            setSaving(false);
        }
    };

    // ---------------------------------------
    // DELETE CUSTOMER
    // ---------------------------------------
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this customer?"
        );
        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/${id}`, axiosConfig);
            alert("Customer deleted successfully.");
            await fetchCustomers();
        } catch (err) {
            console.error("Delete error:", err);
            alert(err.response?.data?.message || "Failed to delete customer.");
        }
    };

    // ---------------------------------------
    // UPDATE STATUS FROM TABLE
    // ---------------------------------------
    const handleStatusChange = async (customer, newStatus) => {
        try {
            await axios.put(
                `${API_URL}/${customer._id}/status`,
                { status: newStatus },
                axiosConfig
            );
            await fetchCustomers();
        } catch (err) {
            console.error("Status update error:", err);
            alert(err.response?.data?.message || "Failed to update status.");
        }
    };

    // ---------------------------------------
    // ADD NOTE
    // ---------------------------------------
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
                { note: note },
                axiosConfig
            );

            setNote("");
            setModalSuccess("Note added successfully.");

            const refreshed = await fetchSingleCustomer(editingCustomer._id);
            setEditingCustomer(refreshed);
            setSelectedCustomer(refreshed);
            await fetchCustomers();
        } catch (err) {
            console.error("Note error:", err);
            setModalError(err.response?.data?.message || "Failed to add note.");
        } finally {
            setAddingNote(false);
        }
    };

    // ---------------------------------------
    // UPLOAD FILE
    // ---------------------------------------
    const handleUpload = async () => {
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

            await axios.post(
                `${API_URL}/${editingCustomer._id}/upload`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setSelectedFile(null);
            setModalSuccess("File uploaded successfully.");

            const refreshed = await fetchSingleCustomer(editingCustomer._id);
            setEditingCustomer(refreshed);
            setSelectedCustomer(refreshed);
            await fetchCustomers();
        } catch (err) {
            console.error("Upload error:", err);
            setModalError(err.response?.data?.message || "Failed to upload file.");
        } finally {
            setUploadingFile(false);
        }
    };

    // ---------------------------------------
    // SEARCH & FILTER LOGIC
    // ---------------------------------------
    const filteredCustomers = customers.filter((customer) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            customer.name?.toLowerCase().includes(searchText) ||
            customer.email?.toLowerCase().includes(searchText) ||
            customer.phone?.toLowerCase().includes(searchText) ||
            customer.company?.toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "All" || customer.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const viewNotes = selectedCustomer?.notes || [];
    const editNotes = editingCustomer?.notes || [];

    const viewDocuments =
        selectedCustomer?.attachments ||
        selectedCustomer?.documents ||
        selectedCustomer?.files ||
        [];

    const editDocuments =
        editingCustomer?.attachments ||
        editingCustomer?.documents ||
        editingCustomer?.files ||
        [];

    if (!isAllowed) {
        return null;
    }

    const backPath = isManager ? "/manager/dashboard" : "/admin/dashboard";

    // ---------------------------------------
    // RENDER UI
    // ---------------------------------------
    return (
        <div className="customers-page">

            {/* HEADER */}
            <div className="page-header">
                <button
                    className="back-button"
                    onClick={() => navigate(backPath)}
                >
                    <span className="back-arrow">←</span> Back to Dashboard
                </button>

                <div className="header-top">
                    <div>
                        <h1>Customers Database</h1>
                        <p>Manage team customer records ({isAdmin ? "Admin Workspace" : "Manager Workspace"})</p>
                    </div>

                    <button className="primary-button" onClick={openAddModal}>
                        + Add Customer
                    </button>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="customer-controls">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="status-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="Lead">Lead</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Customer">Customer</option>
                    <option value="Lost">Lost</option>
                </select>

                <button
                    className={`toggle-button ${showMyCustomers ? "active" : ""}`}
                    onClick={() => setShowMyCustomers(!showMyCustomers)}
                >
                    {showMyCustomers ? "Show All Customers" : "My Customers"}
                </button>

                <button className="refresh-button" onClick={fetchCustomers}>
                    🔄 Refresh
                </button>
            </div>

            {/* SUMMARY COUNT */}
            <div className="customer-summary">
                <strong className="count-number">{filteredCustomers.length}</strong>
                <span className="count-label">Customers</span>
            </div>

            {/* GLOBAL ERROR */}
            {error && <div className="error-message">{error}</div>}

            {/* LOADING STATE */}
            {loading && <div className="loading">Loading customers database...</div>}

            {/* CUSTOMERS TABLE */}
            {!loading && filteredCustomers.length > 0 && (
                <div className="customer-table-wrapper">
                    <table className="customer-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredCustomers.map((customer) => {
                                const assignedName =
                                    customer.assignedTo?.name ||
                                    customer.assignedTo?.email ||
                                    (typeof customer.assignedTo === "string"
                                        ? customer.assignedTo
                                        : null);

                                return (
                                    <tr key={customer._id}>
                                        <td>
                                            <strong>{customer.name}</strong>
                                        </td>
                                        <td>{customer.email || "-"}</td>
                                        <td>{customer.phone || "-"}</td>
                                        <td>{customer.company || "-"}</td>
                                        <td>
                                            <select
                                                className={`status-select status-${(customer.status || "Lead").toLowerCase()}`}
                                                value={customer.status || "Lead"}
                                                onChange={(e) =>
                                                    handleStatusChange(customer, e.target.value)
                                                }
                                            >
                                                <option value="Lead">🟡 Lead</option>
                                                <option value="Qualified">🔵 Qualified</option>
                                                <option value="Customer">🟢 Customer</option>
                                                <option value="Lost">🔴 Lost</option>
                                            </select>
                                        </td>
                                        <td>
                                            {/* Interactive Sales Assignment Cell */}
                                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                <select
                                                    style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}
                                                    value={selectedSalesAssignments[customer._id] || (typeof customer.assignedTo === "object" ? customer.assignedTo?._id : customer.assignedTo) || ""}
                                                    onChange={(e) =>
                                                        setSelectedSalesAssignments({
                                                            ...selectedSalesAssignments,
                                                            [customer._id]: e.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="">Unassigned</option>
                                                    {salesUsers.map((sUser) => (
                                                        <option key={sUser._id} value={sUser._id}>
                                                            {sUser.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        background: "var(--cp-purple, #6366f1)",
                                                        color: "#fff",
                                                        border: "none",
                                                        cursor: "pointer"
                                                    }}
                                                    disabled={assigningId === customer._id}
                                                    onClick={() => handleInlineAssign(customer._id)}
                                                >
                                                    {assigningId === customer._id ? "..." : "Assign"}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="icon-btn icon-btn-view"
                                                    title="View customer"
                                                    aria-label="View customer"
                                                    onClick={() => handleView(customer)}
                                                >
                                                    👁
                                                </button>

                                                <button
                                                    className="icon-btn icon-btn-edit"
                                                    title="Edit customer"
                                                    aria-label="Edit customer"
                                                    onClick={() => openEditModal(customer)}
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    className="icon-btn icon-btn-delete"
                                                    title="Delete customer"
                                                    aria-label="Delete customer"
                                                    onClick={() => handleDelete(customer._id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && filteredCustomers.length > 0 === false && (
                <div className="empty-state">
                    <h2>No customers found</h2>
                    <p>There are no customer records matching your current filter.</p>
                    <button className="primary-button" onClick={openAddModal}>
                        + Add Customer
                    </button>
                </div>
            )}

            {/* VIEW CUSTOMER MODAL */}
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
                            <button
                                className="modal-close"
                                onClick={() => setSelectedCustomer(null)}
                                title="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {viewLoading && (
                                <p style={{ fontSize: "12px", color: "var(--cp-purple)" }}>
                                    Refreshing latest information...
                                </p>
                            )}

                            <div className="details-card">
                                <h3 className="section-heading">Customer Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Name</span>
                                        <span className="info-value font-semibold">{selectedCustomer.name}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{selectedCustomer.email || "-"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Phone</span>
                                        <span className="info-value">{selectedCustomer.phone || "-"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Company</span>
                                        <span className="info-value">{selectedCustomer.company || "-"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Status</span>
                                        <span className="info-value">{selectedCustomer.status || "Lead"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Assigned To</span>
                                        <span className="info-value">
                                            {selectedCustomer.assignedTo?.name || selectedCustomer.assignedTo?.email || "Unassigned"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* NOTES SECTION */}
                            <div className="details-card">
                                <h3 className="section-heading">📝 Private Scratchpad Notes</h3>
                                {viewNotes.length > 0 ? (
                                    <div className="notes-list">
                                        {viewNotes.map((item, index) => {
                                            const { text: noteText, author, date: noteDate } = getNoteFields(item);
                                            return (
                                                <div className="note-item" key={item._id || index}>
                                                    <p className="note-text">{noteText}</p>
                                                    <div className="note-meta-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--cp-text-faint)", marginTop: "4px" }}>
                                                        {author && <span>By: {author}</span>}
                                                        {noteDate && <span>{formatDate(noteDate)}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--cp-text-muted)" }}>No notes recorded.</p>
                                )}
                            </div>

                            {/* DOCUMENTS SECTION */}
                            <div className="details-card">
                                <h3 className="section-heading">📎 Documents</h3>
                                {viewDocuments.length > 0 ? (
                                    <div className="documents-grid">
                                        {viewDocuments.map((doc, index) => {
                                            const fileName = doc.fileName || doc.originalName || doc.name || `Document ${index + 1}`;
                                            const fileUrl = resolveFileUrl(doc);
                                            const meta = getFileMeta(fileName);

                                            return (
                                                <div className="document-card" key={doc._id || index}>
                                                    <div className="doc-card-main">
                                                        <span className="doc-type-icon">{meta.icon}</span>
                                                        <div className="doc-card-details">
                                                            <span className="document-name" title={fileName}>{fileName}</span>
                                                            <span className="document-type">{meta.label}</span>
                                                        </div>
                                                    </div>
                                                    {fileUrl !== "#" && (
                                                        <div className="doc-card-actions">
                                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="doc-action-btn">Open</a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--cp-text-muted)" }}>No files uploaded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-modal-close" onClick={() => setSelectedCustomer(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT / ADD MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal customer-details-modal">
                        <div className="modal-header">
                            <div className="header-left">
                                <span className="modal-icon">✏️</span>
                                <div>
                                    <h2>{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>
                                    <p className="subtitle">{editingCustomer ? editingCustomer.name : "Create a new customer profile"}</p>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            {modalError && <div className="error-message" style={{ marginBottom: "12px", fontSize: "13px" }}>{modalError}</div>}
                            {modalSuccess && <div style={{ background: "var(--cp-green-bg)", border: "1px solid #a7f3d0", color: "var(--cp-green)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>{modalSuccess}</div>}

                            <form onSubmit={handleSubmit} id="customer-edit-form">
                                <div className="details-card">
                                    <h3 className="section-heading">Customer Information</h3>

                                    <label>Name *</label>
                                    <input name="name" value={formData.name} onChange={handleChange} required placeholder="Full Name" />

                                    <label>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@domain.com" />

                                    <label>Phone</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" />

                                    <label>Company</label>
                                    <input name="company" value={formData.company} onChange={handleChange} placeholder="Company name" />

                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="Lead">Lead</option>
                                        <option value="Qualified">Qualified</option>
                                        <option value="Customer">Customer</option>
                                        <option value="Lost">Lost</option>
                                    </select>

                                    <div style={{ marginTop: "14px" }}>
                                        <label>Assigned To (Sales Representative)</label>
                                        <select name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                                            <option value="">Unassigned</option>
                                            {salesUsers.map((u) => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name || u.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </form>

                            {editingCustomer && (
                                <>
                                    <div className="details-card">
                                        <h3 className="section-heading">📝 Add Private Scratchpad Note</h3>
                                        <div className="note-input-container">
                                            <textarea className="notes-textarea" placeholder="Write a private note..." value={note} onChange={(e) => setNote(e.target.value)} />
                                            <div className="note-actions">
                                                <button type="button" className="btn-save-note" onClick={handleAddNote} disabled={addingNote}>
                                                    {addingNote ? "Adding..." : "+ Add Private Note"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="details-card">
                                        <h3 className="section-heading">📎 Documents</h3>
                                        <div className="file-upload-card">
                                            <input type="file" id="edit-customer-file-upload" className="hidden-file-input" onChange={(e) => setSelectedFile(e.target.files[0])} />
                                            {!selectedFile ? (
                                                <label htmlFor="edit-customer-file-upload" className="dropzone-area">
                                                    <span className="upload-icon">📁</span>
                                                    <span className="upload-title">Upload customer files</span>
                                                </label>
                                            ) : (
                                                <div className="selected-file-wrapper">
                                                    <span>Selected file: {selectedFile.name}</span>
                                                    <button type="button" className="btn-upload-file" onClick={handleUpload} disabled={uploadingFile}>
                                                        {uploadingFile ? "Uploading..." : "⬆ Upload File"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer" style={{ gap: "10px" }}>
                            <button type="button" className="btn-modal-close" onClick={() => setShowModal(false)}>Cancel</button>
                            <button type="submit" form="customer-edit-form" className="btn-save-note" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Customers;