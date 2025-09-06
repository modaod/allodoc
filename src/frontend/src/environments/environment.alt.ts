// Alternative environment configuration for network issues
export const environment = {
  production: false,
  // Try these alternatives if the proxy doesn't work:
  // Option 1: Direct localhost (default)
  apiUrl: 'http://localhost:3000/api/v1',
  
  // Option 2: If using WSL from Windows, replace with your WSL IP
  // apiUrl: 'http://172.x.x.x:3000/api/v1',
  
  // Option 3: If using Docker Desktop
  // apiUrl: 'http://host.docker.internal:3000/api/v1',
  
  // Option 4: If accessing from different machine
  // apiUrl: 'http://YOUR_SERVER_IP:3000/api/v1'
};