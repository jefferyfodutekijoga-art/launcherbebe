/**
 * RobBob Telegram Bot - Cloudflare Worker
 * 
 * Этот бот проверяет подписку пользователей на канал
 * и выдает коды верификации для лаунчера
 * 
 * Деплой:
 * 1. Создайте Cloudflare Worker
 * 2. Замените BOT_TOKEN и CHANNEL_ID
 * 3. Установите webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-worker.workers.dev/webhook
 */

// ============================================
// КОНФИГУРАЦИЯ - ЗАМЕНИТЕ НА СВОИ ЗНАЧЕНИЯ
// ============================================
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const CHANNEL_ID = '@robbob_channel';  // или числовой ID: -1001234567890
const SECRET_KEY = 'your-secret-key-for-codes';  // Секретный ключ для генерации кодов

// ============================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================

/**
 * Отправка сообщения пользователю
 */
async function sendMessage(chatId, text, options = {}) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      ...options
    })
  });
  return response.json();
}

/**
 * Проверка членства пользователя в канале
 */
async function checkChannelMembership(userId) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`
    );
    const data = await response.json();

    if (data.ok) {
      const status = data.result.status;
      // member, administrator, creator - подписан
      // left, kicked - не подписан
      return ['creator', 'administrator', 'member'].includes(status);
    }
    return false;
  } catch (err) {
    console.error('Error checking membership:', err);
    return false;
  }
}

/**
 * Генерация кода верификации
 * Код действителен 10 минут
 */
function generateVerificationCode(userId) {
  const timestamp = Math.floor(Date.now() / 1000);
  // Округляем до 10-минутных интервалов для валидации
  const timeSlot = Math.floor(timestamp / 600);
  const data = `${userId}:${timeSlot}:${SECRET_KEY}`;
  
  // Простой хеш (в продакшене лучше использовать crypto)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Преобразуем в код из 8 символов
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
  return `${code}-${userId}`;
}

/**
 * Валидация кода верификации
 */
function validateVerificationCode(code) {
  const parts = code.split('-');
  if (parts.length !== 2) return { valid: false };
  
  const [codeHash, userIdStr] = parts;
  const userId = parseInt(userIdStr, 10);
  
  if (isNaN(userId)) return { valid: false };
  
  // Проверяем текущий и предыдущий временной слот (20 минут валидности)
  const timestamp = Math.floor(Date.now() / 1000);
  const currentSlot = Math.floor(timestamp / 600);
  
  for (let slot = currentSlot; slot >= currentSlot - 1; slot--) {
    const data = `${userId}:${slot}:${SECRET_KEY}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const expectedCode = Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
    
    if (expectedCode === codeHash) {
      return { valid: true, userId };
    }
  }
  
  return { valid: false };
}

/**
 * Обработка webhook от Telegram
 */
async function handleTelegramWebhook(request) {
  try {
    const update = await request.json();

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';
      const userId = update.message.from.id;
      const firstName = update.message.from.first_name || 'пользователь';

      // Команда /start
      if (text === '/start') {
        await sendMessage(chatId, `Привет, <b>${firstName}</b>! 👋

Я бот для верификации доступа к RobBob Launcher.

<b>Как получить доступ:</b>
1️⃣ Подпишитесь на канал ${CHANNEL_ID}
2️⃣ Нажмите /verify для получения кода
3️⃣ Введите код в лаунчере

<b>Команды:</b>
/verify - получить код верификации
/status - проверить статус подписки
/help - помощь`);
        return new Response('OK');
      }

      // Команда /verify
      if (text === '/verify') {
        const isMember = await checkChannelMembership(userId);

        if (isMember) {
          const code = generateVerificationCode(userId);
          await sendMessage(chatId, `✅ <b>Вы подписаны на канал!</b>

Ваш код верификации:
<code>${code}</code>

📋 Нажмите на код чтобы скопировать
⏱ Код действителен 10 минут

Введите этот код в лаунчере RobBob.`);
        } else {
          await sendMessage(chatId, `❌ <b>Вы не подписаны на канал!</b>

Подпишитесь на ${CHANNEL_ID} и попробуйте снова.`, {
            reply_markup: JSON.stringify({
              inline_keyboard: [[
                { text: '📢 Подписаться на канал', url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }
              ]]
            })
          });
        }
        return new Response('OK');
      }

      // Команда /status
      if (text === '/status') {
        const isMember = await checkChannelMembership(userId);

        if (isMember) {
          await sendMessage(chatId, `✅ <b>Статус: Подписан</b>

Вы подписаны на канал ${CHANNEL_ID}.
Используйте /verify для получения кода.`);
        } else {
          await sendMessage(chatId, `❌ <b>Статус: Не подписан</b>

Подпишитесь на ${CHANNEL_ID} для получения доступа.`, {
            reply_markup: JSON.stringify({
              inline_keyboard: [[
                { text: '📢 Подписаться', url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }
              ]]
            })
          });
        }
        return new Response('OK');
      }

      // Команда /help
      if (text === '/help') {
        await sendMessage(chatId, `<b>📚 Помощь</b>

<b>RobBob Launcher</b> - лаунчер для оптимизации сетевого соединения с Roblox.

<b>Для получения доступа:</b>
1. Подпишитесь на канал ${CHANNEL_ID}
2. Используйте команду /verify
3. Скопируйте код и вставьте в лаунчер

<b>Проблемы?</b>
Напишите в поддержку канала.`);
        return new Response('OK');
      }
    }

    return new Response('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Error', { status: 500 });
  }
}

/**
 * API: Проверка кода из лаунчера
 */
async function handleVerifyCode(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return jsonResponse({ success: false, error: 'Code is required' });
    }

    const validation = validateVerificationCode(code);

    if (!validation.valid) {
      return jsonResponse({ success: false, error: 'Invalid or expired code' });
    }

    // Дополнительно проверяем подписку
    const isMember = await checkChannelMembership(validation.userId);

    return jsonResponse({
      success: true,
      subscribed: isMember,
      userId: validation.userId
    });
  } catch (err) {
    console.error('Verify error:', err);
    return jsonResponse({ success: false, error: 'Server error' });
  }
}

/**
 * API: Прямая проверка подписки по userId
 */
async function handleCheckSubscription(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return jsonResponse({ subscribed: false, error: 'userId is required' });
    }

    const isMember = await checkChannelMembership(userId);

    return jsonResponse({ subscribed: isMember, userId });
  } catch (err) {
    console.error('Check subscription error:', err);
    return jsonResponse({ subscribed: false, error: 'Server error' });
  }
}

/**
 * Вспомогательная функция для JSON ответов
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

/**
 * Главный обработчик запросов
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Telegram webhook
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request);
    }

    // API: Проверка кода
    if (url.pathname === '/api/verify' && request.method === 'POST') {
      return handleVerifyCode(request);
    }

    // API: Проверка подписки
    if (url.pathname === '/api/check-subscription' && request.method === 'POST') {
      return handleCheckSubscription(request);
    }

    // Главная страница
    if (url.pathname === '/' || url.pathname === '') {
      return new Response('RobBob Verification Bot API v1.0', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
