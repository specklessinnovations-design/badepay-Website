# BadePay - Complete Technical Documentation
**Version**: 1.0.0  
**Date**: June 26, 2026  
**Client Documentation**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Backend API Documentation](#backend-api-documentation)
4. [Web Application Documentation](#web-application-documentation)
5. [Mobile Application Documentation](#mobile-application-documentation)
6. [Admin Portal Documentation](#admin-portal-documentation)
7. [Security Features](#security-features)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)

---

## Executive Summary

BadePay is a comprehensive fintech platform consisting of three interconnected applications:

1. **BadePay Backend** - Node.js/Express API with PostgreSQL database
2. **BadePay Website** - React-based web application for consumers and merchants
3. **BadePay Mobile App** - React Native mobile application for iOS and Android
4. **BadePay Admin Portal** - Web-based administrative dashboard

The platform enables users to:
- Send and receive money instantly
- Pay bills and utilities
- Create and manage merchant stores
- Accept payments via QR codes
- Manage wallets and cards
- Complete KYC verification
- Resolve disputes
- Access comprehensive analytics

---

## System Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (Access + Refresh tokens)
- **Payment Gateway**: Paystack
- **Email Service**: Resend
- **Rate Limiting**: Express-rate-limit
- **Security**: Helmet, CORS, bcrypt

#### Web Application
- **Framework**: React + Vite
- **Routing**: Wouter
- **State Management**: Zustand
- **UI Components**: Custom components with Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form
- **HTTP Client**: Custom API client

#### Mobile Application
- **Framework**: React Native
- **Routing**: TanStack Router
- **State Management**: Zustand
- **UI Components**: Custom components
- **Forms**: React Hook Form
- **HTTP Client**: Custom API client
- **QR Code**: qrcode library

#### Admin Portal
- **Framework**: React + Vite
- **Routing**: Wouter
- **State Management**: Zustand
- **UI Components**: Custom components with Tailwind CSS
- **Charts**: Recharts
- **Data Tables**: TanStack Table

### Database Schema

#### Core Tables
- **User** - User accounts and profiles
- **Wallet** - User wallet balances
- **Transaction** - All financial transactions
- **MerchantProfile** - Merchant business information
- **Store** - Merchant online stores
- **Product** - Store products
- **Order** - Customer orders
- **Card** - User payment cards
- **Dispute** - Transaction disputes
- **AuditLog** - System audit trail
- **PlatformSettings** - Platform configuration
- **KYCSubmission** - KYC verification records

---

## Backend API Documentation

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://badepay-backend.vercel.app/api/v1`

### Authentication

All API endpoints (except public ones) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

#### Endpoints

##### 1. Authentication (`/api/v1/auth`)

**POST /auth/register**
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+2348001234567",
    "userType": "consumer"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": { ... },
      "token": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
  ```

**POST /auth/login**
- **Description**: Login with email and password
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": { ... },
      "token": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
  ```

**POST /auth/verify-otp**
- **Description**: Verify OTP sent to email
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": { ... },
      "token": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
  ```

**POST /auth/refresh**
- **Description**: Refresh access token using refresh token
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "token": "new_jwt_access_token",
      "refreshToken": "new_jwt_refresh_token"
    }
  }
  ```

**POST /auth/logout**
- **Description**: Logout and invalidate tokens
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Logged out successfully"
  }
  ```

**POST /auth/forgot-password**
- **Description**: Request password reset OTP
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "OTP sent to email"
  }
  ```

**POST /auth/reset-password**
- **Description**: Reset password with OTP
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewSecurePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Password reset successfully"
  }
  ```

##### 2. Wallet Operations (`/api/v1/wallet`)

**GET /wallet/balance**
- **Description**: Get user wallet balance
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "balance": 50000.00,
      "currency": "NGN",
      "isLocked": false
    }
  }
  ```

**POST /wallet/fund**
- **Description**: Fund wallet via Paystack
- **Request Body**:
  ```json
  {
    "amount": 10000,
    "paymentMethod": "paystack"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "authorizationUrl": "https://paystack.co/pay/...",
      "reference": "txn_123456"
    }
  }
  ```

**POST /wallet/withdraw**
- **Description**: Withdraw funds to bank account
- **Request Body**:
  ```json
  {
    "amount": 5000,
    "bankCode": "044",
    "accountNumber": "1234567890",
    "accountName": "John Doe"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "transactionId": "txn_789012",
      "message": "Withdrawal initiated"
    }
  }
  ```

**POST /wallet/set-pin**
- **Description**: Set transaction PIN
- **Request Body**:
  ```json
  {
    "pin": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "PIN set successfully"
  }
  ```

**POST /wallet/verify-pin**
- **Description**: Verify transaction PIN
- **Request Body**:
  ```json
  {
    "pin": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "valid": true
    }
  }
  ```

##### 3. Transfers (`/api/v1/transfers`)

**POST /transfers/send**
- **Description**: Send money to another user
- **Request Body**:
  ```json
  {
    "recipientAccountNumber": "1234567890",
    "recipientBank": "BadePay",
    "amount": 5000,
    "pin": "1234",
    "note": "Payment for services"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "transactionId": "txn_123456",
      "reference": "REF-123456",
      "status": "success"
    }
  }
  ```

**POST /transfers/bank-transfer**
- **Description**: Transfer to external bank account
- **Request Body**:
  ```json
  {
    "bankCode": "044",
    "accountNumber": "1234567890",
    "accountName": "John Doe",
    "amount": 10000,
    "pin": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "transactionId": "txn_789012",
      "reference": "BANK-REF-123"
    }
  }
  ```

##### 4. Transactions (`/api/v1/transactions`)

**GET /transactions**
- **Description**: Get user transaction history
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by status (success, pending, failed)
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "transactions": [
        {
          "id": "txn_123456",
          "reference": "REF-123456",
          "amount": 5000,
          "type": "transfer",
          "status": "success",
          "createdAt": "2026-06-26T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100
      }
    }
  }
  ```

**GET /transactions/:id**
- **Description**: Get transaction details
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "txn_123456",
      "reference": "REF-123456",
      "amount": 5000,
      "type": "transfer",
      "status": "success",
      "sender": { ... },
      "recipient": { ... },
      "createdAt": "2026-06-26T10:00:00Z"
    }
  }
  ```

##### 5. QR Codes (`/api/v1/qr`)

**POST /qr/generate**
- **Description**: Generate static QR code for receiving payments
- **Request Body**:
  ```json
  {
    "amount": 10000,
    "label": "Store Payment"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "qrCode": "data:image/png;base64,...",
      "slug": "store-abc123",
      "expiresAt": "2026-06-27T10:00:00Z"
    }
  }
  ```

**POST /qr/dynamic**
- **Description**: Generate dynamic QR code with custom amount
- **Request Body**:
  ```json
  {
    "amount": 5000,
    "label": "Custom Payment",
    "expiresIn": 3600
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "qrCode": "data:image/png;base64,...",
      "slug": "dynamic-xyz789",
      "expiresAt": "2026-06-26T11:00:00Z"
    }
  }
  ```

##### 6. Bills (`/api/v1/bills`)

**GET /bills/categories**
- **Description**: Get available bill payment categories
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "categories": [
        {
          "id": "airtime",
          "name": "Airtime",
          "providers": ["MTN", "Airtel", "Glo", "9mobile"]
        },
        {
          "id": "electricity",
          "name": "Electricity",
          "providers": ["IKEDC", "EKEDC", "AEDC", "PHEDC"]
        }
      ]
    }
  }
  ```

**POST /bills/pay**
- **Description**: Pay a bill
- **Request Body**:
  ```json
  {
    "category": "airtime",
    "provider": "MTN",
    "phoneNumber": "08012345678",
    "amount": 500,
    "pin": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "transactionId": "bill_123456",
      "reference": "BILL-REF-123"
    }
  }
  ```

##### 7. KYC (`/api/v1/kyc`)

**POST /kyc/submit**
- **Description**: Submit KYC verification documents
- **Request Body**:
  ```json
  {
    "bvn": "12345678901",
    "nin": "12345678901",
    "selfieImage": "data:image/jpeg;base64,...",
    "addressProof": "data:image/jpeg;base64,..."
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "kycLevel": 1,
      "kycStatus": "pending",
      "submissionId": "kyc_123456"
    }
  }
  ```

**GET /kyc/status**
- **Description**: Get KYC verification status
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "kycLevel": 2,
      "kycStatus": "approved",
      "bvnVerified": true,
      "ninVerified": true
    }
  }
  ```

