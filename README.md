# 🚀 Multi-Tier CRM (Customer Relationship Management) Platform

A production-ready, full-stack Customer Relationship Management (CRM) platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It provides robust Role-Based Access Control (RBAC) across Admin, Manager, and Sales roles, complete customer pipeline tracking, activity feeds, automated notifications, private scratchpad notes, document uploads, and dynamic analytics.

---

## 🌐 Live Deployment & Links

- **Live Application (Frontend):** [https://crm-system-apoorva.netlify.app](https://crm-system-apoorva.netlify.app)
- **Live REST API (Backend):** [https://crm-system-34rn.onrender.com](https://crm-system-34rn.onrender.com)
- **GitHub Repository:** [https://github.com/apoorva-iu/crm-system](https://github.com/apoorva-iu/crm-system)

---

## ✨ Key Features

- **🔐 Role-Based Access Control (RBAC):**
- **Admin:** Complete system visibility, team user management, system-wide metrics, customer reassignment, and data deletion.
- **Manager:** Team pipeline oversight, lead reassignment, and sales performance monitoring.
- **Sales:** Scoped access to personal assigned leads, stage updates, private notes, document uploads, and personal task follow-ups.
- **📊 Interactive Analytics Dashboard:** Real-time conversion rates, status distributions (Lead, Qualified, Customer, Lost), and revenue forecasting.
- **📇 Customer Pipeline Management:** Full CRUD operations, inline stage updates, dynamic search, multi-field filtering, and direct rep assignment.
- **📝 Private Scratchpad Notes & 📎 Document Uploads:** Rep-specific activity logs and file attachments per customer.
- **⚡ Responsive & Adaptive UI:** Polished interface built with Vite, React, and modular styling.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, React Router DOM, Axios, Lucide Icons / Vanilla CSS
- **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), Bcrypt.js, Multer
- **Database:** MongoDB Atlas with Mongoose ODM
- **Deployment:** Netlify (Frontend), Render (Backend API)

---

## 🗄️ Database Schema Design

### 1. `User` Schema
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Sales'], default: 'Sales' },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Customer Schema

{
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  status: { type: String, enum: ['Lead', 'Qualified', 'Customer', 'Lost'], default: 'Lead' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: [{
    text: String,
    author: String,
    createdAt: { type: Date, default: Date.now }
  }],
  documents: [{
    fileName: String,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}


### 3. Activity / Notification Schema

{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}


## 📡 API Documentation & Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |

---

### 👥 User Management (`/api/users`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List all users for team assignments | Authenticated |

---

### 📋 Customer Management (`/api/customers`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/customers` | Get all customer records | Admin / Manager |
| `GET` | `/api/customers/my/customers` | Get records assigned to current rep | Sales Rep |
| `GET` | `/api/customers/:id` | Fetch full details for a single customer | Authenticated |
| `POST` | `/api/customers` | Create a new customer profile | Authenticated |
| `PUT` | `/api/customers/:id` | Update customer primary information | Authenticated |
| `PUT` | `/api/customers/:id/status` | Update lead status pipeline stage | Authenticated |
| `PUT` | `/api/customers/:id/assign` | Reassign lead to a sales representative | Admin / Manager |
| `DELETE` | `/api/customers/:id` | Remove customer record permanently | Admin |
| `POST` | `/api/customers/:id/notes` | Add scratchpad note to customer timeline | Authenticated |
| `POST` | `/api/customers/:id/upload` | Upload customer attachments & files | Authenticated |

---

### 📊 Dashboard & Metrics (`/api/dashboard`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Retrieve aggregated pipeline stats | Authenticated |