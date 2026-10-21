# Vendora — E-Commerce Backend

A feature-rich e-commerce backend built with Node.js, Express.js, and MongoDB, designed to support a complete online shopping experience with secure authentication, product management, shopping carts, order processing, and online payments through Paymob.

Vendora focuses on real-world backend development practices, including modular architecture, data validation, inventory management, payment verification, security middleware, and reliable order processing.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Authentication and Authorization](#authentication-and-authorization)
- [User Management](#user-management)
- [Product Catalog](#product-catalog)
- [Product Variants and Media](#product-variants-and-media)
- [Shopping Cart](#shopping-cart)
- [Orders and Checkout](#orders-and-checkout)
- [Payment Integration](#payment-integration)
- [Security](#security)
- [Email Services](#email-services)
- [Error Handling and Validation](#error-handling-and-validation)
- [Database and Transactions](#database-and-transactions)
- [API Documentation](#api-documentation)
- [API Conventions](#api-conventions)
- [Authorization Note](#authorization-note)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Future Improvements](#future-improvements)

## Overview

Vendora is a backend system for an e-commerce platform inspired by real-world marketplaces such as Noon.

The project goes beyond basic CRUD operations by implementing interconnected business workflows, including product variants, cart management, order creation, discount calculations, inventory validation, and payment processing.

The main goals are to:

- Build a modular and maintainable RESTful API.
- Implement secure authentication and role-based authorization.
- Manage products, categories, subcategories, brands, and product variants.
- Support shopping carts and checkout workflows.
- Integrate Paymob for online payments.
- Validate payment callbacks and protect against duplicate payment processing.
- Handle errors consistently and validate incoming requests.
- Apply security best practices across the API.

## Tech Stack

### Backend

- Node.js
- Express.js
- JavaScript

### Database

- MongoDB
- Mongoose
- MongoDB Transactions

### Authentication and Security

- JSON Web Tokens (JWT)
- Refresh Tokens
- HTTP Cookies
- CSRF Protection
- Password Hashing
- Request Validation and Sanitization

### Payments

- Paymob Payment Gateway
- Payment Intention API
- Payment Callback Verification
- Transaction Inquiry

### Media and File Uploads

- Multer
- Cloudinary
- Buffer-based Image Uploads

### Email Services

- Nodemailer
- SMTP
- OTP and Email Verification Workflows

### Development and Deployment

- Git and GitHub
- Postman
- Environment Variables
- Render / Vercel deployment experiments

## Architecture

The project follows a modular, separation-of-concerns approach, keeping business logic separate from HTTP request handling and database operations.

The main application responsibilities are organized into modules such as:

- **Routes:** Define API endpoints and connect middleware to controllers.
- **Controllers:** Handle HTTP requests and responses.
- **Services:** Implement business logic and coordinate database operations.
- **Models:** Define MongoDB collections and Mongoose schemas.
- **Validators:** Validate incoming request data.
- **Utilities:** Provide reusable helpers for shared functionality.
- **Middleware:** Handle authentication, authorization, uploads, validation, and errors.

The application also uses reusable utilities and shared services to reduce duplicated code and keep business rules consistent across different workflows.

### Centralized Error Handling

A shared error-handling system provides consistent API error responses.

- Custom `ApiError` class for application-specific errors.
- `asyncWrapper` for handling asynchronous controller errors.
- Global error-handling middleware.
- Consistent handling of validation failures, unauthorized requests, missing resources, and unexpected server errors.

### API Features

The API uses reusable query-processing functionality to support common listing operations, including:

- Pagination.
- Sorting.
- Filtering.
- Search and query-string processing.
- Population of related documents where required.

## Authentication and Authorization

The authentication system manages user identity, sessions, and access permissions.

### Authentication Features

- User registration and login.
- Secure password hashing.
- JWT-based authentication.
- Access token and refresh token workflows.
- Refresh tokens stored and managed through HTTP cookies.
- Token-based access to protected routes.
- Logout and refresh-token handling.
- Email verification and OTP-related workflows.
- Password reset functionality.

### Role-Based Access Control

The application supports three roles:

- `user`
- `admin`
- `super-admin`

Authorization middleware restricts protected operations according to user permissions.

Public registration does not allow users to choose privileged roles, preventing users from assigning themselves administrator permissions.

## User Management

The user module handles account-related operations and protected user functionality.

Core responsibilities include:

- Account registration and login.
- Email verification workflows.
- Password recovery.
- Authenticated account operations.
- Role and permission enforcement.
- Protected endpoints for user-specific resources.

Sensitive operations are handled through validation and authentication middleware rather than relying on client-side restrictions.

## Product Catalog

Vendora uses separate collections to organize the product catalog and its relationships.

### Categories and Subcategories

- Category management.
- Subcategory management.
- Relationships between categories and their subcategories.
- Category image management.
- Organized product classification.

### Brands

- Dedicated brand collection.
- Relationships between brands and products.
- Brand-based product filtering.

### Products

The product system supports structured product information, including:

- Product name.
- Short description.
- Full description.
- SKU.
- Quantity and inventory information.
- Price.
- Discounted price.
- Category and subcategory relationships.
- Brand relationship.
- Tags.
- Product cover image.
- Additional product images.
- Product variants.

The catalog is designed to support more realistic marketplace data instead of storing all catalog information in a single unstructured collection.

### Product Discovery

Reusable query functionality supports product listing endpoints with pagination, filtering, sorting, and search.

This allows clients to retrieve products based on catalog attributes without implementing separate query logic for every listing endpoint.

## Product Variants and Media

Products can contain multiple variants to represent purchasable options such as color and size.

Each variant can contain its own:

- Color name.
- Color hexadecimal value.
- Size.
- Available quantity.
- Price.
- Discounted price.
- Variant-specific image.

Variant identifiers are retained so that individual variants can be referenced when adding items to the cart and processing orders.

### Variant-Aware Product Images

The image handling logic supports variant-specific images as well as product-level images.

When variants have their own images, those images can also be included in the product's returned image collection, allowing clients to display variant imagery alongside the main product gallery.

### Cloudinary Integration

Cloudinary handles remote image storage, while Multer processes incoming file uploads.

The upload workflow uses in-memory file storage and buffer-based Cloudinary uploads.

Supported image operations include:

- Product cover image uploads.
- Additional product images.
- Variant image uploads.
- Category image uploads.
- Cloudinary public ID storage.
- Image deletion using the stored public ID.

Upload restrictions are configured to limit file size and the number of accepted images per field.

## Shopping Cart

The cart system is designed around separate cart and cart-item collections.

This structure separates the user's cart from the individual items it contains.

### Cart Functionality

- User-associated cart management.
- Adding products to the cart.
- Tracking individual cart items.
- Updating item quantities.
- Removing cart items.
- Retrieving paginated cart-item results.
- Populating product information when retrieving cart items.

### Variant-Aware Cart Items

Cart items can store the selected variant ID, quantity, size, color, image, unit price, and discounted price.

This allows the cart to represent the exact product configuration selected by the customer rather than treating every variant of a product as the same item.

Product responses used in cart listings can exclude large or unnecessary fields, such as complete product galleries and all variant details, to avoid returning excessive data.

## Orders and Checkout

The order workflow coordinates cart data, product information, inventory validation, pricing, discounts, and payment status.

### Order Processing

The order module is designed to support:

- Preparing order data from the shopping cart.
- Creating order items with product and variant information.
- Validating product availability.
- Validating requested quantities.
- Calculating order totals.
- Applying eligible discounts and coupons.
- Validating shipping address information.
- Recording order-item details and pricing.
- Tracking order and payment status.

### Order Item Snapshots

Order items can preserve relevant product details, including:

- Product ID.
- Product name.
- SKU.
- Product cover image.
- Selected variant information.
- Quantity and pricing information.

Preserving these details helps maintain a useful record of what the customer ordered, even when catalog information changes later.

### Shared Order Services

The order preparation and creation logic is structured for reuse across Cash on Delivery (COD) and online payment workflows.

This avoids maintaining two independent implementations of the same core order-processing rules.

### Inventory and Pricing Validation

The backend validates product availability and recalculates order totals using server-side data.

Prices and discounts should be derived from trusted backend records rather than accepted directly from client-submitted totals.

The checkout process is designed to keep product availability, pricing, and order information consistent.

## Payment Integration

Vendora integrates Paymob to support online payments through a payment gateway rather than relying on manually entered payment links.

### Paymob Payment Flow

The online payment workflow is organized around the following steps:

1. Prepare and validate the order.
2. Create the payment request through Paymob's Payment Intention API.
3. Send the required amount, currency, billing information, and supported payment method.
4. Return the required checkout information to the client.
5. Allow the customer to complete the payment through Paymob Checkout.
6. Receive the payment callback.
7. Verify the callback and validate the transaction details.
8. Update the payment and associated order according to the verified result.
9. Use transaction inquiry when reconciliation is needed.

### Payment Amount Handling

Amounts are converted to the smallest currency unit expected by the gateway. For EGP payments, this means converting pounds to piastres before sending the amount to Paymob.

Billing information is prepared from the customer's shipping and checkout data as required by the payment API.

### Callback Verification

Payment callbacks are treated as untrusted input until verified.

The payment workflow includes callback verification and transaction-data validation before processing payment state changes.

The verification process is designed to protect against forged callbacks and inconsistent transaction information.

### Idempotent Payment Processing

Payment processing is designed to handle repeated callbacks safely.

Idempotency helps prevent the same payment event from being applied multiple times, which is especially important when gateways retry notifications or network failures cause duplicate requests.

### Transaction Inquiry

Paymob Transaction Inquiry provides a way to retrieve transaction information and reconcile a payment when callback delivery or payment-state synchronization requires additional verification.

### Payment Status Management

The payment model supports states such as:

- `pending`
- `paid`
- `failed`
- `refunded`

An empty initial status is also supported by the current schema.

Keeping payment status separate from the broader order lifecycle makes it possible to represent payment outcomes independently from order fulfillment.

## Security

Security is a key part of the backend design rather than an afterthought.

### Authentication and Access Control

- JWT-based authentication.
- Refresh-token handling.
- Protected routes.
- Role-based authorization.
- Restricted assignment of privileged roles.

### CSRF Protection

CSRF protection is implemented for applicable cookie-authenticated requests to help prevent unauthorized cross-site actions.

The protection depends on correctly configured secrets and client-side handling of the required CSRF token.

### NoSQL Injection Protection

Request handling includes protection measures against malicious MongoDB query operators and unsafe query input.

### Cross-Site Scripting (XSS)

Input handling and sanitization measures help reduce the risk of malicious content being stored or processed by the application.

Frontend output encoding remains important when displaying user-controlled content.

### HTTP Parameter Pollution (HPP)

HTTP parameter pollution protection is used to handle repeated query parameters safely.

Legitimate repeated filter parameters must remain supported where the API intentionally allows them.

### Request and Upload Limits

- Request body size limits.
- Image upload size restrictions.
- Limits on the number of uploaded files.
- Validation of incoming data.
- Controlled handling of malformed requests.

### Payment Security

- Verification of payment callbacks.
- Validation of transaction information.
- Server-side price and order validation.
- Idempotent payment processing.
- Payment status reconciliation.

Security middleware is intended to complement, not replace, correct authorization checks and business-logic validation.

## Email Services

Nodemailer and SMTP are used for application email workflows.

Email functionality supports account-related operations such as verification codes, OTP delivery, and password-reset workflows.

Application-specific values, including the application name, can be configured through environment variables rather than hardcoded into email templates.

Email delivery also depends on correctly configured SMTP credentials and the network capabilities of the deployment environment.

## Error Handling and Validation

The backend uses a centralized error-handling strategy to make failures predictable and easier to debug.

- Asynchronous error handling through reusable wrappers.
- Custom application errors.
- Global error-handling middleware.
- Request validation.
- Database validation through Mongoose schemas.
- Controlled handling of missing and invalid resources.
- Consistent API error responses.

Validation is applied at the API and data-model layers to help preserve data integrity.

## Database and Transactions

MongoDB stores application data, while Mongoose provides schemas, validation, relationships, and database access.

The project uses MongoDB transactions for workflows that require multiple related database operations to succeed or fail together.

For example, transactional order processing can help prevent partially applied database changes when a workflow involves order records and inventory updates.

MongoDB multi-document transactions require a compatible deployment configuration, such as a replica set.

External payment operations require additional coordination because a MongoDB transaction cannot roll back a payment already processed by Paymob.

## API Documentation

All endpoints use the `/api/v1` prefix. Replace `:id` with the corresponding resource ID.

**Access notation**

- `Bearer`: The Postman request is configured to send a Bearer token.
- `Not specified`: The request does not explicitly configure Bearer authentication in the collection; verify the actual route middleware.
- `CSRF`: The Postman request includes the `x-csrf-token` header.

> The access labels below describe the Postman collection configuration, not a definitive statement of the backend's authorization rules. Role restrictions must be verified in the route middleware.

### 1. Authentication

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/auth/csrf-token` | Get a CSRF token | Bearer |
| POST | `/auth/register` | Register a new account | Not specified |
| POST | `/auth/login` | Authenticate a user | Not specified |
| POST | `/auth/logout` | Log out a user | Not specified |
| POST | `/auth/refresh-token` | Refresh authentication tokens | Not specified |
| POST | `/auth/resend-verification-email` | Resend the verification email | Not specified |
| POST | `/auth/verify-email` | Verify a user's email | Not specified |
| PATCH | `/auth/:id/change-role` | Change a user's role | Bearer + CSRF |
| POST | `/auth/:id/transfer-role` | Transfer a role | Bearer + CSRF |
| PATCH | `/auth/password/change` | Change the current password | Bearer + CSRF |
| POST | `/auth/password/forgot` | Request password recovery | Not specified |
| POST | `/auth/password/forgot/resend` | Resend the password-reset OTP | Not specified |
| POST | `/auth/password/verify-otp` | Verify the password-reset OTP | Not specified |
| POST | `/auth/password/reset` | Reset the password | Not specified |

### 2. Users

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/users/me` | Get the current user's profile | Bearer |
| GET | `/users/me/reviews` | Get the current user's reviews | Bearer |
| GET | `/users/me/wishlist` | Get the current user's wishlist | Bearer |
| GET | `/users/me/orders` | Get the current user's orders | Bearer |
| GET | `/users/:id` | Get a user by ID | Bearer |
| GET | `/users/:id/reviews` | Get a user's reviews | Bearer |
| GET | `/users/:id/wishlist` | Get a user's wishlist | Bearer |
| GET | `/users/:id/orders` | Get a user's orders | Bearer |
| GET | `/users` | Retrieve users | Bearer |
| PATCH | `/users/me` | Update the current user's profile | Bearer + CSRF |
| PATCH | `/users/:id` | Update a user | Bearer + CSRF |
| DELETE | `/users/me` | Delete the current user's account | Bearer + CSRF |
| DELETE | `/users/:id` | Delete a user | Bearer + CSRF |

### 3. Addresses

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/addresses` | Get the current user's addresses | Bearer |
| POST | `/addresses` | Add a new address | Bearer + CSRF |
| PATCH | `/addresses/:id` | Update an address | Bearer + CSRF |
| DELETE | `/addresses/:id` | Delete an address | Bearer + CSRF |

### 4. Categories

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/categories` | Retrieve categories | Not specified |
| GET | `/categories/:id` | Get a category by ID | Not specified |
| GET | `/categories/:id/subcategories` | Get a category's subcategories | Bearer |
| POST | `/categories` | Create a category | Bearer + CSRF |
| PATCH | `/categories/:id` | Update a category | Bearer + CSRF |
| DELETE | `/categories/:id` | Delete a category | Bearer + CSRF |

### 5. Subcategories

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/subcategories` | Retrieve subcategories | Bearer |
| GET | `/subcategories/:id` | Get a subcategory by ID | Not specified |
| POST | `/subcategories` | Create a subcategory | Bearer + CSRF |
| PATCH | `/subcategories/:id` | Update a subcategory | Bearer + CSRF |
| DELETE | `/subcategories/:id` | Delete a subcategory | Bearer + CSRF |

### 6. Brands

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/brands` | Retrieve brands | Not specified |
| GET | `/brands/:id` | Get a brand by ID | Not specified |
| POST | `/brands` | Create a brand | Bearer + CSRF |
| PATCH | `/brands/:id` | Update a brand | Bearer + CSRF |
| DELETE | `/brands/:id` | Delete a brand | Bearer + CSRF |

### 7. Products and Product Reviews

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/products` | Retrieve products | Not specified |
| GET | `/products/:id` | Get a product by ID | Not specified |
| POST | `/products` | Create a product with its catalog data and media | Bearer + CSRF |
| PATCH | `/products/:id` | Update a product | Bearer + CSRF |
| DELETE | `/products/:id` | Delete a product | Bearer + CSRF |
| GET | `/products/:id/reviews` | Retrieve reviews for a product | Bearer |
| GET | `/products/:id/reviews/:reviewId` | Get a specific product review | Not specified |
| POST | `/products/:id/reviews` | Create a review for a product | Bearer + CSRF |

### 8. Reviews

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/reviews` | Retrieve reviews | Not specified |
| GET | `/reviews/:id` | Get a review by ID | Not specified |
| POST | `/reviews` | Create a review | Bearer + CSRF |
| PATCH | `/reviews/:id` | Update a review | Bearer + CSRF |
| DELETE | `/reviews/:id` | Delete a review | Bearer + CSRF |

### 9. Wishlist

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/wishlists` | Retrieve wishlist data | Bearer |
| PATCH | `/wishlists/:id/toggle` | Toggle a wishlist item | Bearer + CSRF |

### 10. Coupons

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| GET | `/coupons` | Retrieve coupons | Bearer |
| GET | `/coupons/:id` | Get a coupon by ID | Bearer |
| POST | `/coupons` | Create a coupon | Bearer + CSRF |
| PATCH | `/coupons/:id` | Update a coupon | Bearer + CSRF |
| DELETE | `/coupons/:id` | Delete a coupon | Bearer + CSRF |

### 11. Shopping Cart

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| POST | `/carts/add` | Add a product or variant to the cart | Bearer + CSRF |
| GET | `/carts/my-cart` | Retrieve the current user's cart | Bearer |
| PATCH | `/carts/update` | Update a cart item's quantity | Bearer + CSRF |
| DELETE | `/carts/remove` | Remove an item from the cart | Bearer + CSRF |
| DELETE | `/carts/clear` | Clear the cart | Bearer + CSRF |
| POST | `/carts/apply-coupon` | Apply a coupon to the cart | Bearer + CSRF |
| DELETE | `/carts/remove-coupon` | Remove the applied coupon | Bearer + CSRF |

### 12. Orders

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| POST | `/orders` | Create an order | Bearer + CSRF |
| GET | `/orders` | Retrieve orders | Bearer |
| GET | `/orders/:id` | Get an order by ID | Bearer |
| PATCH | `/orders/:id/status` | Update an order's status | Bearer |

### 13. Payments

| Method | Endpoint | Description | Access |
| ------ | -------- | ----------- | ------ |
| POST | `/payments/checkout` | Create a Paymob payment intention and initiate checkout | Bearer + CSRF |

**Additional payment notes:** The Postman collection does not contain a separate payment-callback request. The payment callback is normally called by the payment provider, so document its actual URL and HTTP method from the backend route configuration. Transaction inquiry and automated reconciliation should be listed as endpoints or background jobs only if they are implemented in the repository.

## API Conventions

- **Base URL:** Configure `Base_URL` in the Postman environment.
- **Authentication:** Protected requests may require a Bearer token.
- **CSRF protection:** Requests marked `Bearer + CSRF` include the `x-csrf-token` header in the collection.
- **Pagination:** Listing endpoints may accept query parameters such as `page` and `limit`.
- **Filtering and sorting:** Supported query parameters depend on the individual endpoint.
- **Resource identifiers:** Replace path placeholders such as `:id` with actual resource IDs.
- **File uploads:** Product, category, and profile-image operations may use `multipart/form-data`.

## Authorization Note

Authentication and authorization are separate concerns. A valid Bearer token identifies the authenticated user, while backend middleware determines whether that user can perform a specific action.

Administrative restrictions, resource ownership, and super-administrator permissions must be documented according to the actual Express routes and authorization middleware.

## Environment Variables

Create a `.env` file in the project root and configure the required values for your local environment.

Typical configuration categories include:

```ini
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CSRF_SECRET=your_csrf_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_paymob_integration_id

EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password

APP_NAME=Vendora
```

This is an illustrative configuration template, not a complete list of the project's actual environment variables. Match the names and required values to the application's configuration files before running it.

Never commit real API keys, database credentials, JWT secrets, SMTP passwords, or other sensitive values to GitHub.

## Installation and Setup

### Prerequisites

- Node.js.
- MongoDB configured for the database operations required by the application.
- Cloudinary credentials for image uploads.
- Paymob credentials for online payment testing.
- SMTP credentials for email functionality.

### 1. Clone the Repository

```bash
git clone https://github.com/Hazem-2002/E-Commerce-Backend.git
cd E-Commerce-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create your `.env` file and add the required database, authentication, media, payment, and email configuration.

### 4. Start the Development Server

```bash
npm run dev
```

The default application port is `5000` unless overridden by the `PORT` environment variable.

### 5. Test the API

Use Postman or another HTTP client to test the endpoints, authentication flows, catalog operations, cart and checkout workflows, and payment integration.

Payment testing requires appropriate Paymob test credentials and a callback URL accessible to the payment gateway.

## Future Improvements

Potential improvements for future iterations include:

- Automated unit and integration testing.
- API documentation using OpenAPI/Swagger.
- Structured logging and monitoring.
- Automated payment reconciliation and recovery jobs.
- More comprehensive payment failure and refund workflows.
- CI/CD automation.
- Additional performance optimizations and database indexing.

## Author

**Hazem Mahmoud**

Full Stack Web Developer

Electronics and Communications Engineering Graduate — Mansoura University

- GitHub: [Hazem-2002](https://github.com/Hazem-2002)
- Project Repository: [E-Commerce-Backend](https://github.com/Hazem-2002/E-Commerce-Backend)

---

Built as a practical backend engineering project focused on real-world e-commerce workflows, payment integration, application security, and maintainable API architecture.
