// Stress test data generation helper for Artillery load tests

module.exports = {
  generateStressTestData: function(context, events, done) {
    // Generate random data for stress testing
    context.vars.$randomString = function(length) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    context.vars.$randomNumber = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    context.vars.$randomChoice = function(choices) {
      return choices[Math.floor(Math.random() * choices.length)];
    };
    
    context.vars.$randomEmail = function() {
      return `stress_test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
    };
    
    context.vars.$randomPhone = function() {
      return `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    };
    
    context.vars.$randomDate = function(start, end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
      return new Date(randomTime).toISOString().split('T')[0];
    };
    
    // Generate bulk data for stress testing
    context.vars.bulkData = [];
    for (let i = 0; i < 100; i++) {
      context.vars.bulkData.push({
        id: i,
        value: Math.random().toString(36).substring(7)
      });
    }
    
    return done();
  },
  
  monitorStressMetrics: function(requestParams, response, context, ee, next) {
    // Monitor stress test metrics
    const metrics = {
      endpoint: requestParams.url,
      statusCode: response.statusCode,
      responseTime: response.timings.phases.total,
      responseSize: response.body ? JSON.stringify(response.body).length : 0
    };
    
    // Log slow responses
    if (metrics.responseTime > 2000) {
      console.error(`SLOW RESPONSE: ${metrics.endpoint} took ${metrics.responseTime}ms`);
    }
    
    // Log errors
    if (metrics.statusCode >= 500) {
      console.error(`SERVER ERROR: ${metrics.endpoint} returned ${metrics.statusCode}`);
    } else if (metrics.statusCode >= 400) {
      console.warn(`CLIENT ERROR: ${metrics.endpoint} returned ${metrics.statusCode}`);
    }
    
    // Track memory usage
    if (global.gc) {
      global.gc();
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn(`HIGH MEMORY USAGE: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
    }
    
    return next();
  },
  
  handleStressErrors: function(requestParams, response, context, ee, next) {
    // Handle errors during stress testing
    if (response.statusCode === 429) {
      console.warn('RATE LIMITED: Server returned 429 Too Many Requests');
      // Could implement backoff strategy here
    } else if (response.statusCode === 503) {
      console.error('SERVICE UNAVAILABLE: Server under heavy load');
    } else if (response.statusCode >= 500) {
      console.error(`SERVER ERROR ${response.statusCode}: Potential stability issue under load`);
    }
    
    return next();
  }
};