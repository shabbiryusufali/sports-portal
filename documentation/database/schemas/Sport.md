| Column Name    | Data Type | Constraints                 | Description                            |
| -------------- | --------- | --------------------------- | -------------------------------------- |
| id             | STRING    | PRIMARY KEY, DEFAULT cuid() | Unique sport identifier                |
| name           | STRING    | NOT NULL                    | Name of the sport                      |
| description    | STRING    | OPTIONAL                    | Description of the sport               |
| is_team_sport  | BOOLEAN   | DEFAULT FALSE               | Indicates if the sport is a team sport |
| events         | RELATION  |                             | Related events for the sport           |
| teams          | RELATION  |                             | Teams associated with the sport        |
| userStatistics | RELATION  |                             | User statistics for the sport          |
| matches        | RELATION  |                             | Matches played in the sport            |

**Primary Key:** `id`
