# User Statistics Table

| Column Name    | Data Type      | Constraints                           | Description                                     |
| -------------- | -------------- | ------------------------------------- | ----------------------------------------------- |
| id             | STRING         | PRIMARY KEY                           | Unique user statistics identifier               |
| team_id        | STRING         | FOREIGN KEY REFERENCES Team(id)       | Identifier for the team                         |
| sport_id       | STRING         | FOREIGN KEY REFERENCES Sport(id)      | Identifier for the sport                        |
| games_played   | INTEGER        | DEFAULT 0                             | Total number of games played by the user        |
| wins           | INTEGER        | DEFAULT 0                             | Total number of games won by the user           |
| losses         | INTEGER        | DEFAULT 0                             | Total number of games lost by the user          |
| draws          | INTEGER        | DEFAULT 0                             | Total number of games drawn by the user         |
| flexible_stats | ARRAY of STRINGs | FOREIGN KEY REFERENCES Statistics(id) | List of flexible statistics related to the user |
| created_at     | TIMESTAMP      | DEFAULT NOW()                         | Timestamp when the statistics were created      |
| updated_at     | TIMESTAMP      | ON UPDATE CURRENT_TIMESTAMP           | Last update timestamp                           |

**Primary Key:** `id`

# Statistics Table

| Column Name        | Data Type | Constraints                               | Description                                           |
| ------------------ | --------- | ----------------------------------------- | ----------------------------------------------------- |
| id                 | STRING    | PRIMARY KEY                               | Unique statistics identifier                          |
| match_id           | UUID      | FOREIGN KEY REFERENCES Match(id)          | Identifier for the related match                      |
| team_id            | UUID      | FOREIGN KEY REFERENCES Team(id)           | Identifier for the related team                       |
| key                | TEXT      | NOT NULL                                  | Name of the statistic                                 |
| value              | INTEGER   | NOT NULL                                  | Value of the statistic                                |
| minutes_played     | INTEGER   | DEFAULT 0                                 | Number of minutes played                              |
| created_at         | TIMESTAMP | DEFAULT NOW()                             | Timestamp when the statistic was created              |
| updated_at         | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP               | Last update timestamp                                 |
| user_statistics_id | UUID      | FOREIGN KEY REFERENCES UserStatistics(id) | Identifier for the related user statistics (optional) |

**Primary Key:** `id`
