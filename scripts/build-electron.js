const { build } = require('vite');

async function buildElectron() {
  console.log('🏗️  Building React app...');
  
  // Build the React app first
  await build();
  
  console.log('✅ React app built successfully!');
  console.log('🚀 Ready for Electron Builder...');
}

buildElectron();