/**
 * Simple test script to verify area_id implementation
 * This script tests the userServiceClient and order creation flow
 */

const userServiceClient = require('./src/services/userServiceClient');

async function testUserServiceClient() {
  console.log('Testing UserServiceClient...');
  
  try {
    // Test with a sample user ID (you'll need to replace this with an actual user ID from your database)
    const testUserId = 'c4d96e10-5f3c-4381-ac92-4b6b76c974f7'; // This is the test user ID from the controller
    
    console.log(`Fetching user data for ID: ${testUserId}`);
    const userData = await userServiceClient.getUserById(testUserId);
    
    console.log('User data retrieved:', {
      id: userData.id,
      full_name: userData.full_name,
      area_id: userData.area_id,
      role: userData.role
    });
    
    if (userData.area_id) {
      console.log('✅ Successfully retrieved area_id:', userData.area_id);
    } else {
      console.log('⚠️  area_id is null or undefined for this user');
    }
    
  } catch (error) {
    console.error('❌ Error testing UserServiceClient:', error.message);
  }
}

// Run the test
testUserServiceClient();
