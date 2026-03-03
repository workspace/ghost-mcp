---
sidebar_position: 4
---

# Members

Manage site members and subscribers. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_members` | List members with filtering and pagination |
| `admin_read_member` | Get a single member by ID |
| `admin_create_member` | Create a new member |
| `admin_update_member` | Update an existing member |

## admin_browse_members

List members with filtering and pagination.

```json
{
  "filter": "status:paid",
  "include": "labels,newsletters",
  "order": "created_at DESC"
}
```

### Common filters

| Filter | Description |
|--------|-------------|
| `status:free` | Free members |
| `status:paid` | Paid members |
| `status:comped` | Complimentary members |
| `subscribed:true` | Subscribed to newsletters |
| `label:vip` | Members with a specific label |

See the [NQL Reference](../../nql-reference.md) for more filter options.

## admin_read_member

Get a single member by ID.

```json
{
  "id": "6abc1234def5678901234567"
}
```

## admin_create_member

Create a new member.

### Basic member

```json
{
  "email": "newmember@example.com"
}
```

### Member with full details

```json
{
  "email": "vip@example.com",
  "name": "John Smith",
  "note": "VIP customer - premium support",
  "subscribed": true,
  "labels": [{ "name": "VIP" }, { "name": "Early Adopter" }],
  "comped": true
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | Member email (required) |
| `name` | string | Member name |
| `note` | string | Internal note |
| `subscribed` | boolean | Newsletter subscription status |
| `labels` | array | Member labels |
| `comped` | boolean | Grant complimentary access |

## admin_update_member

Update an existing member.

```json
{
  "id": "6abc1234def5678901234567",
  "name": "Updated Name",
  "note": "Updated note",
  "labels": [{ "name": "VIP" }]
}
```
