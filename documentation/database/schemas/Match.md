# Match Table

| Column Name  | Data Type        | Constraints                                | Description                                                                  |
| ------------ | ---------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| id           | STRING           | PRIMARY KEY, DEFAULT cuid()                | Unique match identifier                                                      |
| sport_id     | STRING           | FOREIGN KEY REFERENCES Sport(id)           | Identifier for the sport                                                     |
| team_a_id    | STRING           | FOREIGN KEY REFERENCES Team(id)            | Identifier for Team A                                                        |
| team_b_id    | STRING           | FOREIGN KEY REFERENCES Team(id)            | Identifier for Team B                                                        |
| match_date   | DATETIME         | NOT NULL                                   | Date and time of the match                                                   |
| event_id     | STRING           | FOREIGN KEY REFERENCES Event(id), NULLABLE | Identifier for the related event (if any)                                    |
| score_team_a | INTEGER          | DEFAULT 0                                  | Score for Team A                                                             |
| score_team_b | INTEGER          | DEFAULT 0                                  | Score for Team B                                                             |
| status       | STRING           | NOT NULL                                   | Current status of the match (e.g., scheduled, ongoing, completed, cancelled) |
| created_at   | DATETIME         | DEFAULT now()                              | Match creation timestamp                                                     |
| updated_at   | DATETIME         | AUTO-UPDATED                               | Last update timestamp                                                        |
| statistics   | ARRAY            | FOREIGN KEY REFERENCES Statistics(id)      | List of statistics related to the match                                      |
| notes        | STRING           | NULLABLE                                   | Additional notes about the match                                             |
| match_type   | ENUM (MatchType) | ENUM: FRIENDLY, TOURNAMENT, NOT NULL       | Type of match: FRIENDLY or TOURNAMENT                                        |
