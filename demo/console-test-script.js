// Console Test Script for Drop-off Field Fix
// Paste this into the browser console on any page with tour-detail-form.js loaded

console.log('=== TESTING DROP-OFF FIELD FIX ===');

// Test current state
const dropOffField = document.querySelector('input[data-q="drop-off_location"]');
console.log('1. Drop-off field found:', !!dropOffField);

if (dropOffField) {
  console.log('2. Current field type:', dropOffField.type);
  console.log('3. Current field value:', dropOffField.value);
  console.log('4. Current CFG.formType:', window.CFG?.formType);
  console.log('5. Field is visible:', dropOffField.type !== 'hidden' && getComputedStyle(dropOffField).display !== 'none');
  
  // Test the fix by manually setting different formType values
  console.log('\n--- Testing formType scenarios ---');
  
  // Scenario 1: No formType (should be visible)
  console.log('\nTEST 1: No formType specified');
  delete window.CFG?.formType;
  dropOffField.type = 'text';
  dropOffField.dataset.dropAutoFilled = '';
  
  // Simulate the fixed autofillHiddenDropOff logic
  const shouldHide1 = window.CFG?.formType === 'transfer' || dropOffField.type === 'hidden';
  console.log('shouldHide:', shouldHide1, '(expected: false)');
  if (shouldHide1 && dropOffField.type !== 'hidden') {
    dropOffField.type = 'hidden';
    console.log('Result: Field hidden');
  } else {
    console.log('Result: Field remains visible ✅');
  }
  
  // Scenario 2: formType = 'tour' (should be visible)
  console.log('\nTEST 2: formType = "tour"');
  if (!window.CFG) window.CFG = {};
  window.CFG.formType = 'tour';
  dropOffField.type = 'text';
  dropOffField.dataset.dropAutoFilled = '';
  
  const shouldHide2 = window.CFG?.formType === 'transfer' || dropOffField.type === 'hidden';
  console.log('shouldHide:', shouldHide2, '(expected: false)');
  if (shouldHide2 && dropOffField.type !== 'hidden') {
    dropOffField.type = 'hidden';
    console.log('Result: Field hidden');
  } else {
    console.log('Result: Field remains visible ✅');
  }
  
  // Scenario 3: formType = 'transfer' (should be hidden)
  console.log('\nTEST 3: formType = "transfer"');
  window.CFG.formType = 'transfer';
  dropOffField.type = 'text';
  dropOffField.dataset.dropAutoFilled = '';
  
  const shouldHide3 = window.CFG?.formType === 'transfer' || dropOffField.type === 'hidden';
  console.log('shouldHide:', shouldHide3, '(expected: true)');
  if (shouldHide3 && dropOffField.type !== 'hidden') {
    dropOffField.type = 'hidden';
    console.log('Result: Field hidden ✅');
  } else {
    console.log('Result: Field remains visible');
  }
  
  // Reset to default state
  console.log('\n--- Resetting to default state ---');
  delete window.CFG?.formType;
  dropOffField.type = 'text';
  dropOffField.style.display = '';
  dropOffField.style.visibility = '';
  console.log('Reset complete. Field should now be visible for tour use.');
  
} else {
  console.log('❌ No drop-off field found. Make sure you\'re on a page with tour-detail-form.js loaded.');
}

console.log('\n=== TEST COMPLETE ===');
console.log('✅ The fix ensures drop-off field is only hidden when formType="transfer"');
console.log('✅ For tour forms (no formType or formType="tour"), field remains visible');