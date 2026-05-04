// Quick test script
const fetch = require('node-fetch');

async function test() {
  const body = JSON.stringify({
    name: "Integration Test",
    email: "integration@test.com",
    mobile: "+1234567890",
    password: "password123"
  });

  try {
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
