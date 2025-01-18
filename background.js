// Function to safely send message to a tab
async function sendMessageToTab(tabId, message) {
    try {
      // Check if the tab exists and is ready
      const tab = await chrome.tabs.get(tabId);
      if (chrome.runtime.lastError || !tab) {
        console.log(`Tab ${tabId} not ready or doesn't exist:`, chrome.runtime.lastError);
        return;
      }
  
      // Try to send the message
      await chrome.tabs.sendMessage(tabId, message).catch(error => {
        // Ignore errors about receiving end not existing
        if (!error.message.includes("Receiving end does not exist")) {
          console.log(`Error sending message to tab ${tabId}:`, error);
        }
      });
    } catch (error) {
      console.log(`Error processing tab ${tabId}:`, error);
    }
  }
  
  // Listen for tab changes
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      // Get all YouTube tabs
      const tabs = await chrome.tabs.query({url: "*://*.youtube.com/*"});
      
      // Send message to each YouTube tab
      for (const tab of tabs) {
        await sendMessageToTab(tab.id, {
          action: "tabStateChanged",
          isActive: tab.id === activeInfo.tabId
        });
      }
    } catch (error) {
      console.log("Error in tab activation handler:", error);
    }
  });
  
  // Listen for tab updates (URL changes)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
      if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
        // Wait a short moment to ensure content script is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await sendMessageToTab(tabId, {
          action: "tabStateChanged",
          isActive: true
        });
      }
    } catch (error) {
      console.log("Error in tab update handler:", error);
    }
  });