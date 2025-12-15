/**
 * Централизованная конфигурация лаунчера
 * Все настройки Telegram и API в одном месте
 */

module.exports = {
  // Telegram настройки
  telegram: {
    // Username бота (без @)
    botUsername: 'robbob_verify_bot',
    // Username канала (без @)
    channelUsername: 'robbob_channel',
    // Числовой ID канала (можно получить через @userinfobot)
    channelId: '-1001234567890',
    // URL API для проверки подписки (Cloudflare Worker или свой сервер)
    apiUrl: 'https://robbob-bot.your-domain.workers.dev',
    // Ссылки для пользователя
    botLink: 'https://t.me/robbob_verify_bot',
    channelLink: 'https://t.me/robbob_channel'
  },

  // Game Filter настройки
  gameFilter: {
    // Включен ли game filter по умолчанию
    enabled: true,
    // Список игровых доменов для исключения из обработки
    gameDomains: [
      'roblox.com',
      '*.roblox.com',
      'rbxcdn.com',
      '*.rbxcdn.com'
    ]
  },

  // Версия лаунчера
  version: require('../package.json').version,

  // URL для обновлений
  updates: {
    versionUrl: 'https://your-server.com/api/launcher/version.json',
    downloadUrl: 'https://your-server.com/files/RobBob-Setup.exe'
  }
};
