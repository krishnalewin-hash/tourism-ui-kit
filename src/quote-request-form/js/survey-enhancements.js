// Survey Enhancements Module
// Handles fade transitions, button text changes, arrow styling, and loading states

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

(function initSurveyEnhancements() {
  if (window.__surveyEnhancements) return;

  // Survey step fade transition functionality
  function addStepTransitions() {
    // Add CSS for fade transitions
    if (!document.getElementById('survey-transition-styles')) {
      const style = document.createElement('style');
      style.id = 'survey-transition-styles';
      style.textContent = `
        /* Survey step fade transitions */
        .ghl-survey-step, .survey-step, [data-step], .step-container {
          transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
        }
        
        .survey-step-fade-out {
          opacity: 0;
          transform: translateX(-20px);
        }
        
        .survey-step-fade-in {
          opacity: 1;
          transform: translateX(0);
        }
        
        /* Submit button enhancements */
        .ghl-submit-btn, button[type="submit"], .survey-submit, .btn-submit {
          position: relative;
          overflow: hidden;
        }
        
        /* Loading state */
        .btn-loading {
          pointer-events: none;
          position: relative;
        }
        
        .btn-loading::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          margin: -10px 0 0 -10px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: btn-spin 1s linear infinite;
          z-index: 1;
        }
        
        .btn-loading .btn-text {
          opacity: 0;
        }
        
        .btn-loading .btn-processing {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          z-index: 2;
        }
        
        @keyframes btn-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Arrow styling improvements */
        .btn-arrow, .submit-arrow {
          display: inline-block;
          margin-left: 8px;
          color: white !important;
          font-weight: normal;
          transition: transform 0.2s ease;
        }
        
        .btn-arrow::after {
          content: '→';
          font-size: 1.1em;
          font-weight: normal;
        }
        
        button:hover .btn-arrow {
          transform: translateX(2px);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Monitor and enhance survey navigation
  function enhanceSurveyNavigation() {
    const monitorButtons = () => {
      // Find survey navigation buttons with better selectors
      const nextButtons = document.querySelectorAll(`
        [data-action="next"], 
        .survey-next, 
        .btn-next, 
        button:not([type="submit"]):not(.btn-submit):not(.survey-submit),
        .ghl-next,
        button:contains("Next"),
        button:contains("Continue"),
        div[data-v] button:not([type="submit"])
      `);
      
      const submitButtons = document.querySelectorAll(`
        button[type="submit"], 
        .survey-submit, 
        .btn-submit,
        button[class*="submit"],
        button[id*="submit"],
        .ghl-submit,
        .quote-btn,
        [data-action="submit"],
        .ghl-btn,
        .ghl-submit-btn,
        button:contains("GET"),
        button:contains("QUOTE"),
        div[data-v] button
      `);
      
      // Enhance next buttons with fade transitions
      nextButtons.forEach(btn => {
        if (!btn.dataset.surveyEnhanced) {
          console.log('Found next button:', btn, 'Text:', btn.textContent.trim());
          
          btn.addEventListener('click', (e) => {
            console.log('Next button clicked - applying fade transition');
            
            // Add fade transition for step change - try multiple selector patterns
            const currentStep = document.querySelector(`
              .ghl-survey-step:not([style*="display: none"]), 
              .survey-step.active, 
              [data-step].active,
              .step-container.active,
              .form-step:not([style*="display: none"]),
              div[data-v]:not([style*="display: none"]):not([style*="visibility: hidden"]),
              .survey-page:not([style*="display: none"]),
              .step:not(.hidden)
            `) || document.querySelector('div[data-v]');
            
            console.log('Current step found:', currentStep);
            
            if (currentStep) {
              currentStep.classList.add('survey-step-fade-out');
              console.log('Added fade-out class to current step');
              
              setTimeout(() => {
                // Find and fade in next step - more comprehensive search
                const allSteps = document.querySelectorAll(`
                  .ghl-survey-step, 
                  .survey-step, 
                  [data-step],
                  .step-container,
                  .form-step,
                  div[data-v],
                  .survey-page,
                  .step
                `);
                
                console.log('All steps found:', allSteps.length);
                
                let nextStep = null;
                let foundCurrent = false;
                
                for (let step of allSteps) {
                  if (foundCurrent && step !== currentStep) {
                    // Check if this step is likely to be shown next
                    const isHidden = step.style.display === 'none' || 
                                   step.style.visibility === 'hidden' ||
                                   step.classList.contains('hidden');
                    if (!isHidden) {
                      nextStep = step;
                      break;
                    }
                  }
                  if (step === currentStep) {
                    foundCurrent = true;
                  }
                }
                
                console.log('Next step found:', nextStep);
                
                if (nextStep) {
                  nextStep.classList.remove('survey-step-fade-out');
                  nextStep.classList.add('survey-step-fade-in');
                  console.log('Added fade-in class to next step');
                }
              }, 200);
            }
          });
          btn.dataset.surveyEnhanced = 'true';
        }
      });
      
      // Enhance submit buttons
      submitButtons.forEach(btn => {
        if (!btn.dataset.submitEnhanced) {
          console.log('Found submit button:', btn, 'Text:', btn.textContent.trim());
          
          // Change button text to "GET YOUR QUOTE!" and add arrow
          const originalText = btn.textContent.trim();
          const needsTextChange = originalText.toUpperCase().includes('QUOTES') || (
            !originalText.toUpperCase().includes('GET YOUR QUOTE') && (
              originalText.toLowerCase().includes('submit') || 
              originalText.toLowerCase().includes('get') || 
              originalText.toLowerCase().includes('quote') ||
              originalText.toLowerCase().includes('next') ||
              originalText.toLowerCase().includes('send') ||
              originalText.toLowerCase().includes('finish') ||
              originalText.toLowerCase().includes('complete')
            )
          );
          
          // Always restructure the button to ensure our enhancements work
          const currentText = needsTextChange ? 'GET YOUR QUOTE!' : originalText;
          
          // Remove existing arrow elements
          const existingArrows = btn.querySelectorAll('.bf-arrow, .btn-arrow, [class*="arrow"]');
          existingArrows.forEach(arrow => arrow.remove());
          
          // Create structured button content
          btn.innerHTML = `
            <span class="btn-text">${currentText}</span>
            <span class="btn-arrow"></span>
            <span class="btn-processing" style="display: none;">PROCESSING</span>
          `;
          
          console.log('Enhanced button with text:', currentText);
          
          // Add loading state on click
          btn.addEventListener('click', (e) => {
            console.log('Button clicked - adding loading state');
            
            // Don't prevent default - let form submit normally
            
            // Add loading state immediately
            btn.classList.add('btn-loading');
            btn.disabled = true;
            
            // Show processing text and hide original text
            const processingSpan = btn.querySelector('.btn-processing');
            const textSpan = btn.querySelector('.btn-text');
            const arrowSpan = btn.querySelector('.btn-arrow');
            
            if (processingSpan && textSpan) {
              processingSpan.style.display = 'block';
              textSpan.style.opacity = '0';
              if (arrowSpan) arrowSpan.style.opacity = '0';
              console.log('Showing PROCESSING state');
            }
            
            // Fallback: remove loading state after 10 seconds in case redirect fails
            setTimeout(() => {
              if (btn.classList.contains('btn-loading')) {
                btn.classList.remove('btn-loading');
                btn.disabled = false;
                if (processingSpan && textSpan) {
                  processingSpan.style.display = 'none';
                  textSpan.style.opacity = '1';
                  if (arrowSpan) arrowSpan.style.opacity = '1';
                }
                console.log('Loading state timeout - reset button');
              }
            }, 10000);
          });
          
          btn.dataset.submitEnhanced = 'true';
        }
      });
    };
    
    // Run immediately and on frequent interval to catch dynamically created buttons
    monitorButtons();
    const monitorInterval = setInterval(monitorButtons, 500); // More frequent monitoring
    
    // Stop monitoring after 30 seconds to avoid infinite intervals
    setTimeout(() => {
      clearInterval(monitorInterval);
      console.log('Survey enhancement monitoring stopped after 30s');
    }, 30000);
    
    // Also use MutationObserver for immediate detection
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && (
              (node.matches && node.matches('button, .btn, .survey-next, .survey-submit')) ||
              (node.querySelector && node.querySelector('button, .btn, .survey-next, .survey-submit'))
            )) {
              shouldCheck = true;
            }
          });
        });
        if (shouldCheck) {
          setTimeout(monitorButtons, 100);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize all enhancements
  function init() {
    console.log('Initializing survey enhancements...');
    addStepTransitions();
    enhanceSurveyNavigation();
    
    // Force immediate button enhancement after short delay
    setTimeout(() => {
      console.log('Running forced button enhancement...');
      const allButtons = document.querySelectorAll('button, .btn, [role="button"]');
      console.log('Found buttons for enhancement:', allButtons.length);
      allButtons.forEach(btn => {
        console.log('Button:', btn, 'Text:', btn.textContent.trim(), 'Type:', btn.type);
      });
    }, 1000);
    
    console.log('Survey enhancements initialized');
  }

  window.__surveyEnhancements = { init };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Expose for external access
window.BookingForm.initSurveyEnhancements = function() {
  if (window.__surveyEnhancements && window.__surveyEnhancements.init) {
    window.__surveyEnhancements.init();
  }
};