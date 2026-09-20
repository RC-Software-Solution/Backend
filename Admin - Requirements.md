A. Authentication and Account
Login:
Inputs: email, password.
Validate credentials; show errors with reasons.
Forgot Password:
Send reset link to email; throttle requests; show success/error message.
B. Dashboard
Sales totals (daily/weekly/monthly)
Orders volume and delivery success rate.
Blocked users count.
Unpaid orders count.
Analytics:
Top-selling items.
Session performance (Breakfast/Lunch/Dinner tabs).
Area metrics (orders, revenue).
Filters:
Date range, area, session type.
C. Customer User Management
Registration workflow:
Incoming requests with name, email, address.
Only Super Admin can Accept/Reject.
Accept: user becomes Active, must assign user to a Delivery Area in confirmation modal.
Reject: capture rejection reason, store in Rejected list.
Lists (tabs):
Pending, Accepted (Active), Rejected, Disabled, Blocked.
Blocked users:
Automatically blocked when user has 2 or more unpaid orders.
Super Admin can Unlock
.
Deactivated:
Super Admin can disable any active customer,
disabled users listed separately.
Actions:
View profile (includes order history, unpaid summary, status log).

---

Assign/Change delivery area.
Disable/Enable.
Unlock (if blocked).
Search/filter/export by name/email/area/status/date.
D. Admin Management
Super Admin can:
Add Admins (name, email, role Admin/Super Admin).
Disable/Enable Admins.
Edit Admin details (name, role).
Lists:
Active admins, disabled admins with metadata (created date, status).
Optional:
Invite flow (send email verification).
Password reset for admins by Super Admin.
E. Delivery Areas
CRUD for Areas:
Fields: Name (required), Code (optional), Status (Active/Inactive),
schedule notes, optional geo-boundary.
Assignment:
Assign customers to areas.
Lists/Detail:
Show metrics: orders, revenue, assigned users count.
Actions:
Add, Edit, Remove (confirm with dependency warnings if users assigned).
F. Meal Sessions
Session creation and management:
Fields: Date, Start time, End time, Type (Breakfast/Lunch/Dinner),
Create, Edit, Cancel.
Assign menu to session:
Choose items from Food Items catalog; search/filter
Session detail:
Tabs: Items, Orders, Delivery (assign delivery persons), Notes.
Constraints:
Editing completed/cancelled sessions limited (configurable).
Prevent duplicate overlapping sessions for same Type within same time window
(configurable).
G. Food Items (Catalog)

---

CRUD:
Fields: Name (required), Description, Price, Picture (upload with preview), Category, Dietary
tags (vegan/non)
Item detail:
Show image, description, price history, sessions availability.
Lists:
Grid or table with image thumbnail, name, price, category, status.
Actions:
Add, Edit, Remove (confirm); Activate/Deactivate; filter/search/export.
H. Orders and Payments
Orders list:
Filters: Date range, Status
(Pending/Confirmed/Prepared/Out-for-delivery/Delivered/Cancelled), Area, Session,
Customer, Delivery person.
Columns: Order ID, Customer, Items count, Total, Status, Payment status (Paid/Unpaid),
Delivery person, Created date.
Order detail:
Summary: ID, date, totals.
Items list with quantities and prices.
Customer card (link to profile).
Delivery card (assigned courier, ETA).
Payment card: gateway reference, status, history.
Audit timeline.
Actions:
Update order status
Mark payment as verified (if allowed).
Refunds/adjustments (optional, with permissions).
Unpaid orders:
Quick filter; bulk actions (notify); rules feed into user blocking logic.
I. Delivery Persons
CRUD:
Fields: Name, Email; optional Phone, Vehicle type; Status (Active/Inactive),NIC
Assignment:
Lists:
Name, contact, status, assigned areas, performance metrics (on-time rate).
Detail:
Actions:
Add, Edit, Enable/Disable, Remove.

---

K. Reports(This is not sure)
Report types:
Sales, Profit, Orders, Item performance, Area performance, Customer activity, Deposits
reconciliation.
Features:
Filters: date range, area, session.