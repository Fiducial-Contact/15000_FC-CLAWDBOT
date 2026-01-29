# Tasks schema

Each user has a tasks file:

`memory/users/<provider>/<senderId>.tasks.json`

Recommended schema:

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "A1B2",
      "createdAt": "2026-01-26T10:00:00Z",
      "dueAt": "2026-01-26T12:00:00Z",
      "text": "Export the final cut",
      "status": "scheduled",
      "cronJobId": "<job-id>",
      "delivery": {
        "channel": "msteams",
        "target": "user:<aad-object-id>"
      }
    }
  ]
}
```

Statuses:

- `scheduled`
- `delivered`
- `cancelled`
