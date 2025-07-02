````markdown
# LendWise Microservices Architecture

A scalable, modular microservices-based lending platform built with Node.js and TypeScript. LendWise splits core functionality into separate services—**Auth**, **Main**, **Payment**—with an **API Gateway** routing and orchestrating requests between them.

---

## 🚀 Project Overview

LendWise aims to provide a robust, maintainable foundation for a lending application by:

- **Decoupling services**: Each service has its own codebase, dependencies, and database schema.  
- **Centralized routing**: The **gateway** service exposes a unified API to clients, forwarding requests to downstream microservices.  
- **Type safety**: Written entirely in TypeScript for better DX and fewer runtime errors.  
- **Easy local development**: Spin up all services together via npm scripts or Docker.

---

## 🏗️ Architecture Diagram

```plaintext
┌──────────┐     ┌───────────┐     ┌────────────┐
│  Client  │ ──▶ │  Gateway  │ ─▶  │ Auth SVC   │
└──────────┘     └───────────┘     └────────────┘
                                   ┌────────────┐
                                   │ Main SVC   │
                                   └────────────┘
                                   ┌────────────┐
                                   │ Payment SVC│
                                   └────────────┘
````

---

## 📁 Folder Structure

```
├── Auth
│   ├── controllers
│   ├── routes
│   ├── views
│   ├── db.ts
│   ├── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── gateway
│   ├── dist
│   ├── views
│   ├── index.ts
│   ├── middleware.ts
│   ├── tsconfig.json
│   └── package.json
│
├── main
│   ├── controller
│   ├── router
│   ├── utils
│   ├── views
│   ├── cloudconfig.ts
│   ├── db.ts
│   ├── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── Payment
│   ├── controllers
│   ├── views
│   ├── index.ts
│   ├── middleware.ts
│   ├── Db.ts
│   ├── tsconfig.json
│   └── package.json
│
├── .env
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

* [Node.js](https://nodejs.org/) v16+
* [npm](https://npmjs.com/) v8+
* MySQL or any SQL‑compatible database
* (Optional) Docker & Docker Compose for containerized development

---

## 🛠️ Setup & Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/Shoaib-json/LendWise.git
   cd LendWise
   ```

2. **Create and configure `.env`**
   Copy the example and fill in your own values:

   ```bash
   cp .env.example .env
   ```

   ```dotenv
   # Cloudinary (or similar) credentials
   CLOUDNAME=<your-cloud-name>
   API_KEY=<your-api-key>
   API_SECRET=<your-api-secret>

   # Session/Cookie secret
   COOKIE_SECRET=<your-cookie-secret>

   # Database
   DATABASE_NAME=<your-database-name>
   DATABASE_PASSWORD=<your-db-password>

   
   # Security
   SALT=<your-bcrypt-salt-rounds>

   # Google OAuth
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GOOGLE_CALLBACK_URL=<your-google-callback-path>
   ```

3. **Install dependencies**

   ```bash
   # In each service folder:
   cd Auth && npm install
   cd ../gateway && npm install
   cd ../main && npm install
   cd ../Payment && npm install
   cd ..
   ```

4. **Initialize databases**
   Run each service’s `Schema.sql` against your database server.

---

## ▶️ Running Locally

In separate terminals, start each service:

```bash
# Auth service
cd Auth && npm run dev

# Main service
cd main && npm run dev

# Payment service
cd Payment && npm run dev

# Gateway
cd gateway && npm run dev
```

---

## 🔗 API Routes

All requests go through the Gateway (port set in `.env`):

| Service     | Endpoint                | Description                  |
| ----------- | ----------------------- | ---------------------------- |
| **Auth**    | `POST /auth/register`   | Register a new user          |
|             | `POST /auth/login`      | Obtain JWT token             |
| **Main**    | `GET /loans`            | List user loans              |
|             | `POST /loans`           | Create a new loan            |
| **Payment** | `POST /payments/pay`    | Process a payment            |
|             | `GET /payments/history` | Retrieve transaction history |

---

## 🧪 Testing

*(Add test commands, e.g., Jest or Mocha)*

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/YourFeature`
3. Commit: `git commit -m "Add YourFeature"`
4. Push: `git push origin feature/YourFeature`
5. Open a PR

---

## 📄 License

This project is licensed under the MIT License.

```
```