##### 8. Cards (`/api/v1/cards`)

**POST /cards/add**
- **Description**: Add payment card
- **Request Body**:
  ```json
  {
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2027",
    "cvv": "123",
    "cardHolderName": "John Doe"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "cardId": "card_123456",
      "last4": "4242",
      "brand": "Visa",
      "isDefault": true
    }
  }
  ```

**GET /cards**
- **Description**: Get user's saved cards
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "cards": [
        {
          "id": "card_123456",
          "last4": "4242",
          "brand": "Visa",
          "expiryMonth": "12",
          "expiryYear": "2027",
          "isDefault": true
        }
      ]
    }
  }
  ```

**DELETE /cards/:id**
- **Description**: Remove saved card
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Card removed successfully"
  }
  ```

##### 9. Merchant Operations (`/api/v1/merchants`)

**POST /merchants/onboarding**
- **Description**: Complete merchant onboarding
- **Request Body**:
  ```json
  {
    "businessName": "My Business Ltd",
    "tradingName": "My Store",
    "businessType": "retail",
    "category": "electronics",
    "address": "123 Lagos Street",
    "rcNumber": "RC123456",
    "taxId": "TAX123456",
    "supportPhone": "+2348001234567",
    "payoutPreference": "bank"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "merchantId": "merch_123456",
      "qrSlug": "my-store-abc",
      "verified": false
    }
  }
  ```

