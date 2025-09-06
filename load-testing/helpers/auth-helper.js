// Authentication helper functions for Artillery load tests

module.exports = {
  generateAuthData: function(context, events, done) {
    // Generate random authentication data
    context.vars.randomEmail = `test.user.${Date.now()}@medical.com`;
    context.vars.randomPassword = `Test${Math.random().toString(36).substring(7)}!@#`;
    
    // Generate role variations
    const roles = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'];
    context.vars.randomRole = roles[Math.floor(Math.random() * roles.length)];
    
    return done();
  },
  
  captureToken: function(requestParams, response, context, ee, next) {
    // Capture and store authentication token
    if (response.body && response.body.access_token) {
      context.vars.authToken = response.body.access_token;
      context.vars.refreshToken = response.body.refresh_token;
    }
    return next();
  },
  
  setAuthHeader: function(requestParams, context, ee, next) {
    // Set authorization header for requests
    if (context.vars.authToken) {
      requestParams.headers = requestParams.headers || {};
      requestParams.headers.Authorization = `Bearer ${context.vars.authToken}`;
    }
    return next();
  },
  
  handleTokenExpiry: function(requestParams, response, context, ee, next) {
    // Handle token expiration and refresh
    if (response.statusCode === 401 && context.vars.refreshToken) {
      // Token expired, attempt refresh
      const refreshRequest = {
        url: '/api/v1/auth/refresh',
        json: {
          refresh_token: context.vars.refreshToken
        }
      };
      
      // This is a simplified example - in production, you'd make the actual refresh call
      console.log('Token expired, would refresh here');
    }
    return next();
  }
};