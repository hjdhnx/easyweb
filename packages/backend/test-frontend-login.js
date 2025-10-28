// 测试前端登录流程
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5173/api',
  timeout: 10000,
  withCredentials: true
});

async function testFrontendLogin() {
  try {
    console.log('=== 测试前端登录流程 ===');
    
    // 1. 测试登录
    console.log('\n1. 测试登录...');
    const loginResponse = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('登录响应:', loginResponse.data);
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      
      // 2. 测试获取用户信息
      console.log('\n2. 测试获取用户信息...');
      const profileResponse = await api.get('/auth/profile');
      console.log('用户信息响应:', profileResponse.data);
      
      if (profileResponse.data.success) {
        console.log('✅ 获取用户信息成功');
        console.log('用户信息:', profileResponse.data.data);
      } else {
        console.log('❌ 获取用户信息失败');
      }
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testFrontendLogin();