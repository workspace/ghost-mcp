---
sidebar_position: 5
---

# NQL Filter Reference

Ghost uses **NQL (Notion Query Language)** for filtering resources. The `filter` parameter on browse tools accepts NQL expressions.

## Syntax

### Basic Filters

```
field:value
```

### Operators

| Operator | Syntax | Example |
|----------|--------|---------|
| Equals | `field:value` | `status:published` |
| Not equals | `field:-value` | `status:-draft` |
| Greater than | `field:>'value'` | `published_at:>'2024-01-01'` |
| Less than | `field:<'value'` | `published_at:<'2024-06-01'` |
| Greater or equal | `field:>='value'` | `created_at:>='2024-01-01'` |
| Less or equal | `field:<='value'` | `created_at:<='2024-12-31'` |

### Combining Filters

| Combinator | Syntax | Description |
|------------|--------|-------------|
| AND | `+` | Both conditions must match |
| OR | `,` | Either condition must match |

```
tag:news+featured:true       # Posts tagged "news" AND featured
status:draft,status:scheduled # Posts that are draft OR scheduled
```

### Grouping

Use parentheses to group complex expressions:

```
(tag:news+featured:true),(tag:tutorials+featured:true)
```

## Post Filters

| Filter | Description |
|--------|-------------|
| `status:draft` | Draft posts only |
| `status:published` | Published posts only |
| `status:scheduled` | Scheduled posts only |
| `featured:true` | Featured posts |
| `tag:news` | Posts with "news" tag (by slug) |
| `author:john` | Posts by author "john" (by slug) |
| `published_at:>'2024-01-01'` | Posts published after date |
| `tag:news+featured:true` | Combine filters (AND) |
| `status:draft,status:scheduled` | Multiple values (OR) |
| `visibility:public` | Publicly visible posts |
| `visibility:paid` | Members-only posts |

## Member Filters

| Filter | Description |
|--------|-------------|
| `status:free` | Free members |
| `status:paid` | Paid members |
| `status:comped` | Complimentary members |
| `subscribed:true` | Subscribed to newsletters |
| `label:vip` | Members with "vip" label |
| `created_at:>'2024-01-01'` | Members joined after date |

## Tag Filters

| Filter | Description |
|--------|-------------|
| `visibility:public` | Public tags |
| `visibility:internal` | Internal tags (# prefix) |

## Examples

### Complex post query

Get featured tutorials published in 2024:

```
tag:tutorials+featured:true+published_at:>'2024-01-01'+published_at:<'2025-01-01'
```

### Member segmentation

Get paid members who joined recently and are subscribed:

```
status:paid+created_at:>'2024-06-01'+subscribed:true
```

### Draft content audit

Get all draft and scheduled posts by a specific author:

```
(status:draft,status:scheduled)+author:john
```
