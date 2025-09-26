# Future Order Configuration

## Simple Approach

This implementation allows customers to place orders for future dates (like tonight for tomorrow's breakfast) without complex pre-order logic. It's treated as a normal order process.

## Database Changes

Run the migration script `database_migration_add_target_date.sql` to add the `target_date` field to the orders table.

## API Changes

### Create Order Request

The create order endpoint now accepts an optional `target_date` field:

```json
{
  "customer_id": "c4d96e10-5f3c-4381-ac92-4b6b76c974f7",
  "meal_time": "breakfast",
  "target_date": "2025-09-26",
  "items": [
    {
      "food_item_id": 4,
      "quantity": 1
    },
    {
      "food_item_id": 1,
      "quantity": 1
    }
  ]
}
```

### Simple Rules

1. **Same-day orders** (no `target_date` or `target_date` = today):
   - Work exactly as before

2. **Future orders** (`target_date` > today):
   - Can be placed anytime (no time window restrictions)
   - Can be edited/deleted anytime (until the target date passes)
   - Only restriction: cannot place orders for past dates

### Frontend Integration

For fetching menu items for future dates:

```javascript
// Fetch breakfast items for tomorrow
const response = await fetch('/api/meal-session-items/by-session?meal_time=breakfast&date=2025-09-26');
```

## Time Zone Handling

All time comparisons are done in UTC to ensure consistency across different time zones. The system uses:

- UTC timestamps for all database operations
- Simple date comparisons (no complex time window validations)
- UTC-safe date arithmetic for basic date validation
