# Nexus2 Backend API

This is the backend API for the Nexus2 platform, which connects entrepreneurs with investors.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/nexus
   JWT_SECRET=nexus-secret-key
   ```

### Running the Server

- Development mode (with nodemon):
  ```
  npm run dev
  ```

- Production mode:
  ```
  npm start
  ```

## API Documentation

### Authentication Routes

- **Register User**
  - `POST /api/auth/signup`
  - Request body: `{ name, email, password, userType }`
  - userType must be either 'entrepreneur' or 'investor'

- **Login User**
  - `POST /api/auth/login`
  - Request body: `{ email, password }`

- **Get Current User**
  - `GET /api/auth/me`
  - Requires authentication token in header: `x-auth-token`

- **Login User**
  - `POST /api/auth/login`
  - Request Body: `{ email, password }`

- **Get Current User**
  - `GET /api/auth/me`
  - Protected Route

- **Logout User**
  - `GET /api/auth/logout`

### User Routes

- **Get All Users**
  - `GET /api/users`
  - Protected Route (Admin only)

- **Get Single User**
  - `GET /api/users/:id`
  - Protected Route (Admin only)

- **Update User**
  - `PUT /api/users/:id`
  - Protected Route

- **Delete User**
  - `DELETE /api/users/:id`
  - Protected Route (Admin only)

### Entrepreneur Routes

- **Get All Entrepreneurs**
  - `GET /api/entrepreneurs`
  - Public Route

- **Get Single Entrepreneur**
  - `GET /api/entrepreneurs/:id`
  - Public Route

- **Create Entrepreneur Profile**
  - `POST /api/entrepreneurs`
  - Protected Route

- **Update Entrepreneur Profile**
  - `PUT /api/entrepreneurs/:id`
  - Protected Route

- **Delete Entrepreneur Profile**
  - `DELETE /api/entrepreneurs/:id`
  - Protected Route

### Investor Routes

- **Get All Investors**
  - `GET /api/investors`
  - Public Route

- **Get Single Investor**
  - `GET /api/investors/:id`
  - Public Route

- **Create Investor Profile**
  - `POST /api/investors`
  - Protected Route

- **Update Investor Profile**
  - `PUT /api/investors/:id`
  - Protected Route

- **Delete Investor Profile**
  - `DELETE /api/investors/:id`
  - Protected Route

### Message Routes

- **Get All Messages**
  - `GET /api/messages`
  - Protected Route

- **Get Conversation**
  - `GET /api/messages/conversation/:userId`
  - Protected Route

- **Send Message**
  - `POST /api/messages`
  - Protected Route
  - Request Body: `{ recipient, content, attachments }`

- **Delete Message**
  - `DELETE /api/messages/:id`
  - Protected Route

- **Mark Message as Read**
  - `PUT /api/messages/:id/read`
  - Protected Route

### Collaboration Routes

- **Get All Collaborations**
  - `GET /api/collaborations`
  - Protected Route

- **Get Single Collaboration**
  - `GET /api/collaborations/:id`
  - Protected Route

- **Create Collaboration**
  - `POST /api/collaborations`
  - Protected Route
  - Request Body: `{ entrepreneur, investor, investmentAmount, equityPercentage, notes }`

- **Update Collaboration**
  - `PUT /api/collaborations/:id`
  - Protected Route

- **Delete Collaboration**
  - `DELETE /api/collaborations/:id`
  - Protected Route

## Testing

To test the API endpoints, run:

```
node src/utils/testEndpoints.js
```

This will run a series of tests against all the major endpoints to verify functionality.