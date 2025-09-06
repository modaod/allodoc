// Consultation data generation helper for Artillery load tests

const faker = require('faker');

module.exports = {
  generateConsultationData: function(context, events, done) {
    // Generate consultation dates
    const consultDate = new Date();
    context.vars.consultationDate = consultDate.toISOString();
    context.vars.followUpDate = new Date(consultDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    context.vars.newFollowUpDate = new Date(consultDate.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString();
    
    // Chief complaint and history
    const complaints = [
      'Persistent headache for 3 days',
      'Fever and body aches',
      'Chronic lower back pain',
      'Difficulty breathing',
      'Abdominal pain and nausea',
      'Skin rash and itching',
      'Routine check-up',
      'Follow-up visit'
    ];
    
    context.vars.chiefComplaint = faker.random.arrayElement(complaints);
    context.vars.presentIllness = `Patient presents with ${context.vars.chiefComplaint}. Symptoms started ${faker.random.number({min: 1, max: 7})} days ago.`;
    context.vars.pastMedicalHistory = faker.random.arrayElement([
      'No significant past medical history',
      'Hypertension, well controlled on medication',
      'Type 2 Diabetes Mellitus',
      'Asthma since childhood',
      'Previous surgery: Appendectomy (2015)'
    ]);
    
    context.vars.familyHistory = faker.random.arrayElement([
      'Father: Hypertension, Mother: Diabetes',
      'No significant family history',
      'Family history of heart disease',
      'Mother: Breast cancer'
    ]);
    
    context.vars.socialHistory = faker.random.arrayElement([
      'Non-smoker, occasional alcohol',
      'Former smoker, quit 5 years ago',
      'No tobacco or alcohol use',
      'Social drinker, no tobacco'
    ]);
    
    // Review of Systems
    context.vars.rosGeneral = 'No weight loss, fever, or night sweats';
    context.vars.rosCardio = 'No chest pain or palpitations';
    context.vars.rosRespiratory = 'No cough or shortness of breath';
    context.vars.rosGI = 'No nausea, vomiting, or diarrhea';
    context.vars.rosNeuro = 'No headaches or dizziness';
    
    // Physical Examination
    context.vars.peGeneral = 'Alert, oriented, in no acute distress';
    context.vars.bloodPressure = `${faker.random.number({min: 110, max: 140})}/${faker.random.number({min: 70, max: 90})}`;
    context.vars.heartRate = faker.random.number({min: 60, max: 100}).toString();
    context.vars.temperature = (faker.random.number({min: 97, max: 99}) + Math.random()).toFixed(1);
    context.vars.respiratoryRate = faker.random.number({min: 12, max: 20}).toString();
    context.vars.weight = faker.random.number({min: 50, max: 120}).toString();
    context.vars.height = faker.random.number({min: 150, max: 190}).toString();
    
    context.vars.peCardio = 'Regular rate and rhythm, no murmurs';
    context.vars.peRespiratory = 'Clear to auscultation bilaterally';
    context.vars.peAbdomen = 'Soft, non-tender, no masses';
    context.vars.peNeuro = 'Alert and oriented x3, cranial nerves intact';
    
    // Diagnosis
    const diagnoses = [
      { primary: 'Acute bronchitis', secondary: 'None', differential: 'Pneumonia, COVID-19' },
      { primary: 'Migraine headache', secondary: 'Tension headache', differential: 'Cluster headache, Sinusitis' },
      { primary: 'Gastroenteritis', secondary: 'Dehydration', differential: 'Food poisoning, IBS' },
      { primary: 'Hypertension', secondary: 'None', differential: 'White coat syndrome' },
      { primary: 'Upper respiratory infection', secondary: 'None', differential: 'Influenza, COVID-19' }
    ];
    
    const selectedDiagnosis = faker.random.arrayElement(diagnoses);
    context.vars.primaryDiagnosis = selectedDiagnosis.primary;
    context.vars.secondaryDiagnosis = selectedDiagnosis.secondary;
    context.vars.differentialDiagnosis = selectedDiagnosis.differential;
    
    // Treatment and investigations
    context.vars.treatmentPlan = `1. Rest and hydration\n2. Symptomatic treatment\n3. Follow up if symptoms worsen`;
    context.vars.investigations = faker.random.arrayElement([
      'CBC, Basic metabolic panel',
      'Chest X-ray',
      'No investigations needed at this time',
      'Urinalysis',
      'ECG'
    ]);
    
    context.vars.notes = 'Patient counseled about diagnosis and treatment plan. Will follow up as needed.';
    
    // Date ranges for searches
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    context.vars.startDate = startDate.toISOString().split('T')[0];
    context.vars.endDate = new Date().toISOString().split('T')[0];
    
    return done();
  },
  
  validateConsultationResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 201 && response.body) {
      context.vars.lastConsultationId = response.body.id;
      context.vars.lastConsultationNumber = response.body.consultationNumber;
      console.log(`Consultation created: ${response.body.consultationNumber}`);
    }
    return next();
  }
};