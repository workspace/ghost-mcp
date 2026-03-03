---
sidebar_position: 7
---

# Offers

Manage subscription offers and discounts. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_offers` | List all offers |
| `admin_create_offer` | Create a new offer |
| `admin_update_offer` | Update an existing offer |

## admin_browse_offers

List all offers.

```json
{}
```

## admin_create_offer

Create a new subscription offer.

```json
{
  "name": "Summer Sale",
  "code": "SUMMER2024",
  "display_title": "Summer Special",
  "display_description": "Get 20% off for the summer",
  "cadence": "month",
  "amount": 20,
  "type": "percent",
  "duration": "repeating",
  "duration_in_months": 3,
  "tier": { "id": "tier-id-here" }
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Internal offer name |
| `code` | string | Promo code |
| `display_title` | string | Public-facing title |
| `display_description` | string | Public-facing description |
| `cadence` | string | `month` or `year` |
| `amount` | number | Discount amount |
| `type` | string | `percent` or `fixed` |
| `duration` | string | `once`, `repeating`, or `forever` |
| `duration_in_months` | number | Duration for repeating offers |
| `tier` | object | Associated tier `{ id }` |

## admin_update_offer

Update an existing offer.

```json
{
  "id": "6abc1234def5678901234567",
  "display_title": "Updated Offer Title",
  "code": "NEWSUMMER"
}
```
