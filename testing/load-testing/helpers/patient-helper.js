// Patient data generation helper for Artillery load tests

const faker = require('faker');

module.exports = {
  generateTestData: function(context, events, done) {
    // Generate realistic patient data
    context.vars.firstName = faker.name.firstName();
    context.vars.lastName = faker.name.lastName();
    context.vars.patientEmail = faker.internet.email().toLowerCase();
    context.vars.phone = faker.phone.phoneNumber('+1-###-###-####');
    context.vars.dateOfBirth = faker.date.between('1940-01-01', '2010-12-31').toISOString().split('T')[0];
    context.vars.gender = faker.random.arrayElement(['Male', 'Female', 'Other']);
    
    // Address
    context.vars.street = faker.address.streetAddress();
    context.vars.city = faker.address.city();
    context.vars.state = faker.address.stateAbbr();
    context.vars.zipCode = faker.address.zipCode();
    
    // Medical data
    context.vars.bloodGroup = faker.random.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);
    context.vars.allergies = faker.random.arrayElement([
      'None',
      'Penicillin',
      'Peanuts',
      'Latex',
      'Aspirin',
      'Sulfa drugs'
    ]);
    
    // Emergency contact
    context.vars.emergencyName = faker.name.findName();
    context.vars.relationship = faker.random.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend', 'Child']);
    context.vars.emergencyPhone = faker.phone.phoneNumber('+1-###-###-####');
    
    // Medical history
    context.vars.medicalConditions = faker.random.arrayElement([
      'Hypertension',
      'Diabetes Type 2',
      'Asthma',
      'None',
      'Hypothyroidism'
    ]);
    
    context.vars.currentMedications = faker.random.arrayElement([
      'None',
      'Metformin 500mg',
      'Lisinopril 10mg',
      'Levothyroxine 50mcg',
      'Albuterol inhaler'
    ]);
    
    return done();
  },
  
  generateBulkPatients: function(context, events, done) {
    // Generate multiple patients for bulk operations
    const patients = [];
    for (let i = 0; i < 10; i++) {
      patients.push({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        dateOfBirth: faker.date.between('1940-01-01', '2010-12-31').toISOString().split('T')[0],
        gender: faker.random.arrayElement(['Male', 'Female']),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.phoneNumber('+1-###-###-####'),
        bloodGroup: faker.random.arrayElement(['A+', 'B+', 'O+', 'AB+']),
        address: {
          street: faker.address.streetAddress(),
          city: faker.address.city(),
          state: faker.address.stateAbbr(),
          zipCode: faker.address.zipCode(),
          country: 'USA'
        }
      });
    }
    context.vars.bulkPatients = patients;
    return done();
  },
  
  validatePatientResponse: function(requestParams, response, context, ee, next) {
    // Validate patient API response
    if (response.statusCode === 201 || response.statusCode === 200) {
      if (response.body && response.body.id) {
        context.vars.lastCreatedPatientId = response.body.id;
        console.log(`Patient created/updated: ${response.body.id}`);
      }
    } else {
      console.error(`Patient operation failed: ${response.statusCode}`);
    }
    return next();
  }
};