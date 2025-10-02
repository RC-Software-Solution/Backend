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

### Enhanced Rules

1. **Same-day orders** (no `target_date` or `target_date` = today):
   - Must be within session time window
   - ❌ **Cannot place orders for past sessions** (e.g., ordering breakfast at 2 PM)
   - ✅ Can place orders for current/future sessions

2. **Future orders** (`target_date` > today):
   - Can be placed during the session time window (supports cross-day sessions)
   - Can be edited/deleted during the session time window
   - ❌ **Cannot place orders for past dates**

3. **Cross-day sessions** (e.g., start_time: 20:00, end_time: 10:00):
   - Session starts at 8 PM today and ends at 10 AM tomorrow
   - Orders can be placed from 8 PM today until 10 AM tomorrow
   - Automatically handles midnight crossover

4. **Past session prevention**:
   - ❌ Cannot order yesterday's breakfast today
   - ❌ Cannot order today's breakfast at 2 PM (if breakfast ended at 10 AM)
   - ✅ Can order tomorrow's breakfast at 8 PM today (if cross-day session is set)

### Frontend Integration

For fetching menu items for future dates:

```javascript
// Fetch breakfast items for tomorrow
const response = await fetch('/api/meal-session-items/by-session?meal_time=breakfast&date=2025-09-26');

// Check if session is currently available for ordering
const response = await fetch('/api/meal-session-items/by-session?meal_time=breakfast&date=2025-09-26&check_availability=true');
```

### Cross-day Session Examples

#### Admin Setup:
```json
{
  "date": "2025-09-26",
  "meal_time": "breakfast", 
  "start_time": "20:00",
  "end_time": "10:00"
}
```

#### Customer Experience:
- **8 PM today (Sept 25)**: Session becomes available, can place orders for tomorrow's breakfast
- **11 PM today**: Still can place orders
- **2 AM tomorrow (Sept 26)**: Still can place orders  
- **9 AM tomorrow**: Still can place orders
- **10:01 AM tomorrow**: Session ends, no more orders allowed

## Time Zone Handling

All time comparisons are done in UTC to ensure consistency across different time zones. The system uses:

- UTC timestamps for all database operations
- Simple date comparisons (no complex time window validations)
- UTC-safe date arithmetic for basic date validation