**POST /merchants/store/create**
- **Description**: Create merchant store
- **Request Body**:
  ```json
  {
    "name": "My Online Store",
    "slug": "my-store",
    "description": "Quality products at great prices"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "storeId": "store_123456",
      "slug": "my-store",
      "isPublished": false
    }
  }
  ```

**POST /merchants/store/products**
- **Description**: Add product to store
- **Request Body**:
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "price": 5000,
    "stock": 100,
    "images": ["data:image/jpeg;base64,..."],
    "variations": [
      {
        "name": "Size",
        "options": ["S", "M", "L", "XL"]
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "productId": "prod_123456",
      "slug": "product-name-abc"
    }
  }
  ```

##### 10. Public Store API (`/api/v1/stores`)

**GET /stores/:slug**
- **Description**: Get public store details (no auth required)
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "store": {
        "id": "store_123456",
        "name": "My Store",
        "slug": "my-store",
        "description": "Quality products",
        "merchantName": "John Doe"
      },
      "products": [
        {
          "id": "prod_123456",
          "name": "Product Name",
          "price": 5000,
          "images": ["..."],
          "stock": 100
        }
      ]
    }
  }
  ```

**POST /stores/:slug/orders**
- **Description**: Create order from public store
- **Request Body**:
  ```json
  {
    "items": [
      {
        "productId": "prod_123456",
        "quantity": 2,
        "variation": "M"
      }
    ],
    "customerEmail": "customer@example.com",
    "customerPhone": "+2348001234567",
    "customerName": "Customer Name"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "orderId": "order_123456",
      "totalAmount": 10000,
      "paymentLink": "https://paystack.co/pay/..."
    }
  }
  ```

##### 11. Disputes (`/api/v1/disputes`)

**POST /disputes/create**
- **Description**: Create a dispute for a transaction
- **Request Body**:
  ```json
  {
    "transactionId": "txn_123456",
    "issueType": "wrong_debit",
    "description": "I was charged incorrectly",
    "priority": "high"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "disputeId": "disp_123456",
      "ticketNumber": "DISP-2026-001",
      "status": "open"
    }
  }
  ```

**GET /disputes**
- **Description**: Get user's disputes
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "disputes": [
        {
          "id": "disp_123456",
          "ticketNumber": "DISP-2026-001",
          "issueType": "wrong_debit",
          "status": "open",
          "priority": "high",
          "amount": 5000
        }
      ]
    }
  }
  ```

##### 12. Admin API (`/api/v1/admin`)

**POST /admin/login**
- **Description**: Admin login
- **Request Body**:
  ```json
  {
    "email": "admin@badepay.com",
    "password": "BadePay@Admin2026!"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "admin": {
        "name": "Super Admin",
        "email": "admin@badepay.com",
        "role": "superadmin"
      },
      "token": "admin_jwt_token"
    }
  }
  ```

**GET /admin/dashboard**
- **Description**: Get dashboard analytics
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "users": {
        "total": 1000,
        "active": 850,
        "merchants": 150,
        "newToday": 25
      },
      "transactions": {
        "total": 50000,
        "totalVolume": 500000000,
        "todayVolume": 10000000
      },
      "disputes": {
        "open": 10,
        "requiresAction": 5
      },
      "revenue": {
        "total": 2500000
      },
      "dailyRevenue": [
        { "date": "Jun 1", "amount": 5000000 },
        { "date": "Jun 2", "amount": 6000000 }
      ]
    }
  }
  ```

