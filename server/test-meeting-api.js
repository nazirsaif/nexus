// Test script for Meeting API endpoints
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testMeetingId = '';

// Test user credentials
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  userType: 'entrepreneur'
};

// Helper function for API requests with authentication
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      headers: {}
    };
    
    if (authToken) {
      config.headers['x-auth-token'] = authToken;
    }
    
    let response;
    
    if (method === 'get') {
      response = await axios.get(`${API_URL}${endpoint}`, config);
    } else if (method === 'post') {
      response = await axios.post(`${API_URL}${endpoint}`, data, config);
    } else if (method === 'put') {
      response = await axios.put(`${API_URL}${endpoint}`, data, config);
    } else if (method === 'patch') {
      response = await axios.patch(`${API_URL}${endpoint}`, data, config);
    } else if (method === 'delete') {
      response = await axios.delete(`${API_URL}${endpoint}`, config);
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : null
    };
  }
};

// Test functions
async function register() {
  console.log('\n--- Testing Registration ---');
  const result = await apiRequest('post', '/auth/signup', testUser);
  
  if (result.success) {
    console.log('✅ Registration successful');
    return true;
  } else {
    // If user already exists, that's fine
    if (result.status === 400 && result.error.message.includes('already exists')) {
      console.log('⚠️ User already exists, proceeding with login');
      return true;
    }
    console.log('❌ Registration failed:', result.error);
    return false;
  }
}

async function login() {
  console.log('\n--- Testing Login ---');
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await apiRequest('post', '/auth/login', loginData);
  
  if (result.success) {
    console.log('✅ Login successful');
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function createMeeting() {
  console.log('\n--- Testing Create Meeting ---');
  
  // Get current user ID
  const userResult = await apiRequest('get', '/auth/me');
  if (!userResult.success) {
    console.log('❌ Failed to get current user:', userResult.error);
    return false;
  }
  
  console.log('Current user:', userResult.data);
  const userId = userResult.data._id; // MongoDB uses _id, not id
  
  // Create a meeting
  const meetingData = {
    title: 'Test Meeting',
    description: 'This is a test meeting',
    participants: [
      { userId: userId, userType: testUser.userType }
    ],
    startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    endTime: new Date(Date.now() + 7200000).toISOString(),  // 2 hours from now
    location: 'Virtual',
    meetingLink: 'https://meet.example.com/test',
    notes: 'Test meeting notes'
  };
  
  console.log('Creating meeting with data:', JSON.stringify(meetingData, null, 2));
  
  const result = await apiRequest('post', '/meetings', meetingData);
  
  if (result.success) {
    console.log('✅ Meeting created successfully');
    testMeetingId = result.data._id;
    console.log(`   Meeting ID: ${testMeetingId}`);
    return true;
  } else {
    console.log('❌ Failed to create meeting:', result.error);
    return false;
  }
}

async function getMeetings() {
  console.log('\n--- Testing Get Meetings ---');
  const result = await apiRequest('get', '/meetings');
  
  if (result.success) {
    console.log(`✅ Retrieved ${result.data.length} meetings`);
    return true;
  } else {
    console.log('❌ Failed to get meetings:', result.error);
    return false;
  }
}

async function getMeetingById() {
  console.log('\n--- Testing Get Meeting By ID ---');
  if (!testMeetingId) {
    console.log('❌ No meeting ID available for testing');
    return false;
  }
  
  const result = await apiRequest('get', `/meetings/${testMeetingId}`);
  
  if (result.success) {
    console.log('✅ Retrieved meeting by ID');
    console.log(`   Title: ${result.data.title}`);
    return true;
  } else {
    console.log('❌ Failed to get meeting by ID:', result.error);
    return false;
  }
}

async function updateMeeting() {
  console.log('\n--- Testing Update Meeting ---');
  if (!testMeetingId) {
    console.log('❌ No meeting ID available for testing');
    return false;
  }
  
  const updateData = {
    title: 'Updated Test Meeting',
    description: 'This meeting has been updated'
  };
  
  const result = await apiRequest('put', `/meetings/${testMeetingId}`, updateData);
  
  if (result.success) {
    console.log('✅ Meeting updated successfully');
    console.log(`   New title: ${result.data.title}`);
    return true;
  } else {
    console.log('❌ Failed to update meeting:', result.error);
    return false;
  }
}

async function updateMeetingStatus() {
  console.log('\n--- Testing Update Meeting Status ---');
  if (!testMeetingId) {
    console.log('❌ No meeting ID available for testing');
    return false;
  }
  
  const statusData = {
    status: 'accepted'
  };
  
  const result = await apiRequest('patch', `/meetings/${testMeetingId}/status`, statusData);
  
  if (result.success) {
    console.log('✅ Meeting status updated successfully');
    console.log(`   New status: ${result.data.status}`);
    return true;
  } else {
    console.log('❌ Failed to update meeting status:', result.error);
    return false;
  }
}

async function deleteMeeting() {
  console.log('\n--- Testing Delete Meeting ---');
  if (!testMeetingId) {
    console.log('❌ No meeting ID available for testing');
    return false;
  }
  
  const result = await apiRequest('delete', `/meetings/${testMeetingId}`);
  
  if (result.success) {
    console.log('✅ Meeting deleted successfully');
    return true;
  } else {
    console.log('❌ Failed to delete meeting:', result.error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== MEETING API TESTS ===');
  
  // Register and login first
  const registered = await register();
  if (!registered) {
    console.log('\n❌ Tests aborted: Registration failed');
    return;
  }
  
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Tests aborted: Login failed');
    return;
  }
  
  // Run the tests in sequence
  await createMeeting();
  await getMeetings();
  await getMeetingById();
  await updateMeeting();
  await updateMeetingStatus();
  await deleteMeeting();
  
  console.log('\n=== TESTS COMPLETED ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});