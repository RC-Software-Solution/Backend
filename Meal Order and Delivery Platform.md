# Meal Order and Delivery Platform

## User Stories Document

## Roles: -

- a. Customer

- b. Delivery Person

- c. Super Admin

- d. Admin

## 1. Customer User Stories

## User Signup

- As a customer, I want to sign up for the system by entering my first name, last name, national ID card number, email, and phone number so that I can create an account.

- As a customer, I want to choose my location during signup by selecting one of three options: hostel, boarding place, or other, so that my delivery location is accurately recorded.

- As a customer living in a hostel, I want to choose my hostel from a predefined list and enter my room number so that my location details are precise.

- As a customer living in a boarding place, I want to select my boarding place from a predefined list and choose the nearest hostel from a list so that my delivery location is accurately captured.

- As a customer living in a location other than the provided lists, I want to choose the "Other" option and enter a description of where I live so that my location can be manually specified.

- As a customer, I want to wait for super admin approval before I can sign in so that the system ensures my information is verified.

## User Login

- As a customer, I want to sign in to the system using my email and password so that I can access the app.

## Browse and Order Meals

- As a customer, I want to browse meals under the breakfast, lunch, and dinner tabs, with veg and non-veg options, so that I can choose what to order.

- As a customer, I want to see a countdown timer for each meal tab, indicating how much time remains to order food, so that I know when to place my order.

- As a customer, I want to see a countdown of the available quantity for each meal option so that I know how many parcels are left to order.

- As a customer, I want to view meal details such as images, prices, and ingredient descriptions under veg and non-veg categories so that I can make informed choices.


- As a customer, I want to add chosen meals to my basket so that I can prepare my order.

- As a customer, I want to view, increase, decrease, or remove items from my basket so that I can modify my order before confirming.

- As a customer, I want to see a summary of the total quantity and price in my basket so that I can review my order before confirming.

- As a customer, I want to confirm my order from the basket so that it is placed and ready for delivery.

## Manage Orders

- As a customer, I want to view, edit, or cancel my confirmed orders in the "My Orders" section until the food ordering time period ends so that I can manage my orders as needed.

- As a customer, I want to be notified if I try to edit or cancel an order after the ordering time has ended so that I know that such changes are not allowed.

- View the order count remaining ( when there is left only 30 or 40 orders )

## Profile and Purchase History

- As a customer, I want to view my profile details so that I can see the information I provided during signup.

- As a customer, I want to view my purchase history for the last seven days so that I can keep track of my orders.

- As a customer, I want to see a list of my unpaid orders with details like order price, date, and food item names so that I am aware of pending payments.

- As a customer, I want to be restricted from placing new orders if I have more than two unpaid orders so that I am encouraged to pay for previous orders.

- As a customer, I want to receive a notification about unpaid orders when trying to confirm a new order so that I know why I cannot proceed with the new order.

## Notifications

- Receive notifications about delivery status as a whole.

- Receive notifications about important notices.

## 2. Delivery Person User Stories

## User Login

- As a delivery person, I want to sign in using my email and password so that I can access the system.

## Manage Orders

- As a delivery person, I want to view all orders in the system so that I can see what needs to be delivered.


- As a delivery person, I want to choose a specific hostel area from a provided list so that I can see orders specific to that area.

- As a delivery person, I want to see order details like food items, parcel quantities, total prices, and locations so that I know what and where to deliver.

- As a delivery person, I want to search for orders by order-code or user-code so that I can quickly find specific orders.

- As a delivery person, I want to mark orders as "Delivered" after delivery so that my delivery stats are updated.

- As a delivery person, I want to see updated counts of total parcels, orders, and collected money after marking an order as delivered so that I can track my work progress.

- As a delivery person, I want to click on an "Unpaid" option without selecting "Delivered" if a customer receives food without paying so that the order is added to the unpaid list.

## Manage Unpaid Orders

- As a delivery person, I want to view a list of unpaid orders so that I know which customers owe money.

- As a delivery person, I want to search unpaid orders by hotel/boarding place names, order-code, or user-code so that I can find specific orders easily.

- As a delivery person, I want to mark unpaid orders as "Paid" after receiving payment so that the system reflects the updated status.

- As a delivery person, I want my daily unpaid order list to be updated with order numbers and money amounts so that I can keep track of collected payments.

## Delivery Statistics

- As a delivery person, I want to see the detail counts of yet-to-be-delivered parcels and orders so that I can monitor my tasks.

- As a delivery person, I want the count of yet-to-be-delivered orders to decrease when delivering food and the count of delivered orders to increase so that the system reflects real-time updates.

## 3.Admin User Stories

## Manage Meals

- As an admin, I want to upload photos of meals, add descriptions, and set prices so that I can keep the meal options up-to-date.

- As an admin, I want to set the starting and ending time for ordering meals so that customers know the time limits for placing orders.

- As an admin, I want to set the order count for each meal so that customers know how many parcels are available for ordering.

- Add notifications about important notices


- Publish posts on newsletter section.

## 4. Super Admin User Stories

## User Signup Approval

- As a super admin, I want to review and approve customer signup details so that only verified customers can access the system, and able to add the hostel for each user.

- Able to edit user details such as location

## Manage Locations

- As a super admin, I want to enter, remove, or update the boarding place and hostel lists so that the location options for customers are accurate and up-to-date.

## Manage Meals

- As a super admin, I want to upload photos of meals, add descriptions, and set prices so that I can ensure the meal offerings are current.

- As a super admin, I want to set the starting and ending time for ordering meals so that I can control the time frame within which customers can place orders.

- As a super admin, I want to set the order count for each meal so that I can control the availability of meal parcels.

## View Analytics

- As a super admin, I want to view analytical lists, charts, and graphs based on daily/monthly income so that I can monitor the financial performance of the system.
