/**
 * React Render Performance Debugger
 * 
 * This script helps identify what's causing excessive re-renders in React components.
 * Run this in the browser console to monitor render frequency and identify problematic components.
 */

(() => {
  let renderCounts = {};
  let lastRenderTimes = {};
  let renderIntervals = {};
  
  // Override React's render method to track renders
  function trackReactRenders() {
    // This is a simplified approach - for more detailed tracking, you'd need React DevTools Profiler
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // New nodes added to DOM - likely a render
          const now = Date.now();
          const component = 'VideoRoom'; // We know this is the problematic component
          
          if (!renderCounts[component]) {
            renderCounts[component] = 0;
            renderIntervals[component] = [];
          }
          
          renderCounts[component]++;
          
          if (lastRenderTimes[component]) {
            const interval = now - lastRenderTimes[component];
            renderIntervals[component].push(interval);
            
            // Keep only last 20 intervals
            if (renderIntervals[component].length > 20) {
              renderIntervals[component].shift();
            }
            
            // Warn if rendering too frequently
            if (interval < 50) { // Less than 50ms between renders
              console.warn(`🚨 RAPID RENDER: ${component} rendered again after only ${interval}ms`);
            }
          }
          
          lastRenderTimes[component] = now;
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🔍 Render tracking started. Watch for rapid render warnings.');
    return observer;
  }
  
  // Monitor specific state changes that might cause re-renders
  function monitorStateChanges() {
    const stateLog = [];
    let lastLogTime = 0;
    
    // Hook into common state change patterns
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      const message = args.join(' ');
      const now = Date.now();
      
      // Look for state-related log messages
      if (message.includes('useEffect') || 
          message.includes('State changes') || 
          message.includes('Connection status') ||
          message.includes('Socket') ||
          message.includes('VideoRoom')) {
        
        stateLog.push({ message, timestamp: now });
        
        // Keep only last 50 logs
        if (stateLog.length > 50) {
          stateLog.shift();
        }
        
        // Check for rapid state changes
        const recentLogs = stateLog.filter(log => now - log.timestamp < 1000);
        if (recentLogs.length > 10) {
          console.warn('🚨 RAPID STATE CHANGES:', recentLogs.length, 'changes in last 1 second');
        }
      }
      
      originalConsoleLog.apply(console, args);
    };
  }
  
  // Performance monitoring
  function monitorPerformance() {
    let frameCount = 0;
    let startTime = Date.now();
    
    function countFrames() {
      frameCount++;
      
      if (frameCount % 60 === 0) { // Every 60 frames
        const elapsed = Date.now() - startTime;
        const fps = Math.round((frameCount * 1000) / elapsed);
        
        if (fps < 30) {
          console.warn(`🐌 LOW FPS: ${fps} (target: 60fps)`);
        }
        
        // Reset counters
        frameCount = 0;
        startTime = Date.now();
      }
      
      requestAnimationFrame(countFrames);
    }
    
    requestAnimationFrame(countFrames);
    console.log('📊 FPS monitoring started');
  }
  
  // Main debugging interface
  window.debugRenders = {
    start() {
      console.log('🔬 Starting render debugging...');
      const observer = trackReactRenders();
      monitorStateChanges();
      monitorPerformance();
      
      this.observer = observer;
      this.startTime = Date.now();
    },
    
    stop() {
      if (this.observer) {
        this.observer.disconnect();
        console.log('⏹️ Render debugging stopped');
      }
    },
    
    report() {
      const elapsed = Math.round((Date.now() - this.startTime) / 1000);
      console.log('\n📈 RENDER PERFORMANCE REPORT');
      console.log('==============================');
      console.log(`Duration: ${elapsed} seconds`);
      
      Object.entries(renderCounts).forEach(([component, count]) => {
        const avgInterval = renderIntervals[component] 
          ? Math.round(renderIntervals[component].reduce((a, b) => a + b, 0) / renderIntervals[component].length)
          : 0;
        
        console.log(`${component}: ${count} renders (avg ${avgInterval}ms between renders)`);
        
        if (avgInterval < 100) {
          console.warn(`  ⚠️ ${component} is rendering very frequently!`);
        }
      });
      
      return { renderCounts, renderIntervals };
    },
    
    // Check for specific React performance issues
    checkReactIssues() {
      console.log('\n🔍 CHECKING FOR COMMON REACT ISSUES...');
      
      // Check for inline objects in JSX
      const inlineObjectsFound = document.querySelectorAll('[style]').length;
      if (inlineObjectsFound > 10) {
        console.warn(`⚠️ Found ${inlineObjectsFound} inline style objects - these can cause re-renders`);
      }
      
      // Check for anonymous functions in JSX
      console.log('💡 Check your JSX for:');
      console.log('  - Anonymous functions: onClick={() => ...}');
      console.log('  - Inline objects: style={{...}}');
      console.log('  - Missing keys in lists');
      console.log('  - useCallback/useMemo missing from expensive operations');
    }
  };
  
  // Auto-start monitoring
  window.debugRenders.start();
  
  console.log('\n🛠️ RENDER DEBUG TOOLS LOADED');
  console.log('Commands:');
  console.log('  debugRenders.report() - Show performance report');
  console.log('  debugRenders.checkReactIssues() - Check for common issues');
  console.log('  debugRenders.stop() - Stop monitoring');
  
  // Auto-report every 10 seconds
  setInterval(() => {
    const report = window.debugRenders.report();
    const totalRenders = Object.values(report.renderCounts).reduce((a, b) => a + b, 0);
    
    if (totalRenders > 100) {
      console.error(`🚨 EXCESSIVE RENDERS DETECTED: ${totalRenders} renders in last 10s`);
      window.debugRenders.checkReactIssues();
    }
  }, 10000);
  
})();