**GET /admin/users**
- **Description**: Get all users
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `search` (optional): Search term
  - `userType` (optional): Filter by type (consumer, merchant)
  - `kycStatus` (optional): Filter by KYC status
  - `isActive` (optional): Filter by active status
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "users": [
        {
          "id": "user_123456",
          "fullName": "John Doe",
          "email": "john@example.com",
          "phone": "+2348001234567",
          "accountNumber": "1234567890",
          "balance": 50000,
          "kycStatus": "verified",
          "isActive": true,
          "userType": "consumer",
          "kycLevel": 2
        }
      ]
    }
  }
  ```

**PATCH /admin/users/:id/status**
- **Description**: Update user status (ban/unban/lock wallet)
- **Request Body**:
  ```json
  {
    "action": "ban"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "User banned successfully"
  }
  ```

**PATCH /admin/users/:id/kyc**
- **Description**: Approve or reject KYC
- **Request Body**:
  ```json
  {
    "kycStatus": "approved",
    "kycLevel": 2
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "KYC updated successfully"
  }
  ```

**GET /admin/merchants**
- **Description**: Get all merchants
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `search` (optional): Search term
  - `verified` (optional): Filter by verification status
  - `isActive` (optional): Filter by active status
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "merchants": [
        {
          "id": "user_123456",
          "businessName": "My Business Ltd",
          "tradingName": "My Store",
          "businessType": "retail",
          "category": "electronics",
          "verified": true,
          "isActive": true
        }
      ]
    }
  }
  ```

**POST /admin/merchants/:id/verify**
- **Description**: Verify merchant
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Merchant verified successfully"
  }
  ```

**GET /admin/transactions**
- **Description**: Get all transactions
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "transactions": [
        {
          "id": "txn_123456",
          "reference": "REF-123456",
          "amount": 5000,
          "type": "transfer",
          "status": "success",
          "senderName": "John Doe",
          "recipientName": "Jane Smith"
        }
      ]
    }
  }
  ```

**GET /admin/kyc**
- **Description**: Get all KYC submissions
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "submissions": [
        {
          "id": "kyc_123456",
          "userId": "user_123456",
          "userName": "John Doe",
          "userEmail": "john@example.com",
          "idType": "BVN + NIN",
          "kycLevel": 1,
          "status": "pending"
        }
      ]
    }
  }
  ```

**GET /admin/disputes**
- **Description**: Get all disputes
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "disputes": [
        {
          "id": "disp_123456",
          "ticketNumber": "DISP-2026-001",
          "userName": "John Doe",
          "issueType": "wrong_debit",
          "status": "open",
          "priority": "high",
          "amount": 5000
        }
      ]
    }
  }
  ```

**PATCH /admin/disputes/:id**
- **Description**: Update dispute status
- **Request Body**:
  ```json
  {
    "status": "resolved"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Dispute updated successfully"
  }
  ```

