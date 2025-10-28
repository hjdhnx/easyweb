async function testAuth() {
  try {
    // 1. 登录
    console.log('1. 测试登录...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData);

    if (!loginData.success) {
      throw new Error('登录失败: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('Token:', token);

    // 2. 测试认证
    console.log('2. 测试认证...');
    const authResponse = await fetch('http://localhost:3001/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('认证响应状态:', authResponse.status);
    const authData = await authResponse.json();
    console.log('认证响应:', authData);

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testAuth();