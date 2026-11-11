# HomiePG - API Specification (Express JS Backend)

All frontend components (React.js website, React Native mobile apps) communicate with the Node.js/Express backend located at `http://localhost:5000/api`.

---

## 1. Authentication Endpoints

### 1.1. User Sign Up
- **Endpoint**: `POST /api/auth/signup`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "Jane Doe",
    "mobile": "+919999999999",
    "role": "tenant"
  }
  ```
- **Response**: `201 Created` with profiles metadata.

### 1.2. User Sign In
- **Endpoint**: `POST /api/auth/signin`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: `200 OK` with JWT session token.

---

## 2. Properties & Buildings (Public Search)

### 2.1. List Buildings
- **Endpoint**: `GET /api/buildings`
- **Query Parameters**:
  - `city` (string)
  - `gender` (string: Men/Women/Unisex)
  - `maxRent` (numeric)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "building_name": "Homie Stays Gurgaon",
      "city": "Gurgaon",
      "monthly_rent_starting": 8000,
      "gender_type": "Unisex"
    }
  ]
  ```

---

## 3. Booking Endpoints

### 3.1. Create Booking Application
- **Endpoint**: `POST /api/bookings`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "building_id": "uuid",
    "room_id": "uuid",
    "bed_id": "uuid",
    "move_in_date": "2026-07-01",
    "advance_amount": 5000
  }
  ```
- **Response**: `201 Created`

### 3.2. Approve / Reject Booking (Owner Only)
- **Endpoint**: `PUT /api/bookings/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "Approved" -- or 'Rejected'
  }
  ```
- **Action**: Stored procedure or transactional update in Express backend that updates the booking, inserts the tenant contract, and marks the bed as Occupied.

---

## 4. Payments Endpoints

### 4.1. Submit payment receipt
- **Endpoint**: `POST /api/payments`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "month": "2026-06",
    "amount": 8500,
    "payment_method": "UPI",
    "transaction_id": "TXN987654",
    "receipt_url": "url_to_uploaded_bucket_receipt"
  }
  ```

### 4.2. Verify Payment (Owner Only)
- **Endpoint**: `PUT /api/payments/:id/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
