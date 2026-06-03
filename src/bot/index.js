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

  async function handleMedia(msg, media, contentType) {
    const chatId = msg.chat.id;
    const fileId = media.file_id;
    const size = media.file_size;

    try {
      const waitMsg = await bot.sendMessage(chatId, "Fayl qabul qilindi. Yuklanmoqda, iltimos kuting...");

      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram.token}/${file.file_path}`;

      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
      });

      const ext = (file.file_path.split('.').pop() || 'bin').toLowerCase();
      const fileName = `video_${Date.now()}_${chatId}.${ext}`;
      await storageService.uploadFile(response.data, fileName, size, contentType);

      const presignedUrl = await storageService.getPresignedUrl(fileName, contentType);
      const qrBuffer = await qrService.generateQRCode(presignedUrl);

      await bot.deleteMessage(chatId, waitMsg.message_id);
      await bot.sendPhoto(chatId, qrBuffer, {
        caption: `Fayl muvaffaqiyatli yuklandi!\n\nHavola: ${presignedUrl}`
      });
    } catch (err) {
      console.error('Error processing media:', err);
      bot.sendMessage(chatId, "Kechirasiz, faylni qayta ishlashda xatolik yuz berdi.");
    }
  }

  bot.on('video', (msg) => handleMedia(msg, msg.video, msg.video.mime_type || 'video/mp4'));
  bot.on('video_note', (msg) => handleMedia(msg, msg.video_note, 'video/mp4'));
  bot.on('animation', (msg) => handleMedia(msg, msg.animation, msg.animation.mime_type || 'video/mp4'));
  bot.on('document', (msg) => {
    const mime = msg.document.mime_type || 'application/octet-stream';
    handleMedia(msg, msg.document, mime);
  });

  bot.on('message', async (msg) => {
    if (!msg.text) return;

    const urlMatch = msg.text.match(/https?:\/\/[^\s]*\/tg-bot\/([^\s?]+)/i);
    if (urlMatch) {
      const fileName = decodeURIComponent(urlMatch[1]);
      try {
        const contentType = fileName.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';
        const freshUrl = await storageService.getPresignedUrl(fileName, contentType);
        const qrBuffer = await qrService.generateQRCode(freshUrl);
        await bot.sendPhoto(msg.chat.id, qrBuffer, {
          caption: `Yangi havola:\n${freshUrl}`
        });
      } catch (err) {
        console.error('Error refreshing link:', err);
        bot.sendMessage(msg.chat.id, "Havolani yangilashda xatolik.");
      }
      return;
    }

    if (!msg.text.startsWith('/')) {
      bot.sendMessage(msg.chat.id, "Iltimos, menga video yoki eski havolani yuboring.");
    }
  });

  console.log('Bot is ready and listening for videos.');
}

module.exports = {
  initBot
};
