#!/usr/bin/env node

console.log('🦣 Neandoc CLI Test');
console.log('Version: 1.0.0');

// Test basic imports
try {
  console.log('Testing imports...');
  require('./lib/parser');
  console.log('✅ Parser imported');
  
  require('./lib/commentor');
  console.log('✅ Commentor imported');
  
  require('./lib/mcp-client');
  console.log('✅ NeandocAssistant imported');
  
  require('./lib/readme');
  console.log('✅ ReadmeGenerator imported');
  
  console.log('🎉 All imports successful!');
  
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}

process.exit(0);