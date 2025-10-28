// 使用内置的 fetch

const baseUrl = 'http://localhost:3001';

async function testCookieFlow() {
  console.log('🧪 开始测试 Cookie 流程...\n');

  try {
    // 1. 登录并获取 Set-Cookie 头
    console.log('1️⃣ 发送登录请求...');
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

    console.log('📊 登录响应状态:', loginResponse.status);
    console.log('🍪 Set-Cookie 头:', loginResponse.headers.get('set-cookie'));
    
    const loginData = await loginResponse.json();
    console.log('📋 登录响应数据:', JSON.stringify(loginData, null, 2));

    // 2. 提取 cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      console.log('❌ 没有收到 Set-Cookie 头!');
      return;
    }

    // 解析 token cookie
    const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
    if (!tokenMatch) {
      console.log('❌ Set-Cookie 头中没有找到 token!');
      console.log('🔍 完整的 Set-Cookie:', setCookieHeader);
      return;
    }

    const token = tokenMatch[1];
    console.log('✅ 提取到的 token:', token.substring(0, 50) + '...');

    // 3. 使用 cookie 请求受保护的 API
    console.log('\n2️⃣ 使用 cookie 请求 /api/projects...');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      }
    });

    console.log('📊 项目请求响应状态:', projectsResponse.status);
    
    if (projectsResponse.status === 200) {
      const projectsData = await projectsResponse.json();
      console.log('✅ 成功获取项目数据:', JSON.stringify(projectsData, null, 2));
    } else {
      const errorData = await projectsResponse.text();
      console.log('❌ 项目请求失败:', errorData);
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

testCookieFlow();