// 使用Node.js内置的fetch (Node.js 18+)

const baseUrl = 'http://localhost:3001';

async function testJWTAuth() {
  console.log('🧪 开始测试JWT认证流程...\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', loginData);
    
    // 获取cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('设置的Cookie:', cookies);

    if (!loginResponse.ok) {
      console.log('❌ 登录失败');
      return;
    }

    // 2. 测试带cookie的API请求
    console.log('\n2️⃣ 测试带cookie的API请求...');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const projectsData = await projectsResponse.json();
    console.log('项目API响应状态:', projectsResponse.status);
    console.log('项目API响应数据:', projectsData);

    if (projectsResponse.ok) {
      console.log('✅ JWT认证测试成功');
    } else {
      console.log('❌ JWT认证测试失败');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testJWTAuth();