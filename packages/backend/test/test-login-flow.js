// 测试完整的登录和API调用流程
const baseUrl = 'http://localhost:3001';

async function testLoginFlow() {
  console.log('🧪 开始测试完整的登录和API调用流程...\n');

  try {
    // 1. 测试登录并获取cookie
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
    console.log('登录响应数据:', JSON.stringify(loginData, null, 2));
    
    // 获取cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie头:', setCookieHeader);

    if (!loginResponse.ok) {
      console.log('❌ 登录失败');
      return;
    }

    // 解析cookie
    let tokenCookie = '';
    if (setCookieHeader) {
      const cookieMatch = setCookieHeader.match(/token=([^;]+)/);
      if (cookieMatch) {
        tokenCookie = `token=${cookieMatch[1]}`;
        console.log('提取的token cookie:', tokenCookie);
      }
    }

    // 2. 测试带cookie的API请求
    console.log('\n2️⃣ 测试带cookie的项目API请求...');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'GET',
      headers: {
        'Cookie': tokenCookie
      }
    });

    console.log('项目API响应状态:', projectsResponse.status);
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('项目API响应数据:', JSON.stringify(projectsData, null, 2));
      console.log('✅ 完整流程测试成功');
    } else {
      const errorData = await projectsResponse.json();
      console.log('❌ 项目API请求失败');
      console.log('错误响应:', JSON.stringify(errorData, null, 2));
    }

    // 3. 测试不带cookie的API请求（应该返回401）
    console.log('\n3️⃣ 测试不带cookie的API请求（验证401错误）...');
    const unauthorizedResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'GET'
    });

    console.log('无认证API响应状态:', unauthorizedResponse.status);
    if (unauthorizedResponse.status === 401) {
      console.log('✅ 401错误验证正确');
    } else {
      console.log('❌ 预期401错误，但得到:', unauthorizedResponse.status);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testLoginFlow();