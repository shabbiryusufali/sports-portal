
# User Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| username | TEXT | UNIQUE, NOT NULL | User's login name |
| email | TEXT | UNIQUE, NOT NULL | User's email address |
| password_hash | TEXT | NOT NULL | Hashed user password |
| full_name | TEXT | | User's full name |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | User account status |

**Primary Key:** `id`