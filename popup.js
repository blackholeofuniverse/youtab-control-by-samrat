document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('status');
  
    // Load saved state
    chrome.storage.local.get(['enabled'], function(result) {
      toggleSwitch.checked = result.enabled !== false; // Default to true if undefined
      updateStatus(toggleSwitch.checked);
    });
  
    // Handle toggle changes
    toggleSwitch.addEventListener('change', function() {
      const isEnabled = toggleSwitch.checked;
      
      // Save state
      chrome.storage.local.set({
        enabled: isEnabled
      });
  
      // Update status text
      updateStatus(isEnabled);
  
      // Notify all YouTube tabs about the state change
      chrome.tabs.query({url: "*://*.youtube.com/*"}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {
            action: "toggleExtension",
            enabled: isEnabled
          });
        });
      });
    });
  
    function updateStatus(enabled) {
      statusText.textContent = enabled ? 'Extension is active' : 'Extension is disabled';
      statusText.style.backgroundColor = enabled ? '#e8f5e9' : '#f0f0f0';
      statusText.style.color = enabled ? '#2e7d32' : '#666';
    }
  });