# RobBob Telegram Bot

Telegram бот для верификации подписки на канал.

## Настройка

### 1. Создание Telegram бота

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям, задайте имя и username бота
4. Скопируйте полученный токен

### 2. Создание канала

1. Создайте канал в Telegram
2. Добавьте бота администратором канала (нужны права на просмотр участников)
3. Получите ID канала через [@userinfobot](https://t.me/userinfobot) или используйте @username

### 3. Деплой на Cloudflare Workers

1. Зарегистрируйтесь на [Cloudflare](https://dash.cloudflare.com/)
2. Перейдите в Workers & Pages
3. Создайте новый Worker
4. Вставьте код из `worker.js`
5. Замените следующие значения:
   - `BOT_TOKEN` - токен от BotFather
   - `CHANNEL_ID` - @username или числовой ID канала
   - `SECRET_KEY` - любая секретная строка для генерации кодов
6. Сохраните и задеплойте

### 4. Установка Webhook

После деплоя установите webhook, открыв в браузере:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<your-worker>.workers.dev/webhook
```

Замените:
- `<BOT_TOKEN>` - ваш токен
- `<your-worker>` - имя вашего Worker

### 5. Настройка лаунчера

Откройте `lib/config.js` и обновите:

```javascript
telegram: {
  botUsername: 'your_bot_username',
  channelUsername: 'your_channel_username',
  channelId: '-1001234567890',
  apiUrl: 'https://your-worker.workers.dev',
  botLink: 'https://t.me/your_bot_username',
  channelLink: 'https://t.me/your_channel_username'
}
```

## API Endpoints

### POST /webhook
Webhook для получения обновлений от Telegram.

### POST /api/verify
Проверка кода верификации.

Request:
```json
{
  "code": "XXXXXXXX-123456789"
}
```

Response:
```json
{
  "success": true,
  "subscribed": true,
  "userId": 123456789
}
```

### POST /api/check-subscription
Прямая проверка подписки по userId.

Request:
```json
{
  "userId": 123456789
}
```

Response:
```json
{
  "subscribed": true,
  "userId": 123456789
}
```

## Команды бота

- `/start` - Приветствие и инструкции
- `/verify` - Получить код верификации
- `/status` - Проверить статус подписки
- `/help` - Помощь

## Безопасность

- Токен бота хранится только на сервере
- Коды верификации действительны 10-20 минут
- Все API запросы защищены CORS
