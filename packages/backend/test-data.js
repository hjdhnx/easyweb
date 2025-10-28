import { dbAll } from './src/utils/database.js';

console.log('=== Projects data ===');
const projects = dbAll(`
  SELECT p.id, p.name, 
         COALESCE(p.manager_id, p.user_id) as owner_id, 
         p.user_id, p.manager_id 
  FROM projects p 
  LIMIT 5
`);
console.log(projects);

console.log('\n=== Users data (managers/admins) ===');
const users = dbAll(`
  SELECT id, username, role 
  FROM users 
  WHERE role IN ('manager', 'admin')
`);
console.log(users);

console.log('\n=== All users ===');
const allUsers = dbAll('SELECT id, username, role FROM users');
console.log(allUsers);