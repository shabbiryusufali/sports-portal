
| Column Name   | Data Type | Constraints                                  | Description                       |
| ------------- | --------- | -------------------------------------------- | --------------------------------- |
| id            | String    | PRIMARY KEY, FOREIGN KEY REFERENCES User(id) | Unique player identifier          |
| first_name    | TEXT      | NOT NULL                                     | Player's first name               |
| last_name     | TEXT      | NOT NULL                                     | Player's last name                |
| date_of_birth | DATE      | NOT NULL                                     | Player's date of birth            |
| gender        | TEXT      | NOT NULL                                     | Player's gender                   |
| events        | ARRAY     | RELATION TO Event                            | Events the player participates in |
| teams         | ARRAY     | RELATION TO Team                             | Teams the player is a member of   |
| captainOf     | ARRAY     | RELATION TO Team (as captain)                | Teams where the player is captain |

Primary Key: `id`
