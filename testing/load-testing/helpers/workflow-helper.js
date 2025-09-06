// Full workflow data generation helper for Artillery load tests

const faker = require('faker');

module.exports = {
  generateFullWorkflowData: function(context, events, done) {
    // Patient data
    context.vars.patientFirstName = faker.name.firstName();
    context.vars.patientLastName = faker.name.lastName();
    context.vars.patientDOB = faker.date.between('1940-01-01', '2010-12-31').toISOString().split('T')[0];
    context.vars.patientGender = faker.random.arrayElement(['Male', 'Female']);
    context.vars.patientEmail = faker.internet.email().toLowerCase();
    context.vars.patientPhone = faker.phone.phoneNumber('+1-###-###-####');
    context.vars.patientStreet = faker.address.streetAddress();
    context.vars.patientCity = faker.address.city();
    context.vars.patientState = faker.address.stateAbbr();
    context.vars.patientZip = faker.address.zipCode();
    context.vars.bloodGroup = faker.random.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);
    context.vars.allergies = faker.random.arrayElement(['None', 'Penicillin', 'Peanuts', 'Latex']);
    
    // Emergency contact
    context.vars.emergencyName = faker.name.findName();
    context.vars.emergencyPhone = faker.phone.phoneNumber('+1-###-###-####');
    
    // Appointment data
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + faker.random.number({ min: 1, max: 7 }));
    context.vars.appointmentDate = appointmentDate.toISOString().split('T')[0];
    context.vars.appointmentTime = faker.random.arrayElement(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
    context.vars.appointmentReason = faker.random.arrayElement([
      'Annual check-up',
      'Follow-up visit',
      'New patient consultation',
      'Acute symptoms',
      'Medication review'
    ]);
    
    // Consultation data
    context.vars.consultationDate = new Date().toISOString();
    context.vars.chiefComplaint = faker.random.arrayElement([
      'Routine health check',
      'Persistent cough',
      'Headaches',
      'Fatigue',
      'Joint pain'
    ]);
    context.vars.presentIllness = `Patient presents with ${context.vars.chiefComplaint}. Symptoms have been present for ${faker.random.number({ min: 1, max: 14 })} days.`;
    context.vars.medicalHistory = faker.random.arrayElement([
      'No significant past medical history',
      'Hypertension - controlled',
      'Type 2 Diabetes',
      'Asthma'
    ]);
    
    // Vital signs
    context.vars.vitalBP = `${faker.random.number({ min: 110, max: 140 })}/${faker.random.number({ min: 70, max: 90 })}`;
    context.vars.vitalHR = faker.random.number({ min: 60, max: 100 });
    context.vars.vitalTemp = (98 + Math.random() * 2).toFixed(1);
    context.vars.vitalRR = faker.random.number({ min: 12, max: 20 });
    context.vars.vitalWeight = faker.random.number({ min: 50, max: 120 });
    context.vars.vitalHeight = faker.random.number({ min: 150, max: 190 });
    context.vars.vitalBMI = (context.vars.vitalWeight / Math.pow(context.vars.vitalHeight / 100, 2)).toFixed(1);
    context.vars.vitalO2 = faker.random.number({ min: 95, max: 100 });
    
    // Physical examination
    context.vars.examCardio = 'Regular rate and rhythm, no murmurs';
    context.vars.examResp = 'Clear to auscultation bilaterally';
    context.vars.examAbdomen = 'Soft, non-tender, no masses';
    
    // Diagnosis and treatment
    const diagnoses = [
      { diagnosis: 'Upper respiratory infection', icd: 'J06.9' },
      { diagnosis: 'Essential hypertension', icd: 'I10' },
      { diagnosis: 'Type 2 diabetes mellitus', icd: 'E11.9' },
      { diagnosis: 'Acute bronchitis', icd: 'J20.9' },
      { diagnosis: 'Migraine', icd: 'G43.909' }
    ];
    const selectedDiagnosis = faker.random.arrayElement(diagnoses);
    context.vars.primaryDiagnosis = selectedDiagnosis.diagnosis;
    context.vars.icdCode = selectedDiagnosis.icd;
    
    context.vars.treatmentPlan = `1. Prescribed medications as indicated\n2. Patient education provided\n3. Follow-up in 2 weeks\n4. Call if symptoms worsen`;
    context.vars.investigations = faker.random.arrayElement([
      'CBC, Basic metabolic panel',
      'No labs needed at this time',
      'Chest X-ray',
      'HbA1c, Lipid panel'
    ]);
    
    // Follow-up
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 14);
    context.vars.followUpDate = followUp.toISOString().split('T')[0];
    
    // Prescription data
    context.vars.prescriptionDate = new Date().toISOString();
    context.vars.medications = [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'TID',
        duration: '7 days',
        route: 'Oral',
        instructions: 'Take with water',
        quantity: '21'
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'TID PRN',
        duration: 'As needed',
        route: 'Oral',
        instructions: 'Take with food for pain',
        quantity: '30'
      }
    ];
    
    context.vars.prescriptionNotes = 'Take all medications as prescribed. Follow up if symptoms persist.';
    context.vars.pharmacyNotes = 'Generic substitution allowed';
    
    return done();
  },
  
  logWorkflowProgress: function(requestParams, response, context, ee, next) {
    // Log progress through the workflow
    const step = requestParams.url;
    console.log(`Workflow step: ${step} - Status: ${response.statusCode}`);
    
    if (response.statusCode >= 400) {
      console.error(`Workflow failed at ${step}: ${response.statusCode} - ${response.body}`);
    }
    
    return next();
  },
  
  captureWorkflowMetrics: function(requestParams, response, context, ee, next) {
    // Capture custom metrics for workflow
    const responseTime = response.timings.phases.firstByte;
    
    if (responseTime > 1000) {
      console.warn(`Slow response at ${requestParams.url}: ${responseTime}ms`);
    }
    
    return next();
  }
};