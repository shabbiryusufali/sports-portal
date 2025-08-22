# User Statistics Table

| Column Name      | Data Type | Constraints                             | Description                                     |
| ---------------- | --------- | --------------------------------------- | ----------------------------------------------- |
| id               | UUID      | PRIMARY KEY                             | Unique statistics identifier                    |
| user_id          | UUID      | FOREIGN KEY REFERENCES User(id)         | Identifier for the user                         |
| sport_id         | UUID      | FOREIGN KEY REFERENCES Sport(id)        | Identifier for the sport                        |
| games_played     | INTEGER   | DEFAULT 0                               | Total number of games played by the user        |
| wins             | INTEGER   | DEFAULT 0                               | Total number of games won by the user           |
| losses           | INTEGER   | DEFAULT 0                               | Total number of games lost by the user          |
| draws            | INTEGER   | DEFAULT 0                               | Total number of games drawn by the user         |
| flexible_stats[] | JSONB     | FOREIGN KEY REFERENCES Statistics(id)[] | List of flexible statistics related to the user |

**Primary Key:** `id`

# Statistics Table

| Column Name | Data Type | Constraints                      | Description                                       |
| ----------- | --------- | -------------------------------- | ------------------------------------------------- |
| id          | UUID      | PRIMARY KEY                      | Unique statistics identifier                      |
| user_id     | UUID      | FOREIGN KEY REFERENCES User(id)  | Identifier for the user                           |
| sport_id    | UUID      | FOREIGN KEY REFERENCES Sport(id) | Identifier for the sport                          |
| key         | TEXT      | NOT NULL                         | Name of the statistic                             |
| value       | TEXT      | NOT NULL                         | Value of the statistic                            |
| created_at  | TIMESTAMP | DEFAULT NOW()                    | Timestamp when the statistic was created          |
| updated_at  | TIMESTAMP |                                  | Last update timestamp                             |
| match_id    | UUID      | FOREIGN KEY REFERENCES Match(id) | Identifier for the match related to the statistic |

**Primary Key:** `id`
