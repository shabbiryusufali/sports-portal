# Match Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique match identifier |
| sport_id | UUID | FOREIGN KEY REFERENCES Sport(id) | Identifier for the sport |
| team_a_id | UUID | FOREIGN KEY REFERENCES Team(id) | Identifier for Team A |
| team_b_id | UUID | FOREIGN KEY REFERENCES Team(id) | Identifier for Team B |
| match_date | TIMESTAMP | NOT NULL | Date and time of the match |
| score_a | INTEGER | DEFAULT 0 | Score for Team A |
| score_b | INTEGER | DEFAULT 0 | Score for Team B |
| status | TEXT | DEFAULT 'scheduled' | Current status of the match (e.g., scheduled, ongoing, completed) |
| created_at | TIMESTAMP | DEFAULT NOW() | Match creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |
| referee_id | UUID | FOREIGN KEY REFERENCES User(id) | Identifier for the referee of the match |
| statistics | JSONB | FOREIGN KEY REFERENCES Statistics(id)[] | List of statistics related to the match |
| notes | TEXT | | Additional notes about the match |
| match_type | ENUM | CHECK (match_type IN ('practice', 'friendly', 'tournament')) | Type of match (e.g., practice, friendly, tournament) |