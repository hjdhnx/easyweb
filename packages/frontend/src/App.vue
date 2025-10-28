<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 用户状态检查现在由路由守卫处理，避免重复调用
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }
}
</style>