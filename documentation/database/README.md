# Database

This section provides detailed information about the database schemas used in the Sports Portal application. Each schema is designed to efficiently manage the relationships between different entities in the platform.

## Overview
The database schemas define the structure of the data stored in the application. Each schema includes the table name, column names, data types, constraints, and descriptions.

## What Do We Use for Database?
The Sports Portal application uses PostgreSQL as its relational database management system. PostgreSQL is chosen for its robustness, scalability, and support for complex queries and transactions.

## Database Schemas

### [Event Table](./database/schemas/Event.md)
The Event table stores information about sports events, including their details, participants, and status.

### [Sport Table](./database/schemas/Sport.md)
The Sport table contains information about different sports, including their names and descriptions.

### [Team Table](./database/schemas/Team.md)
The Team table holds data about sports teams, including their members, captain, and sport association. For the sake of this application, a single player is considered a team.

### [Match Table](./database/schemas/Match.md)
The Match table records details about matches, including the teams involved, scores, and match status.

### [Statistics Table](./database/schemas/Statistics.md)
The Statistics table captures various statistics related to matches, teams, and players.

### [User Table](./database/schemas/User.md)
The User table contains user account information, including login credentials and personal details.