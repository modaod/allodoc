// Complete Medical Workflow User Acceptance Tests
import { test, expect } from '@playwright/test';

test.describe('Complete Medical Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'doctor@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('UAT-050: Complete patient journey from registration to prescription', async ({ page }) => {
    // Step 1: Navigate to patient registration
    await page.click('[data-testid=menu-patients]');
    await expect(page).toHaveURL('/patients');
    
    await page.click('[data-testid=add-patient-button]');
    await expect(page).toHaveURL('/patients/new');

    // Step 2: Register new patient
    const patientData = {
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1980-05-15',
      gender: 'Male',
      email: 'john.smith@email.com',
      phone: '+1-555-123-4567',
      bloodGroup: 'O+',
      address: '123 Main St, Anytown, ST 12345'
    };

    await page.fill('[data-testid=patient-first-name]', patientData.firstName);
    await page.fill('[data-testid=patient-last-name]', patientData.lastName);
    await page.fill('[data-testid=patient-dob]', patientData.dateOfBirth);
    await page.selectOption('[data-testid=patient-gender]', patientData.gender);
    await page.fill('[data-testid=patient-email]', patientData.email);
    await page.fill('[data-testid=patient-phone]', patientData.phone);
    await page.selectOption('[data-testid=patient-blood-group]', patientData.bloodGroup);
    await page.fill('[data-testid=patient-address]', patientData.address);

    await page.click('[data-testid=save-patient-button]');
    
    // Should redirect to patient details
    await expect(page).toHaveURL(/\/patients\/[a-f0-9-]+/);
    await expect(page.locator('[data-testid=patient-name]')).toContainText(`${patientData.firstName} ${patientData.lastName}`);

    // Step 3: Create consultation
    await page.click('[data-testid=new-consultation-button]');
    
    // Fill consultation data
    await page.fill('[data-testid=chief-complaint]', 'Annual health checkup');
    await page.fill('[data-testid=present-illness]', 'Patient presents for routine annual physical examination');
    
    // Vital signs
    await page.fill('[data-testid=blood-pressure]', '120/80');
    await page.fill('[data-testid=heart-rate]', '72');
    await page.fill('[data-testid=temperature]', '98.6');
    await page.fill('[data-testid=weight]', '70');
    await page.fill('[data-testid=height]', '175');

    // Physical examination
    await page.fill('[data-testid=general-appearance]', 'Alert and oriented, no acute distress');
    await page.fill('[data-testid=cardiovascular]', 'Regular rate and rhythm, no murmurs');
    await page.fill('[data-testid=respiratory]', 'Clear to auscultation bilaterally');

    // Diagnosis
    await page.fill('[data-testid=primary-diagnosis]', 'Annual health maintenance exam');
    await page.fill('[data-testid=treatment-plan]', 'Continue current lifestyle. Return in one year for follow-up.');

    await page.click('[data-testid=save-consultation-button]');
    
    // Should create consultation successfully
    await expect(page.locator('[data-testid=consultation-success]')).toBeVisible();
    await expect(page.locator('[data-testid=consultation-number]')).toBeVisible();

    // Step 4: Create prescription
    await page.click('[data-testid=create-prescription-button]');
    
    // Add medications
    await page.click('[data-testid=add-medication-button]');
    await page.fill('[data-testid=medication-0-name]', 'Vitamin D3');
    await page.fill('[data-testid=medication-0-dosage]', '1000 IU');
    await page.fill('[data-testid=medication-0-frequency]', 'Once daily');
    await page.fill('[data-testid=medication-0-duration]', '30 days');
    await page.fill('[data-testid=medication-0-instructions]', 'Take with main meal');

    await page.fill('[data-testid=prescription-notes]', 'Patient advised about healthy lifestyle and regular exercise');
    
    await page.click('[data-testid=save-prescription-button]');
    
    // Should create prescription successfully
    await expect(page.locator('[data-testid=prescription-success]')).toBeVisible();
    await expect(page.locator('[data-testid=prescription-number]')).toBeVisible();

    // Step 5: Verify patient timeline shows all activities
    await page.click('[data-testid=patient-timeline-tab]');
    
    // Should show consultation entry
    await expect(page.locator('[data-testid=timeline-consultation]')).toBeVisible();
    await expect(page.locator('[data-testid=timeline-consultation]')).toContainText('Annual health maintenance exam');
    
    // Should show prescription entry
    await expect(page.locator('[data-testid=timeline-prescription]')).toBeVisible();
    await expect(page.locator('[data-testid=timeline-prescription]')).toContainText('Vitamin D3');

    // Step 6: Generate and download prescription PDF
    await page.click('[data-testid=prescription-actions]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid=download-prescription-pdf]');
    const download = await downloadPromise;
    
    // Verify PDF download
    expect(download.suggestedFilename()).toMatch(/prescription.*\.pdf/);
  });

  test('UAT-051: Multi-medication prescription workflow', async ({ page }) => {
    // Navigate to existing patient
    await page.goto('/patients');
    await page.click('[data-testid=patient-row]', { timeout: 10000 });
    
    // Create new consultation
    await page.click('[data-testid=new-consultation-button]');
    
    await page.fill('[data-testid=chief-complaint]', 'Upper respiratory infection');
    await page.fill('[data-testid=primary-diagnosis]', 'Viral upper respiratory tract infection');
    
    await page.click('[data-testid=save-consultation-button]');
    
    // Create complex prescription
    await page.click('[data-testid=create-prescription-button]');
    
    // Add multiple medications
    const medications = [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'QID PRN', duration: '5 days' },
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '10 days' }
    ];

    for (let i = 0; i < medications.length; i++) {
      if (i > 0) {
        await page.click('[data-testid=add-medication-button]');
      }
      
      const med = medications[i];
      await page.fill(`[data-testid=medication-${i}-name]`, med.name);
      await page.fill(`[data-testid=medication-${i}-dosage]`, med.dosage);
      await page.fill(`[data-testid=medication-${i}-frequency]`, med.frequency);
      await page.fill(`[data-testid=medication-${i}-duration]`, med.duration);
    }

    await page.click('[data-testid=save-prescription-button]');
    
    // Should save successfully
    await expect(page.locator('[data-testid=prescription-success]')).toBeVisible();
    
    // Verify all medications are listed
    for (const med of medications) {
      await expect(page.locator('[data-testid=prescription-medications]')).toContainText(med.name);
    }
  });

  test('UAT-052: Follow-up appointment scheduling', async ({ page }) => {
    // Navigate to patient
    await page.goto('/patients');
    await page.click('[data-testid=patient-row]', { timeout: 10000 });
    
    // Schedule follow-up appointment
    await page.click('[data-testid=schedule-followup-button]');
    
    // Set appointment details
    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + 14);
    const dateString = followupDate.toISOString().split('T')[0];
    
    await page.fill('[data-testid=appointment-date]', dateString);
    await page.fill('[data-testid=appointment-time]', '14:00');
    await page.selectOption('[data-testid=appointment-type]', 'Follow-up');
    await page.fill('[data-testid=appointment-reason]', 'Follow-up for recent consultation');

    await page.click('[data-testid=save-appointment-button]');
    
    // Should save successfully
    await expect(page.locator('[data-testid=appointment-success]')).toBeVisible();
    
    // Navigate to appointments and verify
    await page.click('[data-testid=menu-appointments]');
    await expect(page.locator('[data-testid=appointment-list]')).toContainText('Follow-up');
    await expect(page.locator('[data-testid=appointment-list]')).toContainText(dateString);
  });

  test('UAT-053: Data integrity across complete workflow', async ({ page }) => {
    const testData = {
      patient: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: `test.${Date.now()}@example.com`
      },
      consultation: {
        complaint: 'Routine diabetes check',
        diagnosis: 'Type 2 Diabetes Mellitus - controlled'
      },
      prescription: {
        medication: 'Metformin',
        dosage: '500mg',
        frequency: 'BID'
      }
    };

    // Create patient
    await page.goto('/patients/new');
    await page.fill('[data-testid=patient-first-name]', testData.patient.firstName);
    await page.fill('[data-testid=patient-last-name]', testData.patient.lastName);
    await page.fill('[data-testid=patient-email]', testData.patient.email);
    await page.fill('[data-testid=patient-dob]', '1975-03-20');
    await page.selectOption('[data-testid=patient-gender]', 'Female');
    await page.click('[data-testid=save-patient-button]');

    const patientUrl = page.url();
    const patientId = patientUrl.split('/').pop();

    // Create consultation
    await page.click('[data-testid=new-consultation-button]');
    await page.fill('[data-testid=chief-complaint]', testData.consultation.complaint);
    await page.fill('[data-testid=primary-diagnosis]', testData.consultation.diagnosis);
    await page.click('[data-testid=save-consultation-button]');

    // Create prescription
    await page.click('[data-testid=create-prescription-button]');
    await page.fill('[data-testid=medication-0-name]', testData.prescription.medication);
    await page.fill('[data-testid=medication-0-dosage]', testData.prescription.dosage);
    await page.fill('[data-testid=medication-0-frequency]', testData.prescription.frequency);
    await page.click('[data-testid=save-prescription-button]');

    // Verify data consistency across views
    // Check dashboard shows recent activity
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid=recent-consultations]')).toContainText(testData.patient.firstName);

    // Check patient list shows new patient
    await page.goto('/patients');
    await expect(page.locator('[data-testid=patient-list]')).toContainText(testData.patient.firstName);
    await expect(page.locator('[data-testid=patient-list]')).toContainText(testData.patient.email);

    // Check consultation list shows new consultation
    await page.goto('/consultations');
    await expect(page.locator('[data-testid=consultation-list]')).toContainText(testData.consultation.complaint);

    // Check prescription list shows new prescription
    await page.goto('/prescriptions');
    await expect(page.locator('[data-testid=prescription-list]')).toContainText(testData.prescription.medication);

    // Verify patient relationship is maintained
    await page.goto(`/patients/${patientId}`);
    await expect(page.locator('[data-testid=patient-consultations]')).toContainText(testData.consultation.diagnosis);
    await expect(page.locator('[data-testid=patient-prescriptions]')).toContainText(testData.prescription.medication);
  });

  test('UAT-054: Error handling in complete workflow', async ({ page }) => {
    // Test network error handling during patient creation
    await page.route('**/api/v1/patients', (route) => {
      route.abort('failed');
    });

    await page.goto('/patients/new');
    await page.fill('[data-testid=patient-first-name]', 'Test');
    await page.fill('[data-testid=patient-last-name]', 'Patient');
    await page.click('[data-testid=save-patient-button]');

    // Should show error message
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Network error');

    // Form should retain data
    await expect(page.locator('[data-testid=patient-first-name]')).toHaveValue('Test');
    await expect(page.locator('[data-testid=patient-last-name]')).toHaveValue('Patient');
  });
});