// Flag to track if content script is ready
let isContentScriptReady = false;

// Flag to track if extension is enabled
let isExtensionEnabled = true;

// Function to find the video element
function findVideoElement() {
  const video = document.querySelector('video');
  return video;
}

// Function to handle video playback
function handleVideoPlayback(shouldPlay) {
  if (!isExtensionEnabled) return; // Don't control video if extension is disabled
  
  const video = findVideoElement();
  if (!video) return;

  try {
    if (shouldPlay) {
      if (video.paused && video.readyState >= 2) {
        video.play().catch(error => {
          console.log("Error playing video:", error);
        });
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  } catch (error) {
    console.log("Error handling video playback:", error);
  }
}

// Function to check if video should be playing
function shouldVideoPlay() {
  // Check both document visibility and window focus
  return document.visibilityState === 'visible' && document.hasFocus();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isContentScriptReady) {
    console.log("Content script not ready yet, ignoring message");
    return true;
  }

  if (message.action === "toggleExtension") {
    isExtensionEnabled = message.enabled;
    if (!isExtensionEnabled) {
      // If extension is disabled, ensure video can play
      handleVideoPlayback(true);
    } else {
      // If extension is enabled, apply current state
      handleVideoPlayback(shouldVideoPlay());
    }
    return true;
  }

  if (message.action === "tabStateChanged" && isExtensionEnabled) {
    // Only handle tab state changes if extension is enabled
    handleVideoPlayback(message.isActive && shouldVideoPlay());
  }
  return true;
});

// Function to initialize the content script
function initializeContentScript() {
  try {
    // Mark content script as ready
    isContentScriptReady = true;

    // Handle visibility changes (tab switching, minimizing window)
    document.addEventListener('visibilitychange', () => {
      handleVideoPlayback(shouldVideoPlay());
    });

    // Handle window focus changes (switching applications)
    window.addEventListener('focus', () => {
      handleVideoPlayback(shouldVideoPlay());
    });

    window.addEventListener('blur', () => {
      handleVideoPlayback(false); // Pause when window loses focus
    });

    // Handle dynamic loading of videos
    const observer = new MutationObserver(() => {
      const video = findVideoElement();
      if (video) {
        handleVideoPlayback(shouldVideoPlay());
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    handleVideoPlayback(shouldVideoPlay());

  } catch (error) {
    console.log("Error initializing content script:", error);
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}