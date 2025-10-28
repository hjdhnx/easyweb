import fs from 'fs';

async function testUpload() {
  try {
    // 1. 首先登录获取token
    console.log('1. 登录获取token...');
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
    if (!loginData.success) {
      throw new Error('登录失败: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('登录成功，获取到token');

    // 2. 创建测试项目
    console.log('2. 创建测试项目...');
    const projectResponse = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'test-project',
        description: '测试项目'
      })
    });

    const projectData = await projectResponse.json();
    console.log('项目创建响应:', projectData);
    if (!projectData.success) {
      throw new Error('创建项目失败: ' + projectData.message);
    }
    
    const projectId = projectData.data.id;
    console.log('项目创建成功，ID:', projectId);

    // 3. 上传ZIP文件
    console.log('3. 上传ZIP文件...');
    const fileBuffer = fs.readFileSync('test-website.zip');
    const form = new FormData();
    form.append('file', new Blob([fileBuffer]), 'test-website.zip');
    form.append('projectId', projectId.toString());
    form.append('versionName', 'v1.0.0');

    const uploadResponse = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    const uploadData = await uploadResponse.json();
    console.log('上传响应:', uploadData);
    if (!uploadData.success) {
      throw new Error('上传失败: ' + uploadData.message);
    }

    console.log('上传成功！');
    console.log('版本ID:', uploadData.data?.versionId);
    console.log('静态URL:', uploadData.data?.staticUrl);

    // 4. 测试静态文件访问
    console.log('4. 测试静态文件访问...');
    const staticUrl = `http://localhost:3001/static/test-project/v1.0.0/test-upload.html`;
    const staticResponse = await fetch(staticUrl);
    
    if (staticResponse.ok) {
      const content = await staticResponse.text();
      console.log('静态文件访问成功！');
      console.log('文件内容预览:', content.substring(0, 100) + '...');
    } else {
      console.log('静态文件访问失败，状态码:', staticResponse.status);
    }

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testUpload();