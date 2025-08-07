-- Populate Test Data for AlloDOC Backend
-- This script works with existing tables and populates comprehensive test data

-- ==========================
-- CLEAN EXISTING DATA
-- ==========================

-- Clean data in proper order (respecting foreign keys)
DELETE FROM prescriptions;
DELETE FROM consultations;
DELETE FROM appointments;
DELETE FROM user_roles;
DELETE FROM refresh_tokens;
DELETE FROM patients;  
DELETE FROM users;
DELETE FROM roles;
DELETE FROM organizations;

-- ==========================
-- ORGANIZATIONS
-- ==========================

INSERT INTO organizations (id, name, type, address, phone, email, "registrationNumber", description, "isActive", "createdAt", "updatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Saint Mary Medical Center', 'HOSPITAL', '123 Medical Plaza, Downtown City, State 12345', '+1-555-100-1000', 'contact@saintmary.com', 'REG-2020-001', 'Leading medical center specializing in comprehensive healthcare services', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Downtown Family Clinic', 'CLINIC', '456 Family Avenue, Suburb Area, State 12346', '+1-555-200-2000', 'info@downtownclinic.com', 'REG-2021-002', 'Family-focused medical clinic providing primary care services', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Pediatric Care Center', 'MEDICAL_CENTER', '789 Kids Lane, Family District, State 12347', '+1-555-300-3000', 'hello@pediatriccare.com', 'REG-2022-003', 'Specialized pediatric medical center for children healthcare', true, NOW(), NOW());

-- ==========================
-- ROLES
-- ==========================

INSERT INTO roles (id, name, "displayName", description, permissions, "isActive", "createdAt", "updatedAt") VALUES
('650e8400-e29b-41d4-a716-446655440001', 'SUPER_ADMIN', 'Super Administrator', 'Full system access and management', '*', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440002', 'ADMIN', 'Administrator', 'Organization administration and management', 'users:read,users:write,patients:read,patients:write,appointments:read,appointments:write,consultations:read,reports:read', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440003', 'DOCTOR', 'Doctor', 'Medical professional with full patient care access', 'patients:read,patients:write,appointments:read,appointments:write,consultations:read,consultations:write,prescriptions:read,prescriptions:write', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440004', 'SECRETARY', 'Secretary', 'Administrative support with limited access', 'patients:read,appointments:read,appointments:write', true, NOW(), NOW());

-- ==========================
-- USERS (DOCTORS & STAFF)
-- ==========================

INSERT INTO users (id, email, password, "firstName", "lastName", phone, "dateOfBirth", gender, "licenseNumber", specialty, "isActive", "emailVerified", "organizationId", "createdAt", "updatedAt") VALUES
-- Saint Mary Medical Center Staff
('750e8400-e29b-41d4-a716-446655440001', 'admin@saintmary.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'John', 'Administrator', '+1-555-100-1001', '1980-05-15', 'M', null, null, true, true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440002', 'dr.smith@saintmary.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Sarah', 'Smith', '+1-555-100-1002', '1975-08-22', 'F', 'MD-12345-ST', 'Cardiology', true, true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440003', 'dr.johnson@saintmary.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Michael', 'Johnson', '+1-555-100-1003', '1978-03-10', 'M', 'MD-23456-ST', 'Internal Medicine', true, true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440004', 'dr.brown@saintmary.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Emily', 'Brown', '+1-555-100-1004', '1982-11-28', 'F', 'MD-34567-ST', 'Dermatology', true, true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440005', 'secretary@saintmary.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Lisa', 'Wilson', '+1-555-100-1005', '1985-07-14', 'F', null, null, true, true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Downtown Family Clinic Staff
('750e8400-e29b-41d4-a716-446655440006', 'dr.davis@downtownclinic.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'David', 'Davis', '+1-555-200-2001', '1977-09-05', 'M', 'MD-45678-DT', 'Family Medicine', true, true, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440007', 'dr.garcia@downtownclinic.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Maria', 'Garcia', '+1-555-200-2002', '1983-12-18', 'F', 'MD-56789-DT', 'General Practice', true, true, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440008', 'admin@downtownclinic.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Robert', 'Martinez', '+1-555-200-2003', '1979-04-12', 'M', null, null, true, true, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),

-- Pediatric Care Center Staff
('750e8400-e29b-41d4-a716-446655440009', 'dr.lee@pediatriccare.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'Jennifer', 'Lee', '+1-555-300-3001', '1981-06-30', 'F', 'MD-67890-PC', 'Pediatrics', true, true, '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440010', 'dr.taylor@pediatriccare.com', '$2b$12$HJuxXqcsTElm3KRJpQFw1O0sH7Uv/xCtH1DXp8pNAvboAr3j2.KOq', 'James', 'Taylor', '+1-555-300-3002', '1976-01-25', 'M', 'MD-78901-PC', 'Pediatric Surgery', true, true, '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW());

-- ==========================
-- USER ROLES ASSIGNMENT
-- ==========================

INSERT INTO user_roles (user_id, role_id) VALUES
-- Saint Mary Medical Center
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002'), -- Admin role
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003'), -- Doctor role
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003'), -- Doctor role
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003'), -- Doctor role
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004'), -- Secretary role

-- Downtown Family Clinic
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003'), -- Doctor role
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003'), -- Doctor role
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440002'), -- Admin role

-- Pediatric Care Center
('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440003'), -- Doctor role
('750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440003'); -- Doctor role

-- ==========================
-- PATIENTS WITH COMPREHENSIVE MEDICAL HISTORY
-- ==========================

INSERT INTO patients (id, "patientNumber", "firstName", "lastName", "dateOfBirth", gender, email, phone, "alternatePhone", address, "medicalHistory", notes, "isActive", "lastVisit", "organizationId", "createdAt", "updatedAt") VALUES

-- Saint Mary Medical Center Patients
('850e8400-e29b-41d4-a716-446655440001', 'SMC-2024-001', 'Alice', 'Cooper', '1985-03-15', 'F', 'alice.cooper@email.com', '+1-555-111-1001', '+1-555-111-1002', '101 Maple Street, City Center, State 12345', 
'{"allergies": ["Penicillin", "Shellfish"], "chronicDiseases": ["Hypertension", "Type 2 Diabetes"], "surgeries": [{"procedure": "Appendectomy", "date": "2010-06-15", "hospital": "City General Hospital", "notes": "Routine procedure, no complications"}], "medications": [{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily", "startDate": "2020-01-15"}, {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily", "startDate": "2019-08-20"}], "familyHistory": {"diseases": ["Heart Disease", "Diabetes"], "notes": "Mother had Type 2 diabetes, Father had coronary artery disease"}}'::json,
'Patient is compliant with medications. Regular follow-ups needed for diabetes management.', true, '2024-07-15', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('850e8400-e29b-41d4-a716-446655440002', 'SMC-2024-002', 'Robert', 'Johnson', '1972-09-22', 'M', 'robert.johnson@email.com', '+1-555-111-2001', null, '202 Oak Avenue, Riverside, State 12346', 
'{"allergies": ["Latex"], "chronicDiseases": ["Coronary Artery Disease", "High Cholesterol"], "surgeries": [{"procedure": "Cardiac Catheterization", "date": "2022-03-20", "hospital": "Saint Mary Medical Center", "notes": "Two stents placed in LAD"}, {"procedure": "Gallbladder Removal", "date": "2018-11-10", "hospital": "Regional Medical Center", "notes": "Laparoscopic cholecystectomy"}], "medications": [{"name": "Atorvastatin", "dosage": "40mg", "frequency": "Once daily", "startDate": "2022-04-01"}, {"name": "Clopidogrel", "dosage": "75mg", "frequency": "Once daily", "startDate": "2022-03-25"}, {"name": "Carvedilol", "dosage": "12.5mg", "frequency": "Twice daily", "startDate": "2022-04-01"}], "familyHistory": {"diseases": ["Heart Disease", "Stroke"], "notes": "Strong family history of cardiovascular disease"}}'::json,
'Post-cardiac intervention patient. Excellent compliance with cardiac rehabilitation program.', true, '2024-07-20', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('850e8400-e29b-41d4-a716-446655440003', 'SMC-2024-003', 'Maria', 'Rodriguez', '1990-12-08', 'F', 'maria.rodriguez@email.com', '+1-555-111-3001', '+1-555-111-3002', '303 Pine Road, Northside, State 12347', 
'{"allergies": ["Sulfa drugs"], "chronicDiseases": ["Asthma"], "surgeries": [], "medications": [{"name": "Albuterol Inhaler", "dosage": "90mcg", "frequency": "As needed", "startDate": "2015-05-10"}, {"name": "Fluticasone", "dosage": "110mcg", "frequency": "Twice daily", "startDate": "2018-09-15"}], "familyHistory": {"diseases": ["Asthma", "Allergies"], "notes": "Mother has asthma, multiple siblings with environmental allergies"}}'::json,
'Young professional with well-controlled asthma. Active lifestyle, participates in running marathons.', true, '2024-06-30', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('850e8400-e29b-41d4-a716-446655440004', 'SMC-2024-004', 'James', 'Wilson', '1955-04-18', 'M', 'james.wilson@email.com', '+1-555-111-4001', null, '404 Elm Street, Downtown, State 12348', 
'{"allergies": ["Codeine", "Morphine"], "chronicDiseases": ["Chronic Kidney Disease", "Hypertension", "Gout"], "surgeries": [{"procedure": "Kidney Biopsy", "date": "2020-08-15", "hospital": "Saint Mary Medical Center", "notes": "Confirmed chronic glomerulonephritis"}], "medications": [{"name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "startDate": "2019-03-10"}, {"name": "Allopurinol", "dosage": "300mg", "frequency": "Once daily", "startDate": "2021-01-20"}, {"name": "Furosemide", "dosage": "40mg", "frequency": "Once daily", "startDate": "2020-09-01"}], "familyHistory": {"diseases": ["Kidney Disease", "Hypertension"], "notes": "Father had chronic kidney disease requiring dialysis"}}'::json,
'Chronic kidney disease patient requiring careful medication monitoring. Regular nephrology follow-ups.', true, '2024-07-25', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Downtown Family Clinic Patients
('850e8400-e29b-41d4-a716-446655440005', 'DFC-2024-001', 'Susan', 'Thompson', '1988-07-03', 'F', 'susan.thompson@email.com', '+1-555-222-1001', '+1-555-222-1002', '505 Birch Lane, Suburbia, State 12349', 
'{"allergies": ["Peanuts", "Tree nuts"], "chronicDiseases": ["Hypothyroidism"], "surgeries": [{"procedure": "Cesarean Section", "date": "2020-03-15", "hospital": "Women Hospital", "notes": "Delivery of healthy baby girl"}], "medications": [{"name": "Levothyroxine", "dosage": "75mcg", "frequency": "Once daily", "startDate": "2019-05-20"}], "familyHistory": {"diseases": ["Thyroid disorders", "Allergies"], "notes": "Mother has hypothyroidism, sister has multiple food allergies"}}'::json,
'New mother with well-controlled hypothyroidism. Carries EpiPen due to severe nut allergies.', true, '2024-06-28', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),

('850e8400-e29b-41d4-a716-446655440006', 'DFC-2024-002', 'Michael', 'Brown', '1995-11-12', 'M', 'michael.brown@email.com', '+1-555-222-2001', null, '606 Cedar Drive, Westside, State 12350', 
'{"allergies": [], "chronicDiseases": [], "surgeries": [{"procedure": "ACL Repair", "date": "2023-04-10", "hospital": "Sports Medicine Center", "notes": "Arthroscopic repair after sports injury"}], "medications": [{"name": "Ibuprofen", "dosage": "400mg", "frequency": "As needed", "startDate": "2023-04-15"}], "familyHistory": {"diseases": [], "notes": "No significant family medical history"}}'::json,
'Young athlete recovering from knee surgery. Active in physical therapy and sports rehabilitation.', true, '2024-07-10', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),

-- Pediatric Care Center Patients
('850e8400-e29b-41d4-a716-446655440007', 'PCC-2024-001', 'Emma', 'Davis', '2018-02-28', 'F', 'parent.davis@email.com', '+1-555-333-1001', '+1-555-333-1002', '707 Willow Street, Family Heights, State 12351', 
'{"allergies": ["Eggs", "Milk"], "chronicDiseases": ["Asthma", "Food Allergies"], "surgeries": [], "medications": [{"name": "Albuterol Inhaler", "dosage": "Pediatric", "frequency": "As needed", "startDate": "2020-08-01"}, {"name": "EpiPen Jr", "dosage": "0.15mg", "frequency": "Emergency use", "startDate": "2019-06-15"}], "familyHistory": {"diseases": ["Asthma", "Allergies"], "notes": "Both parents have environmental allergies, maternal grandmother has asthma"}}'::json,
'6-year-old with multiple food allergies and mild asthma. Parents well-educated on emergency management.', true, '2024-07-05', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),

('850e8400-e29b-41d4-a716-446655440008', 'PCC-2024-002', 'Liam', 'Martinez', '2020-09-14', 'M', 'parent.martinez@email.com', '+1-555-333-2001', null, '808 Spruce Avenue, Kid Valley, State 12352', 
'{"allergies": [], "chronicDiseases": [], "surgeries": [], "medications": [{"name": "Children Multivitamin", "dosage": "1 tablet", "frequency": "Once daily", "startDate": "2023-01-01"}], "familyHistory": {"diseases": [], "notes": "No significant family medical history"}}'::json,
'Healthy 4-year-old, up to date with vaccinations. Regular well-child visits.', true, '2024-06-15', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW());

-- ==========================
-- APPOINTMENTS
-- ==========================

INSERT INTO appointments (id, "appointmentDate", duration, status, type, reason, notes, "cancelReason", "isUrgent", "reminderSent", "reminderSentAt", metadata, "checkedInAt", "completedAt", "patientId", "doctorId", "organizationId", "createdAt", "updatedAt") VALUES

-- Recent appointments (completed)
('950e8400-e29b-41d4-a716-446655440001', '2024-07-15 09:00:00', 30, 'COMPLETED', 'FOLLOW_UP', 'Diabetes follow-up', 'Regular diabetes management visit', null, false, true, '2024-07-14 18:00:00', '{"room": "Room 101", "preparation": "Fasting blood glucose"}'::json, '2024-07-15 08:45:00', '2024-07-15 09:25:00', '850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('950e8400-e29b-41d4-a716-446655440002', '2024-07-20 14:30:00', 45, 'COMPLETED', 'FOLLOW_UP', 'Cardiology follow-up', 'Post-stent placement checkup', null, false, true, '2024-07-19 18:00:00', '{"room": "Cardiology Suite", "equipment": ["ECG", "Echo"]}'::json, '2024-07-20 14:15:00', '2024-07-20 15:10:00', '850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Upcoming appointments
('950e8400-e29b-41d4-a716-446655440003', '2024-08-05 10:00:00', 30, 'SCHEDULED', 'ROUTINE_CHECKUP', 'Annual physical exam', null, null, false, false, null, '{"room": "Room 203", "preparation": "Fasting for blood work"}'::json, null, null, '850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),

('950e8400-e29b-41d4-a716-446655440004', '2024-08-10 15:00:00', 30, 'CONFIRMED', 'CONSULTATION', 'Pediatric checkup', null, null, false, false, null, '{"room": "Pediatric Room 1", "equipment": ["Growth chart", "Vaccination supplies"]}'::json, null, null, '850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW());

-- ==========================
-- CONSULTATIONS
-- ==========================

INSERT INTO consultations (id, "consultationDate", reason, symptoms, "physicalExamination", investigation, "vitalSigns", diagnosis, "treatmentPlan", recommendations, attachments, "followUpInstructions", notes, metadata, "patientId", "doctorId", "organizationId", "appointmentId", "createdAt", "updatedAt") VALUES

('a50e8400-e29b-41d4-a716-446655440001', '2024-07-15 09:00:00', 'Diabetes follow-up', 'No specific symptoms, routine follow-up', 'Normal cardiovascular examination, no pedal edema, good peripheral pulses', 'HbA1c: 7.2%, Fasting glucose: 140 mg/dL', 
'{"bloodPressure": {"systolic": 128, "diastolic": 82}, "heartRate": 72, "temperature": 98.6, "weight": 165, "height": 65, "bmi": 27.4}'::json,
'Type 2 Diabetes Mellitus, well controlled', 
'Continue current medications, dietary counseling reinforced', 
'Continue low-carbohydrate diet, regular exercise 30 minutes daily, weight loss goal of 10 pounds', 
'[{"type": "lab_result", "filename": "lab_results_20240715.pdf", "url": "/files/lab_results_20240715.pdf", "description": "Recent lab work including HbA1c", "uploadedAt": "2024-07-15T09:20:00Z"}]'::json,
'Follow-up in 3 months, sooner if any concerns. Continue home glucose monitoring', 
'Patient very compliant with treatment plan. Excellent understanding of disease management.',
'{"consultationType": "follow_up", "complications": []}'::json,
'850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('a50e8400-e29b-41d4-a716-446655440002', '2024-07-20 14:30:00', 'Cardiology follow-up', 'Occasional chest tightness with exertion', 'Regular heart rhythm, no murmurs, lungs clear, no peripheral edema', 'ECG: Normal sinus rhythm, Echocardiogram: Normal EF 55%', 
'{"bloodPressure": {"systolic": 118, "diastolic": 75}, "heartRate": 68, "temperature": 98.4, "respiratoryRate": 16, "oxygenSaturation": 98, "weight": 180}'::json,
'Coronary Artery Disease, stable, post-PCI with good response', 
'Continue dual antiplatelet therapy, statin therapy, beta-blocker', 
'Continue cardiac rehabilitation program, gradual increase in exercise tolerance', 
'[{"type": "document", "filename": "echo_report_20240720.pdf", "url": "/files/echo_report_20240720.pdf", "description": "Echocardiogram report", "uploadedAt": "2024-07-20T15:00:00Z"}]'::json,
'Next follow-up in 6 months unless symptoms worsen. Continue medications as prescribed', 
'Patient doing well post-intervention. Good exercise tolerance improvement.',
'{"consultationType": "follow_up", "complications": []}'::json,
'850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440002', NOW(), NOW());

-- ==========================
-- PRESCRIPTIONS
-- ==========================

INSERT INTO prescriptions (id, medications, "generalInstructions", "prescribedDate", notes, warnings, "consultationId", "organizationId", "createdAt", "updatedAt") VALUES

('b50e8400-e29b-41d4-a716-446655440001', 
'[{"name": "Metformin Extended Release", "dosage": "500mg", "frequency": "Twice daily with meals", "duration": "90 days", "instructions": "Take with breakfast and dinner to reduce GI upset", "quantity": 180}, {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily in morning", "duration": "90 days", "instructions": "Monitor blood pressure regularly", "quantity": 90}]'::json,
'Continue current diabetes management regimen. Monitor blood glucose levels daily and keep a log.',
'2024-07-15',
'Patient well-educated on medication compliance and lifestyle modifications.',
'[{"type": "warning", "message": "Monitor kidney function with ACE inhibitor", "severity": "medium"}, {"type": "warning", "message": "Watch for signs of hypoglycemia", "severity": "medium"}]'::json,
'a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('b50e8400-e29b-41d4-a716-446655440002', 
'[{"name": "Atorvastatin", "dosage": "40mg", "frequency": "Once daily at bedtime", "duration": "90 days", "instructions": "Take at the same time each evening", "quantity": 90}, {"name": "Clopidogrel", "dosage": "75mg", "frequency": "Once daily", "duration": "90 days", "instructions": "Take with or without food", "quantity": 90}, {"name": "Carvedilol", "dosage": "12.5mg", "frequency": "Twice daily", "duration": "90 days", "instructions": "Take with food to reduce dizziness", "quantity": 180}]'::json,
'Continue dual antiplatelet therapy as prescribed. Do not stop medications without consulting cardiologist.',
'2024-07-20',
'Post-PCI medication regimen. Patient counseled on importance of medication compliance.',
'[{"type": "warning", "message": "Increased bleeding risk with dual antiplatelet therapy", "severity": "high"}, {"type": "warning", "message": "Monitor for muscle pain with statin therapy", "severity": "medium"}]'::json,
'a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW());

-- ==========================
-- SUMMARY
-- ==========================

SELECT 'DATABASE POPULATED SUCCESSFULLY!' as message;

-- Display summary of inserted data
SELECT 'ORGANIZATIONS' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL
SELECT 'ROLES', COUNT(*) FROM roles
UNION ALL
SELECT 'USERS', COUNT(*) FROM users
UNION ALL
SELECT 'USER_ROLES', COUNT(*) FROM user_roles
UNION ALL
SELECT 'PATIENTS', COUNT(*) FROM patients
UNION ALL
SELECT 'APPOINTMENTS', COUNT(*) FROM appointments
UNION ALL
SELECT 'CONSULTATIONS', COUNT(*) FROM consultations
UNION ALL
SELECT 'PRESCRIPTIONS', COUNT(*) FROM prescriptions;

-- Sample login credentials (password is 'password123' for all users)
SELECT 
    'LOGIN CREDENTIALS - Password: password123 for all users' as info;

SELECT 
    email as "Email Address",
    "firstName" || ' ' || "lastName" as "Full Name",
    specialty as "Specialty/Role"
FROM users 
ORDER BY "organizationId", "firstName";