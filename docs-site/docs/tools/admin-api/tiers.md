---
sidebar_position: 5
---

# Tiers

Manage membership tiers and pricing. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_tiers` | List all tiers |
| `admin_read_tier` | Get a single tier by ID |
| `admin_create_tier` | Create a new tier |
| `admin_update_tier` | Update an existing tier |

## admin_browse_tiers

List all membership tiers.

```json
{
  "limit": "all"
}
```

## admin_read_tier

Get a single tier by ID.

```json
{
  "id": "6abc1234def5678901234567"
}
```

## admin_create_tier

Create a new membership tier.

```json
{
  "name": "Premium",
  "description": "Full access to all content",
  "monthly_price": 500,
  "yearly_price": 5000,
  "currency": "usd"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Tier name |
| `description` | string | Tier description |
| `monthly_price` | number | Monthly price in cents |
| `yearly_price` | number | Yearly price in cents |
| `currency` | string | Currency code (e.g., `usd`) |
| `welcome_page_url` | string | URL shown after signup |
| `visibility` | string | `public` or `none` |

## admin_update_tier

Update an existing tier.

```json
{
  "id": "6abc1234def5678901234567",
  "name": "Premium Plus",
  "monthly_price": 800
}
```
