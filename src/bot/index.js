const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('../config');
const storageService = require('../services/storage.service');
const qrService = require('../services/qr.service');

const bot = new TelegramBot(config.telegram.token, { polling: true });

async function initBot() {
  console.log('Bot is starting...');

  // Handle /start command
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Assalomu alaykum! Menga video yuboring, men uni MinIO-ga yuklayman va sizga QR kod va havola beraman.");
  });

  // Handle video messages
  bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.video.file_id;

    try {
      const waitMsg = await bot.sendMessage(chatId, "Video qabul qilindi. Yuklanmoqda, iltimos kuting...");

      // 1. Get file link from Telegram
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram.token}/${file.file_path}`;

      // 2. Download from TG and upload to MinIO as stream
      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
      });

      const fileName = `video_${Date.now()}_${chatId}.mp4`;
      await storageService.uploadFile(response.data, fileName, msg.video.file_size);

      // 3. Generate presigned URL
      const presignedUrl = await storageService.getPresignedUrl(fileName);

      // 4. Generate QR code
      const qrBuffer = await qrService.generateQRCode(presignedUrl);

      // 5. Send results back
      await bot.deleteMessage(chatId, waitMsg.message_id);
      
      await bot.sendPhoto(chatId, qrBuffer, {
        caption: `Video muvaffaqiyatli yuklandi!\n\nHavola: ${presignedUrl}`
      });

    } catch (err) {
      console.error('Error processing video:', err);
      bot.sendMessage(chatId, "Kechirasiz, videoni qayta ishlashda xatolik yuz berdi.");
    }
  });

  // Handle other messages
  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/') && !msg.video) {
        bot.sendMessage(msg.chat.id, "Iltimos, menga video fayl yuboring.");
    }
  });

  console.log('Bot is ready and listening for videos.');
}

module.exports = {
  initBot
};
