| Column Name           | Data Type | Constraints                      | Description                                                                  |
| --------------------- | --------- | -------------------------------- | ---------------------------------------------------------------------------- |
| id                    | STRING    | PRIMARY KEY, DEFAULT cuid()      | Unique event identifier                                                      |
| name                  | STRING    | NOT NULL                         | Name of the event                                                            |
| description           | STRING    |                                  | Description of the event                                                     |
| start_time            | DATETIME  | NOT NULL                         | Start time of the event                                                      |
| end_time              | DATETIME  | NOT NULL                         | End time of the event                                                        |
| location              | STRING    |                                  | Location of the event                                                        |
| sport_id              | STRING    | FOREIGN KEY REFERENCES Sport(id) | Identifier for the sport associated with the event                           |
| created_at            | DATETIME  | DEFAULT now()                    | Event creation timestamp                                                     |
| updated_at            | DATETIME  | AUTO-UPDATED                     | Last update timestamp                                                        |
| organizer_id          | STRING    |                                  | Identifier for the user organizing the event                                 |
| participants          | RELATION  | RELATION TO Team[]               | List of teams participating in the event                                     |
| players               | RELATION  | RELATION TO Player[]             | List of players participating in the event                                   |
| status                | STRING    |                                  | Current status of the event (e.g., scheduled, ongoing, completed, cancelled) |
| notes                 | STRING    |                                  | Additional notes about the event                                             |
| event_type            | STRING    |                                  | Type of event (e.g., practice, game, tournament)                             |
| is_public             | BOOLEAN   | DEFAULT false                    | Indicates if the event is public or private                                  |
| registration_deadline | DATETIME  |                                  | Deadline for team registration for the event                                 |
| matches               | RELATION  | RELATION TO Match[]              | List of matches associated with the event                                    |

**Primary Key:** `id`
