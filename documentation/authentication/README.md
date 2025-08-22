# Authentication

This section covers the authentication and authorization mechanisms used in the Sports Portal application, including user registration, login, and access control.

## What Do We Use for Authentication?
The Sports Portal application uses Neon for authentication, which provides a secure and efficient way to manage user accounts and sessions. It supports features such as password hashing, session management, and role-based access control.

## User Registration
Users can register by providing their username, email, and password. The password is stored securely using hashing techniques.

## User Login
Users can log in using their username or email and password. Upon successful login, a session token is generated to maintain the user's authenticated state.

## Access Control
Access to various features of the application is controlled based on user roles and permissions. Users can have different roles such as admin, organizer, or participant, which determine their access level to events, teams, and matches.

## Password Management
Users can reset their passwords through a secure process that includes email verification. Passwords must meet complexity requirements to enhance security.	

## [User Table](../database/schemas/User.md)
The User table stores user account information, including login credentials and personal details. It is essential for managing user authentication and authorization within the application.