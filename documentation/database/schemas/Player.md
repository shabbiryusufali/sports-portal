# Player Table

| Column Name   | Data Type | Constraints                                  | Description              |
| ------------- | --------- | -------------------------------------------- | ------------------------ |
| id            | UUID      | PRIMARY KEY, FOREIGN KEY REFERENCES User(id) | Unique player identifier |
| first_name    | TEXT      | NOT NULL                                     | Player's first name      |
| last_name     | TEXT      | NOT NULL                                     | Player's last name       |
| date_of_birth | DATE      |                                              | Player's date of birth   |
| gender        | TEXT      |                                              | Player's gender          |

primary Key: `id`