**GET /admin/settings**
- **Description**: Get platform settings
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "singleton",
      "config": {
        "platformName": "BadePay",
        "supportEmail": "support@badepay.com",
        "supportPhone": "+234 800 123 4567",
        "maxDailyTransferLimit": 500000,
        "kycThreshold": 100000,
        "autoApproveBvn": false,
        "maintenanceMode": false
      }
    }
  }
  ```

**PUT /admin/settings**
- **Description**: Update platform settings
- **Request Body**:
  ```json
  {
    "platformName": "BadePay",
    "supportEmail": "support@badepay.com",
    "maxDailyTransferLimit": 500000,
    "kycThreshold": 100000,
    "autoApproveBvn": false,
    "maintenanceMode": false
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "singleton",
      "config": { ... }
    }
  }
  ```

---

## Web Application Documentation

### Overview

The BadePay web application provides a full-featured platform for both consumers and merchants to manage their financial activities.

### Features

#### 1. User Registration & Authentication

**Registration Flow:**
1. User navigates to `/register`
2. Fills in registration form:
   - Email address
   - Password (min 8 characters)
   - First name
   - Last name
   - Phone number (optional)
   - User type (Consumer or Merchant)
3. Submits form
4. OTP is sent to email via Resend
5. User enters OTP to verify email
6. Account is created and user is logged in
7. User is prompted to set transaction PIN

**Login Flow:**
1. User navigates to `/login`
2. Enters email and password
3. Submits form
4. If credentials are valid, user is logged in
5. Access token and refresh token are stored in localStorage
6. User is redirected to dashboard

**Password Reset Flow:**
1. User clicks "Forgot Password" on login page
2. Enters email address
3. OTP is sent to email
4. User enters OTP and new password
5. Password is updated
6. User can login with new password

#### 2. Dashboard

**Consumer Dashboard:**
- **Wallet Balance**: Display current balance with quick actions
- **Quick Actions**: Send money, Add money, Pay bills, Buy airtime
- **Recent Transactions**: Last 5 transactions with details
- **Quick Transfer**: Mini form to send money to saved contacts
- **Notifications**: Pending KYC, new transactions, disputes

**Merchant Dashboard:**
- **Store Overview**: Store name, status, total products, orders
- **Quick Actions**: Add product, View orders, Manage store
- **Sales Summary**: Today's sales, total revenue, pending orders
- **Recent Orders**: Last 5 orders with status
- **Store Link**: Copyable store URL for sharing

#### 3. Wallet Management

**Add Money:**
- Navigate to `/add-money`
- Enter amount to add
- Select payment method (Paystack)
- Click "Proceed to Payment"
- Redirected to Paystack payment page
- Complete payment
- Wallet is credited automatically

**Withdraw Funds:**
- Navigate to `/withdraw`
- Enter amount to withdraw
- Select bank account from saved accounts
- Enter transaction PIN for verification
- Submit withdrawal request
- Funds are transferred to bank account

**Transaction PIN:**
- Set during registration
- Required for all financial transactions
- Can be changed from settings
- 4-digit numeric PIN

#### 4. Money Transfers

**Send to BadePay User:**
- Navigate to `/transfer`
- Select "BadePay Transfer"
- Enter recipient's account number or phone number
- Enter amount
- Add optional note
- Enter transaction PIN
- Submit transfer
- Funds are transferred instantly

**Bank Transfer:**
- Navigate to `/transfer`
- Select "Bank Transfer"
- Select bank from dropdown
- Enter account number
- Enter account name (auto-verified)
- Enter amount
- Enter transaction PIN
- Submit transfer
- Funds are transferred to bank account

**Saved Beneficiaries:**
- Save frequently used recipients
- Quick transfer to saved beneficiaries
- Manage beneficiaries from settings

#### 5. Bill Payments

**Airtime:**
- Navigate to `/bills/airtime`
- Select network provider (MTN, Airtel, Glo, 9mobile)
- Enter phone number
- Enter amount
- Enter transaction PIN
- Submit payment
- Airtime is credited instantly

**Electricity:**
- Navigate to `/bills/electricity`
- Select electricity provider
- Enter meter number
- Select meter type (prepaid/postpaid)
- Enter amount
- Enter transaction PIN
- Submit payment
- Electricity token is generated

**Data Bundles:**
- Navigate to `/bills/data`
- Select network provider
- Select data bundle
- Enter phone number
- Enter transaction PIN
- Submit payment
- Data is credited instantly

**TV Subscription:**
- Navigate to `/bills/tv`
- Select TV provider (DSTV, GOtv, StarTimes)
- Enter smart card number
- Select package
- Enter transaction PIN
- Submit payment
- Subscription is activated

#### 6. QR Code Payments

**Generate QR Code:**
- Navigate to `/qr`
- Enter amount (optional)
- Add label/note (optional)
- Click "Generate QR"
- QR code is displayed
- Share QR code link or download image
- Scan to pay

**Dynamic QR Codes:**
- Create QR codes with fixed amounts
- Set expiration time
- Generate multiple QR codes for different purposes
- Track each QR code separately

**Scan to Pay:**
- Navigate to `/scan`
- Scan merchant's QR code
- Enter amount (if not fixed)
- Enter transaction PIN
- Complete payment
- Receipt is generated

#### 7. Merchant Store

**Store Setup:**
- Complete merchant onboarding first
- Navigate to `/merchant/onboarding-fill`
- Fill in business details:
  - Business name
  - Trading name
  - Business type
  - Category
  - Business address
  - RC number
  - Tax ID
  - Support phone
  - Payout preference
- Submit onboarding
- Wait for admin verification
- Once verified, create store

**Create Store:**
- Navigate to `/merchant/store`
- Click "Create Store"
- Enter store name
- Enter store description
- Set store slug (URL)
- Publish store
- Store is live

**Add Products:**
- Navigate to `/merchant/store`
- Click "Add Product"
- Enter product details:
  - Product name
  - Description
  - Price
  - Stock quantity
  - Upload product images
  - Add variations (size, color, etc.)
- Save product
- Product is added to store

**Manage Orders:**
- Navigate to `/merchant/store`
- View orders tab
- See all customer orders
- View order details
- Update order status
- Process refunds if needed

**Store Analytics:**
- View sales summary
- Track product performance
- Monitor customer engagement
- Export sales reports

#### 8. KYC Verification

**KYC Levels:**
- **Level 0**: Unverified - Limited functionality
- **Level 1**: Basic verification - Email verified
- **Level 2**: Full verification - BVN/NIN verified
- **Level 3**: Enhanced verification - Address verified

**Submit KYC:**
- Navigate to `/kyc`
- Select KYC level to upgrade to
- Upload required documents:
  - BVN (Bank Verification Number)
  - NIN (National Identity Number)
  - Selfie photo
  - Address proof (utility bill)
- Submit documents
- Wait for admin review
- KYC status is updated

**KYC Status:**
- **Pending**: Under review
- **Approved**: Verification complete
- **Rejected**: Verification failed, resubmit

#### 9. Cards Management

**Add Card:**
- Navigate to `/cards`
- Click "Add Card"
- Enter card details:
  - Card number
  - Expiry date
  - CVV
  - Cardholder name
- Save card
- Card is added to account

**Manage Cards:**
- View all saved cards
- Set default card
- Remove cards
- View card transactions

#### 10. Dispute Resolution

**Create Dispute:**
- Navigate to `/disputes`
- Click "Create Dispute"
- Select transaction to dispute
- Select issue type:
  - Wrong debit
  - Failed transfer
  - Failed bill payment
  - Account hacked
  - Unauthorized charge
  - Other
- Enter description
- Set priority (low, medium, high)
- Submit dispute
- Dispute ticket is created

**Track Disputes:**
- View all disputes
- Check dispute status
- Add comments/updates
- View admin responses

#### 11. Settings

**Profile Settings:**
- Update personal information
- Change profile picture
- Update contact details
- Change password

**Security Settings:**
- Change transaction PIN
- Enable/disable biometric authentication
- Manage trusted devices
- View login history

**Notification Settings:**
- Email notifications
- SMS notifications
- Push notifications
- Transaction alerts

**Privacy Settings:**
- Profile visibility
- Data sharing preferences
- Account deletion

---

## Mobile Application Documentation

### Overview

The BadePay mobile application provides the same functionality as the web application optimized for mobile devices with native features.

### Features

#### 1. Mobile-Optimized UI

**Bottom Navigation:**
- Home
- Transfers
- QR Code
- Store (merchants only)
- Profile

**Gesture Support:**
- Swipe to refresh
- Pull to load more
- Long press for context menus
- Haptic feedback

**Native Features:**
- Camera for QR scanning
- Biometric authentication (Face ID/Touch ID)
- Push notifications
- Share functionality
- Deep linking

#### 2. Authentication

**Biometric Login:**
- Enable biometric in settings
- Use Face ID or Touch ID to login
- Fallback to PIN if biometric fails

**Device Verification:**
- Trusted device management
- Device-specific OTP
- Remember device option

#### 3. Quick Actions

**Home Screen Quick Actions:**
- Send money
- Add money
- Pay bills
- Scan QR
- View balance

**Notification Center:**
- Real-time notifications
- Grouped by type
- Quick actions from notifications

#### 4. QR Code Features

**QR Scanner:**
- Built-in camera scanner
- Auto-detect QR codes
- Instant payment initiation
- Payment confirmation

**QR Generator:**
- Generate QR codes
- Share via native share sheet
- Save to photos
- Print functionality

#### 5. Store Management (Merchants)

**Mobile Store Dashboard:**
- Quick order management
- Product inventory
- Sales analytics
- Customer notifications

**Order Processing:**
- Accept/reject orders
- Update order status
- Send messages to customers
- Process refunds

#### 6. Offline Support

**Cached Data:**
- Recent transactions
- Saved beneficiaries
- Store information
- Profile data

**Sync on Reconnect:**
- Automatic data sync
- Conflict resolution
- Offline transaction queue

---

## Admin Portal Documentation

### Overview

The BadePay Admin Portal is a comprehensive dashboard for platform administrators to manage users, transactions, merchants, and platform settings.

### Access

**Login Credentials:**
- **Email**: admin@badepay.com
- **Password**: BadePay@Admin2026!
- **URL**: `/admin/login`

### Features

#### 1. Dashboard

**Overview Metrics:**
- Total users
- Active users
- Total merchants
- Total transactions
- Total volume
- Today's volume
- Pending KYC
- Open disputes

**Charts:**
- Daily Revenue Trend (Area chart)
- Monthly Volume Growth (Bar chart)
- Weekly User Growth (Line chart)

**Quick Actions:**
- Refresh data
- Export reports
- View recent activity

#### 2. User Management

**User List:**
- View all platform users
- Search by name, email, phone, account number
- Filter by status (all, active, suspended)
- Filter by KYC status (all, verified, pending, unverified)
- Sort by various fields

**User Actions:**
- View user details
- Suspend/activate user
- Lock/unlock wallet
- Update KYC status
- View transaction history
- View login history

**User Details:**
- Personal information
- KYC verification status
- Wallet balance
- Transaction history
- Login history
- Device information

#### 3. Merchant Management

**Merchant List:**
- View all merchants
- Search by business name, owner, email
- Filter by status (all, pending, approved, suspended)
- View store information
- View product count
- View order count

**Merchant Actions:**
- Verify merchant
- Suspend/activate merchant
- View merchant details
- View store performance
- View transaction history

**Merchant Verification:**
- Review business information
- Verify RC number
- Verify tax ID
- Approve/reject merchant
- Send verification email

#### 4. Transaction Monitoring

**Transaction List:**
- View all transactions
- Search by reference, sender, recipient
- Filter by status (all, success, pending, failed)
- Filter by type (all, transfer, bill, topup, withdrawal)
- Sort by date, amount

**Transaction Details:**
- Transaction information
- Sender details
- Recipient details
- Fees charged
- Timestamp
- Status

**Transaction Actions:**
- Reverse transaction (admin only)
- View dispute if any
- Add notes
- Flag for review

#### 5. KYC Review

**KYC Queue:**
- View pending KYC submissions
- Search by name, email
- Filter by status (all, pending, approved, rejected)
- View submitted documents

**KYC Actions:**
- Approve KYC
- Reject KYC
- Request additional documents
- Set KYC level
- Add notes

**KYC Details:**
- User information
- BVN verification status
- NIN verification status
- Selfie verification
- Address verification
- Submitted documents

#### 6. Dispute Resolution

**Dispute List:**
- View all disputes
- Search by ticket, user, issue type
- Filter by status (all, open, under review, resolved, closed)
- Filter by priority (all, high, medium, low)

**Dispute Actions:**
- Update dispute status
- Add comments
- Request additional information
- Resolve dispute
- Force close dispute

**Dispute Details:**
- Ticket number
- Reporter information
- Disputed amount
- Issue type
- Priority
- Status
- Transaction details
- Comments history

#### 7. Analytics

**Revenue Analytics:**
- Daily revenue trend
- Monthly revenue growth
- Revenue by category
- Revenue by user type

**User Analytics:**
- User growth over time
- Active users
- User retention
- User demographics

**Transaction Analytics:**
- Transaction volume
- Transaction trends
- Transaction by type
- Transaction success rate

**Merchant Analytics:**
- Merchant growth
- Top performing merchants
- Store performance
- Product sales

#### 8. Platform Settings

**General Settings:**
- Platform name
- Support email
- Support phone
- Corporate address

**Security Settings:**
- Maximum daily transfer limit
- KYC requirement threshold
- Auto-approve BVN users
- Maintenance mode

**Notification Settings:**
- Email notifications
- SMS notifications
- Push notifications

**Payment Settings:**
- Paystack configuration
- Transaction fees
- Withdrawal limits

#### 9. Audit Logs

**Activity Log:**
- View all admin actions
- Filter by admin
- Filter by action type
- Filter by date range
- Export logs

**Security Events:**
- Failed login attempts
- Suspicious activities
- IP blacklisting
- Device blocking

---

## Security Features

### Authentication Security

**JWT Tokens:**
- Access tokens expire in 1 hour
- Refresh tokens expire in 30 days
- Tokens are stored securely in localStorage
- Automatic token refresh

**Password Security:**
- Minimum 8 characters
- Hashed with bcrypt
- Salt rounds: 10
- Password strength validation

**Two-Factor Authentication:**
- TOTP-based 2FA
- Optional for enhanced security
- Backup codes available
- Recovery process

### API Security

**Rate Limiting:**
- Global: 100 requests per 15 minutes per IP
- Financial endpoints: 20 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes

**CORS Configuration:**
- Whitelisted origins only
- Credentials allowed
- Proper headers configuration

**Input Validation:**
- Zod schema validation
- Type checking
- Length validation
- Format validation

**SQL Injection Prevention:**
- Prisma ORM with parameterized queries
- No raw SQL queries
- Input sanitization

### Data Security

**Encryption:**
- Sensitive data encrypted at rest
- TLS 1.3 for data in transit
- AES-256 encryption

**Data Privacy:**
- GDPR compliant
- Data retention policies
- User data export
- Account deletion

**Audit Trail:**
- All admin actions logged
- IP address tracking
- Timestamp recording
- Action details

---

## Deployment Guide

### Backend Deployment

**Prerequisites:**
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Paystack account
- Resend account

**Environment Variables:**
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_ACCESS_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=your_secret_min_32_chars
ADMIN_JWT_SECRET=your_admin_secret_min_32_chars
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=BadePay <noreply@badepay.com>
PAYSTACK_SECRET_KEY=sk_...
BACKEND_BASE_URL=https://your-backend-url.com
```

