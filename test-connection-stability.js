/**
 * Connection Stability Test Script
 * Run this in the browser console to monitor connection status changes
 * and detect if there's still cycling between connected/disconnected states.
 */

(() => {
  let statusChangeCount = 0;
  let lastStatus = null;
  let statusHistory = [];
  let startTime = Date.now();
  
  // Monitor the connection status element
  function monitorConnectionStatus() {
    const statusElement = document.querySelector('.connection-status');
    if (!statusElement) {
      console.log('❌ Connection status element not found. Make sure you are on the video room page.');
      return;
    }
    
    console.log('🔍 Starting connection stability monitoring...');
    console.log('📝 This will track status changes and alert if cycling is detected.');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const currentStatus = statusElement.textContent.trim();
          const timestamp = Date.now();
          const elapsed = Math.round((timestamp - startTime) / 1000);
          
          if (currentStatus !== lastStatus) {
            statusChangeCount++;
            statusHistory.push({
              status: currentStatus,
              timestamp,
              elapsed: `${elapsed}s`
            });
            
            console.log(`🔄 [${elapsed}s] Status changed to: "${currentStatus}"`);
            
            // Keep only last 10 changes
            if (statusHistory.length > 10) {
              statusHistory.shift();
            }
            
            // Detect rapid cycling (more than 5 changes in 30 seconds)
            const recentChanges = statusHistory.filter(h => 
              timestamp - h.timestamp < 30000
            ).length;
            
            if (recentChanges > 5) {
              console.warn('⚠️ RAPID CYCLING DETECTED! More than 5 status changes in 30 seconds.');
              console.warn('📊 Recent changes:', statusHistory.slice(-5));
            }
            
            // Detect connected/disconnected cycling
            const lastFive = statusHistory.slice(-5).map(h => h.status);
            const hasConnected = lastFive.some(s => s.includes('Connected'));
            const hasDisconnected = lastFive.some(s => s.includes('Disconnected'));
            
            if (hasConnected && hasDisconnected && recentChanges >= 3) {
              console.error('🚨 CONNECTION CYCLING DETECTED!');
              console.error('📊 Status history:', statusHistory.slice(-5));
            }
            
            lastStatus = currentStatus;
          }
        }
      });
    });
    
    // Observe changes to the status element and its children
    observer.observe(statusElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Initial status
    const initialStatus = statusElement.textContent.trim();
    console.log(`📊 Initial status: "${initialStatus}"`);
    lastStatus = initialStatus;
    statusHistory.push({
      status: initialStatus,
      timestamp: Date.now(),
      elapsed: '0s'
    });
    
    // Report function
    window.connectionStabilityReport = () => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log('\n📈 CONNECTION STABILITY REPORT');
      console.log('================================');
      console.log(`⏱️  Monitoring duration: ${elapsed} seconds`);
      console.log(`🔄 Total status changes: ${statusChangeCount}`);
      console.log(`📊 Current status: "${lastStatus}"`);
      console.log('\n📝 Status History (last 10):');
      statusHistory.forEach((entry, i) => {
        const icon = i === statusHistory.length - 1 ? '→' : ' ';
        console.log(`  ${icon} [${entry.elapsed}] ${entry.status}`);
      });
      
      // Analysis
      if (statusChangeCount === 0) {
        console.log('\n✅ EXCELLENT: No status changes detected - very stable connection!');
      } else if (statusChangeCount <= 2) {
        console.log('\n✅ GOOD: Minimal status changes - acceptable stability.');
      } else if (statusChangeCount <= 5) {
        console.log('\n⚠️  MODERATE: Some status changes - monitor for patterns.');
      } else {
        console.log('\n❌ HIGH: Many status changes - potential instability detected.');
      }
      
      return {
        duration: elapsed,
        changes: statusChangeCount,
        currentStatus: lastStatus,
        history: statusHistory.slice()
      };
    };
    
    console.log('\n💡 Commands available:');
    console.log('  - connectionStabilityReport() - Show stability report');
    console.log('  - To stop monitoring: refresh the page');
    
    // Auto-report every 60 seconds
    setInterval(() => {
      console.log('\n⏰ Auto-report (every 60s):');
      window.connectionStabilityReport();
    }, 60000);
  }
  
  // Wait for page to load if necessary
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorConnectionStatus);
  } else {
    monitorConnectionStatus();
  }
})();