# Team Table

| Column Name | Data Type | Constraints                       | Description                             |
| ----------- | --------- | --------------------------------- | --------------------------------------- |
| id          | UUID      | PRIMARY KEY                       | Unique team identifier                  |
| name        | TEXT      | NOT NULL                          | Name of the team                        |
| sport_id    | UUID      | FOREIGN KEY REFERENCES Sport(id)  | Identifier for the sport the team plays |
| created_at  | TIMESTAMP | DEFAULT NOW()                     | Team creation timestamp                 |
| updated_at  | TIMESTAMP |                                   | Last update timestamp                   |
| is_active   | BOOLEAN   | DEFAULT TRUE                      | Team active status                      |
| captain_id  | UUID      | FOREIGN KEY REFERENCES User(id)   | Identifier for the team captain         |
| members     | JSONB     | FOREIGN KEY REFERENCES User(id)[] | List of team member user IDs            |

**Primary Key:** `id`
