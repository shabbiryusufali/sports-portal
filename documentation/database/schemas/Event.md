# Event Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique event identifier |
| name | TEXT | NOT NULL | Name of the event |
| description | TEXT | | Description of the event |
| start_time | TIMESTAMP | NOT NULL | Start time of the event |
| end_time | TIMESTAMP | NOT NULL | End time of the event |
| location | TEXT | | Location of the event |
| sport_id | UUID | FOREIGN KEY REFERENCES Sport(id) | Identifier for the sport associated with the event |
| created_at | TIMESTAMP | DEFAULT NOW() | Event creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |
| organizer_id | UUID | FOREIGN KEY REFERENCES User(id) | Identifier for the user organizing the event |
| participants | JSONB | FOREIGN KEY REFERENCES Team(id)[] | List of teams participating in the event |
| status | TEXT | DEFAULT 'scheduled' | Current status of the event (e.g., scheduled, ongoing, completed) |
| notes | TEXT | | Additional notes about the event |
| event_type | ENUM | CHECK (event_type IN ('tournament', 'league', 'friendly')) | Type of event (e.g., tournament, league, friendly) |
| is_public | BOOLEAN | DEFAULT TRUE | Indicates if the event is public or private |
| registration_deadline | TIMESTAMP | | Deadline for team registration for the event |

**Primary Key:** `id`