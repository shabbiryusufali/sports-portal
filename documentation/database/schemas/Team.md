# Team Table

| Column Name    | Data Type        | Constraints                                 | Description                             |
| -------------- | ---------------- | ------------------------------------------- | --------------------------------------- |
| id             | STRING           | PRIMARY KEY, DEFAULT cuid()                 | Unique team identifier                  |
| name           | STRING           | NOT NULL                                    | Name of the team                        |
| sport_id       | STRING           | FOREIGN KEY REFERENCES Sport(id), NOT NULL  | Identifier for the sport the team plays |
| created_at     | DATETIME         | DEFAULT now()                               | Team creation timestamp                 |
| updated_at     | DATETIME         | UPDATED AT                                  | Last update timestamp                   |
| is_active      | BOOLEAN          | DEFAULT true                                | Team active status                      |
| captain_id     | STRING           | FOREIGN KEY REFERENCES Player(id), NOT NULL | Identifier for the team captain         |
| members        | Player[]         | RELATION ("Players")                        | List of team member Player objects      |
| events         | Event[]          | RELATION ("Events")                         | Events associated with the team         |
| matchesAsTeamA | Match[]          | RELATION ("TeamA")                          | Matches where team is Team A            |
| matchesAsTeamB | Match[]          | RELATION ("TeamB")                          | Matches where team is Team B            |
| statistics     | Statistics[]     | RELATION ("TeamToStatistics")               | Team statistics                         |
| userStatistics | UserStatistics[] |                                             | User-specific statistics for the team   |

**Primary Key:** `id`
