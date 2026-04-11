const { initStorage } = require('./src/services/storage.service');
const { initBot } = require('./src/bot');

async function main() {
  try {
    console.log('Initializing system...');
    
    // Ensure MinIO is ready and bucket exists
    await initStorage();
    
    // Start Telegram Bot
    await initBot();
    
    console.log('System initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize system:', err);
    process.exit(1);
  }
}

main();
