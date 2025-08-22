# Platform

## Overview
The platform is designed to support a wide range of sports and activities, providing users with the ability to create, manage, and participate in various sports events. It includes features for user registration, event management, team organization, and match scheduling.

## Key Features
- **User Management**: Allows users to register, log in, and manage their profiles.
- **Event Management**: Users can create and manage sports events, including setting dates, locations, and participant teams.
- **Team Organization**: Users can create teams, assign members, and designate captains.
- **Match Scheduling**: The platform supports scheduling matches between teams, recording scores, and tracking match outcomes.
- **Statistics Tracking**: The platform captures and displays statistics related to teams, players, and matches.
- **Authentication and Authorization**: Secure user authentication and role-based access control to manage permissions for different user roles.
- **Flexible Statistics**: Users can define and track custom statistics related to their sports activities.

## Architecture
The platform is built using a microservices architecture, allowing for scalability and flexibility. Each component of the platform (user management, event management, team organization, etc.) is developed as a separate service that communicates with others through APIs.

## Technology Stack
- **[Next.js](https://nextjs.org/)**: Used for building the frontend of the application, providing a responsive and interactive user interface.
- **[PostgreSQL](https://www.postgresql.org/)**: The relational database management system used to store data related to users, events, teams, matches, and statistics.
- **[Neon](https://neon.com/)**: Used for database, authentication, providing secure user account management and session handling.
- **[Vercel](https://vercel.com/)**: The platform is hosted on Vercel, ensuring high availability and performance.

## Database Schemas
The platform uses a relational database to store data related to users, events, teams, matches, and statistics. Each schema is designed to efficiently manage the relationships between different entities in the platform.

> [!NOTE]
>  More details on the database schemas can be found in the [Database Schemas documentation](../database/README.md).