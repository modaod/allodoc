// Prescription data generation helper for Artillery load tests

const faker = require('faker');

module.exports = {
  generatePrescriptionData: function(context, events, done) {
    // Generate prescription date
    context.vars.prescriptionDate = new Date().toISOString();
    context.vars.followUpDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    context.vars.newFollowUpDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    
    // Common medications data
    const medications = [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days', route: 'Oral', quantity: '21' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'QID PRN', duration: '5 days', route: 'Oral', quantity: '20' },
      { name: 'Metformin', dosage: '500mg', frequency: 'BID', duration: '30 days', route: 'Oral', quantity: '60' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'OD', duration: '30 days', route: 'Oral', quantity: '30' },
      { name: 'Omeprazole', dosage: '20mg', frequency: 'OD', duration: '14 days', route: 'Oral', quantity: '14' },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'OD', duration: '30 days', route: 'Oral', quantity: '30' },
      { name: 'Albuterol', dosage: '2 puffs', frequency: 'QID PRN', duration: '30 days', route: 'Inhalation', quantity: '1 inhaler' },
      { name: 'Prednisone', dosage: '20mg', frequency: 'OD', duration: '5 days', route: 'Oral', quantity: '5' }
    ];
    
    // Generate 1-3 medications for prescription
    const numMeds = faker.random.number({ min: 1, max: 3 });
    const selectedMeds = faker.random.arrayElements(medications, numMeds);
    
    // First medication
    context.vars.medication1Name = selectedMeds[0].name;
    context.vars.medication1Dosage = selectedMeds[0].dosage;
    context.vars.medication1Frequency = selectedMeds[0].frequency;
    context.vars.medication1Duration = selectedMeds[0].duration;
    context.vars.medication1Route = selectedMeds[0].route;
    context.vars.medication1Quantity = selectedMeds[0].quantity;
    context.vars.medication1Instructions = `Take ${selectedMeds[0].dosage} ${selectedMeds[0].frequency} for ${selectedMeds[0].duration}`;
    
    // Second medication (if exists)
    if (selectedMeds[1]) {
      context.vars.medication2Name = selectedMeds[1].name;
      context.vars.medication2Dosage = selectedMeds[1].dosage;
      context.vars.medication2Frequency = selectedMeds[1].frequency;
      context.vars.medication2Duration = selectedMeds[1].duration;
      context.vars.medication2Route = selectedMeds[1].route;
      context.vars.medication2Quantity = selectedMeds[1].quantity;
      context.vars.medication2Instructions = `Take ${selectedMeds[1].dosage} ${selectedMeds[1].frequency} for ${selectedMeds[1].duration}`;
    } else {
      // Provide default values if no second medication
      context.vars.medication2Name = 'Acetaminophen';
      context.vars.medication2Dosage = '500mg';
      context.vars.medication2Frequency = 'QID PRN';
      context.vars.medication2Duration = 'As needed';
      context.vars.medication2Route = 'Oral';
      context.vars.medication2Quantity = '20';
      context.vars.medication2Instructions = 'Take for pain as needed';
    }
    
    // Diagnosis
    const diagnoses = [
      'Upper respiratory tract infection',
      'Hypertension',
      'Type 2 Diabetes Mellitus',
      'Gastroesophageal reflux disease',
      'Asthma',
      'Hyperlipidemia',
      'Acute bronchitis',
      'Migraine headache'
    ];
    
    context.vars.diagnosis = faker.random.arrayElement(diagnoses);
    
    // Notes
    context.vars.prescriptionNotes = faker.random.arrayElement([
      'Take medications as directed. Follow up if symptoms persist.',
      'Continue current medications. Monitor blood pressure daily.',
      'Avoid alcohol while taking these medications.',
      'Take with food to avoid stomach upset.',
      'Complete full course of antibiotics.'
    ]);
    
    context.vars.pharmacyNotes = faker.random.arrayElement([
      'Generic substitution allowed',
      'Brand name only - no substitution',
      'Patient counseling required',
      'Check for drug interactions',
      ''
    ]);
    
    // Date ranges for searches
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    context.vars.startDate = startDate.toISOString().split('T')[0];
    context.vars.endDate = new Date().toISOString().split('T')[0];
    
    // Generate medications array for complex prescriptions
    context.vars.medications = selectedMeds.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      route: med.route,
      instructions: `Take ${med.dosage} ${med.frequency} for ${med.duration}`,
      quantity: med.quantity
    }));
    
    return done();
  },
  
  validatePrescriptionResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 201 && response.body) {
      context.vars.lastPrescriptionId = response.body.id;
      context.vars.lastPrescriptionNumber = response.body.prescriptionNumber;
      console.log(`Prescription created: ${response.body.prescriptionNumber}`);
    }
    return next();
  }
};