**Deployment Steps:**
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run database migrations: `npx prisma migrate deploy`
5. Seed admin account
6. Build application: `npm run build`
7. Start server: `npm start`
8. Deploy to Vercel/Render

### Web Application Deployment

**Prerequisites:**
- Node.js 18+
- Vercel/Netlify account

**Environment Variables:**
```env
# Local: http://localhost:3000/api/v1 — Production: https://your-backend-url.com/api/v1
VITE_API_URL=http://localhost:3000/api/v1
```
If `VITE_API_URL` is not set, the app falls back to the production backend.

**Deployment Steps:**
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Build application: `npm run build`
5. Deploy to Vercel/Netlify
6. Configure custom domain
7. Test production build

### Mobile Application Deployment

**Prerequisites:**
- React Native CLI
- iOS Developer Account (for iOS)
- Google Play Developer Account (for Android)

**Environment Variables:**
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_PRODUCTION_API_URL=https://your-backend-url.com/api/v1
```

**Deployment Steps:**
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Build for iOS: `npx expo run:ios`
5. Build for Android: `npx expo run:android`
6. Test on physical devices
7. Submit to App Store
8. Submit to Play Store

---

## Troubleshooting

### Common Issues

**1. Authentication Failures**
- Check JWT secret configuration
- Verify token expiration
- Check refresh token validity
- Ensure CORS is configured correctly

**2. Database Connection Errors**
- Verify DATABASE_URL
- Check database credentials
- Ensure database is accessible
- Check network connectivity

**3. Payment Failures**
- Verify Paystack API key
- Check Paystack account status
- Ensure sufficient balance
- Check webhook configuration

**4. Email Delivery Issues**
- Verify Resend API key
- Check email configuration
- Ensure domain is verified
- Check spam filters

**5. Rate Limiting Errors**
- Check rate limit configuration
- Implement exponential backoff
- Cache frequently accessed data
- Optimize API calls

### Support Contact

**Technical Support:**
- Email: support@badepay.com
- Phone: +234 800 123 4567

**Documentation:**
- API Docs: https://docs.badepay.com
- Status Page: https://status.badepay.com

---

## Appendix

### API Response Codes

- **200 OK**: Request successful
- **201 Created**: Resource created
- **400 Bad Request**: Invalid request
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Error Response Format

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Success Response Format

```json
{
  "status": "success",
  "message": "Success message",
  "data": { ... }
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: June 26, 2026  
**Maintained By**: BadePay Development Team
