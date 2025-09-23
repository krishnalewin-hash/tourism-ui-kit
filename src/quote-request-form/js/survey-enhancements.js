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
        button:not([type="submit"]):not(.btn-submit):not(.survey-submit)
      `);
      
      const submitButtons = document.querySelectorAll(`
        button[type="submit"], 
        .survey-submit, 
        .btn-submit,
        button[class*="submit"],
        button[id*="submit"],
        .ghl-submit,
        .quote-btn,
        [data-action="submit"]
      `);
      
      // Enhance next buttons with fade transitions
      nextButtons.forEach(btn => {
        if (!btn.dataset.surveyEnhanced) {
          btn.addEventListener('click', (e) => {
            // Add fade transition for step change
            const currentStep = document.querySelector(`
              .ghl-survey-step:not([style*="display: none"]), 
              .survey-step.active, 
              [data-step].active,
              .step-container.active,
              .form-step:not([style*="display: none"])
            `);
            
            if (currentStep) {
              currentStep.classList.add('survey-step-fade-out');
              
              setTimeout(() => {
                // Find and fade in next step
                const allSteps = document.querySelectorAll(`
                  .ghl-survey-step, 
                  .survey-step, 
                  [data-step],
                  .step-container,
                  .form-step
                `);
                
                let nextStep = null;
                let foundCurrent = false;
                
                for (let step of allSteps) {
                  if (foundCurrent && step !== currentStep) {
                    nextStep = step;
                    break;
                  }
                  if (step === currentStep) {
                    foundCurrent = true;
                  }
                }
                
                if (nextStep) {
                  nextStep.classList.remove('survey-step-fade-out');
                  nextStep.classList.add('survey-step-fade-in');
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
          // Change button text to "GET YOUR QUOTE!" and add arrow
          const originalText = btn.textContent.trim();
          const needsTextChange = !originalText.toUpperCase().includes('GET YOUR QUOTE') && (
            originalText.toLowerCase().includes('submit') || 
            originalText.toLowerCase().includes('get') || 
            originalText.toLowerCase().includes('quote') ||
            originalText.toLowerCase().includes('next') ||
            originalText.toLowerCase().includes('send') ||
            originalText.toLowerCase().includes('finish') ||
            originalText.toLowerCase().includes('complete')
          );
          
          if (needsTextChange) {
            // Create structured button content with new text
            btn.innerHTML = `
              <span class="btn-text">GET YOUR QUOTE!</span>
              <span class="btn-arrow"></span>
              <span class="btn-processing" style="display: none;">PROCESSING</span>
            `;
          } else if (!btn.querySelector('.btn-arrow')) {
            // Just add arrow and processing span if text is already good
            const currentText = btn.textContent.trim();
            btn.innerHTML = `
              <span class="btn-text">${currentText}</span>
              <span class="btn-arrow"></span>
              <span class="btn-processing" style="display: none;">PROCESSING</span>
            `;
          }
          
          // Add loading state on click
          btn.addEventListener('click', (e) => {
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
            }
            
            console.log('Form submission started - showing PROCESSING state');
            
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
              }
            }, 10000);
          });
          
          btn.dataset.submitEnhanced = 'true';
        }
      });
    };
    
    // Run immediately and on interval to catch dynamically created buttons
    monitorButtons();
    setInterval(monitorButtons, 1000);
    
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
    addStepTransitions();
    enhanceSurveyNavigation();
    
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