// Time picker - using IIFE singleton pattern from temp.js
window.BookingForm = window.BookingForm || {};

(function initSingletonTimePicker() {
  let initialized = false;
  
  window.BookingForm.setupTimePicker = function() {
    if (initialized) return;
    initialized = true;
    
    // Check for both pickup-time and existing time field
    const timeField = document.querySelector('input[data-q="pickup_time"], input[name="pickup-time"]') ||
                     document.querySelector('input[placeholder*="time" i], input[data-q*="time" i]');
    
    if (!timeField) return;
    
    timeField.addEventListener('focus', function() {
      if (document.getElementById('time-picker-popover')) return;
      
      const popover = createTimePopover();
      document.body.appendChild(popover);
      
      const rect = timeField.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        popover.style.bottom = (window.innerHeight - rect.top + 5) + 'px';
        popover.style.top = 'auto';
      } else {
        popover.style.top = (rect.bottom + 5) + 'px';
      }
      
      popover.style.left = rect.left + 'px';
      popover.style.width = Math.max(rect.width, 200) + 'px';
      
      // Set initial value
      const currentVal = timeField.value;
      if (currentVal) {
        const [time, period] = parseTime(currentVal);
        if (time) {
          updateSpinners(time.hour, time.minute, period);
        }
      } else {
        // Default to current time rounded to next 15-minute interval
        const now = new Date();
        const minutes = Math.ceil(now.getMinutes() / 15) * 15;
        const hour = minutes >= 60 ? now.getHours() + 1 : now.getHours();
        const adjustedMinutes = minutes >= 60 ? 0 : minutes;
        
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        updateSpinners(hour12, adjustedMinutes, period);
        updateTimeField();
      }
      
      setTimeout(() => popover.style.display = 'block', 10);
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
      const popover = document.getElementById('time-picker-popover');
      if (popover && !popover.contains(e.target) && !timeField.contains(e.target)) {
        popover.remove();
      }
    });
  };
  
  function createTimePopover() {
    const popover = document.createElement('div');
    popover.id = 'time-picker-popover';
    popover.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      background: white;
      border: 1px solid #444;
      border-radius: 8px;
      box-shadow: 0 6px 22px rgba(0,0,0,0.18);
      padding: 16px;
      display: none;
      font-family: system-ui, Arial, sans-serif;
    `;
    
    popover.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #666;">HOUR</div>
          <div class="spinner-container">
            <button type="button" class="spinner-btn" data-action="hour-up" style="display: block; width: 40px; height: 30px; border: 1px solid #ccc; background: #f8f8f8; cursor: pointer; border-radius: 4px 4px 0 0; font-size: 16px;">▲</button>
            <div class="spinner-value" data-type="hour" style="width: 40px; height: 40px; border: 1px solid #ccc; border-top: none; border-bottom: none; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; background: white;">12</div>
            <button type="button" class="spinner-btn" data-action="hour-down" style="display: block; width: 40px; height: 30px; border: 1px solid #ccc; background: #f8f8f8; cursor: pointer; border-radius: 0 0 4px 4px; font-size: 16px;">▼</button>
          </div>
        </div>
        
        <div style="font-size: 24px; font-weight: bold; margin-top: 20px;">:</div>
        
        <div style="text-align: center;">
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #666;">MIN</div>
          <div class="spinner-container">
            <button type="button" class="spinner-btn" data-action="minute-up" style="display: block; width: 40px; height: 30px; border: 1px solid #ccc; background: #f8f8f8; cursor: pointer; border-radius: 4px 4px 0 0; font-size: 16px;">▲</button>
            <div class="spinner-value" data-type="minute" style="width: 40px; height: 40px; border: 1px solid #ccc; border-top: none; border-bottom: none; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; background: white;">00</div>
            <button type="button" class="spinner-btn" data-action="minute-down" style="display: block; width: 40px; height: 30px; border: 1px solid #ccc; background: #f8f8f8; cursor: pointer; border-radius: 0 0 4px 4px; font-size: 16px;">▼</button>
          </div>
        </div>
        
        <div style="text-align: center; margin-left: 8px;">
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #666;">&nbsp;</div>
          <div class="period-toggle" style="display: flex; flex-direction: column; gap: 2px;">
            <button type="button" class="period-btn active" data-period="AM" style="width: 40px; height: 18px; border: 1px solid #188BF6; background: #188BF6; color: white; cursor: pointer; border-radius: 4px 4px 0 0; font-size: 12px; font-weight: 600;">AM</button>
            <button type="button" class="period-btn" data-period="PM" style="width: 40px; height: 18px; border: 1px solid #ccc; background: #f8f8f8; color: #666; cursor: pointer; border-radius: 0 0 4px 4px; font-size: 12px; font-weight: 600;">PM</button>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
        <button type="button" class="time-cancel" style="padding: 8px 16px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 4px; font-size: 14px;">Cancel</button>
        <button type="button" class="time-ok" style="padding: 8px 16px; border: 1px solid #188BF6; background: #188BF6; color: white; cursor: pointer; border-radius: 4px; font-size: 14px; font-weight: 600;">OK</button>
      </div>
    `;
    
    // Event listeners
    popover.addEventListener('click', function(e) {
      const btn = e.target;
      
      if (btn.classList.contains('spinner-btn')) {
        const action = btn.dataset.action;
        const [type, direction] = action.split('-');
        
        const valueEl = popover.querySelector(`.spinner-value[data-type="${type}"]`);
        let currentValue = parseInt(valueEl.textContent);
        
        if (type === 'hour') {
          if (direction === 'up') {
            currentValue = currentValue === 12 ? 1 : currentValue + 1;
          } else {
            currentValue = currentValue === 1 ? 12 : currentValue - 1;
          }
          valueEl.textContent = currentValue;
        } else if (type === 'minute') {
          if (direction === 'up') {
            currentValue = currentValue === 45 ? 0 : currentValue + 15;
          } else {
            currentValue = currentValue === 0 ? 45 : currentValue - 15;
          }
          valueEl.textContent = currentValue.toString().padStart(2, '0');
        }
      }
      
      if (btn.classList.contains('period-btn')) {
        const period = btn.dataset.period;
        popover.querySelectorAll('.period-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = '#f8f8f8';
          b.style.color = '#666';
          b.style.borderColor = '#ccc';
        });
        btn.classList.add('active');
        btn.style.background = '#188BF6';
        btn.style.color = 'white';
        btn.style.borderColor = '#188BF6';
      }
      
      if (btn.classList.contains('time-ok')) {
        updateTimeField();
        popover.remove();
      }
      
      if (btn.classList.contains('time-cancel')) {
        popover.remove();
      }
    });
    
    return popover;
  }
  
  function updateSpinners(hour, minute, period) {
    const popover = document.getElementById('time-picker-popover');
    if (!popover) return;
    
    popover.querySelector('.spinner-value[data-type="hour"]').textContent = hour;
    popover.querySelector('.spinner-value[data-type="minute"]').textContent = minute.toString().padStart(2, '0');
    
    popover.querySelectorAll('.period-btn').forEach(btn => {
      if (btn.dataset.period === period) {
        btn.classList.add('active');
        btn.style.background = '#188BF6';
        btn.style.color = 'white';
        btn.style.borderColor = '#188BF6';
      } else {
        btn.classList.remove('active');
        btn.style.background = '#f8f8f8';
        btn.style.color = '#666';
        btn.style.borderColor = '#ccc';
      }
    });
  }
  
  function updateTimeField() {
    const popover = document.getElementById('time-picker-popover');
    if (!popover) return;
    
    const hour = popover.querySelector('.spinner-value[data-type="hour"]').textContent;
    const minute = popover.querySelector('.spinner-value[data-type="minute"]').textContent;
    const period = popover.querySelector('.period-btn.active').dataset.period;
    
    const timeString = `${hour}:${minute} ${period}`;
    
    const timeField = document.querySelector('input[data-q="pickup_time"], input[name="pickup-time"]') ||
                     document.querySelector('input[placeholder*="time" i], input[data-q*="time" i]');
    
    if (timeField) {
      timeField.value = timeString;
      timeField.dispatchEvent(new Event('input', { bubbles: true }));
      timeField.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  function parseTime(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return [null, null];
    
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    return [{ hour, minute }, period];
  }
})();