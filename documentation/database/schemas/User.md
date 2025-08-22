# User Table

| Column Name   | Data Type | Constraints          | Description                |
| ------------- | --------- | -------------------- | -------------------------- |
| id            | STRING    | PRIMARY KEY, CUID    | Unique user identifier     |
| username      | STRING    | UNIQUE, NOT NULL     | User's login name          |
| email         | STRING    | UNIQUE, NOT NULL     | User's email address       |
| password_hash | STRING    | NOT NULL             | Hashed user password       |
| created_at    | DATETIME  | DEFAULT NOW()        | Account creation timestamp |
| updated_at    | DATETIME  | AUTO-UPDATED         | Last update timestamp      |
| is_active     | BOOLEAN   | DEFAULT TRUE         | User account status        |
| player        | RELATION  | OPTIONAL, ONE-TO-ONE | Linked player profile      |

**Primary Key:** `id`
