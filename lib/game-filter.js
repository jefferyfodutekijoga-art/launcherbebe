/**
 * Game Filter Module
 * Контроль доступа к сетевому режиму на основе подписки Telegram
 * 
 * Game Filter позволяет:
 * 1. Блокировать сетевой режим до подтверждения подписки
 * 2. Кэшировать статус подписки локально
 * 3. Периодически проверять актуальность подписки
 */

const Store = require('electron-store');
const TelegramAuth = require('./telegram-auth');

const store = new Store();

const GameFilter = {
  // Статус подписки
  _isSubscribed: false,
  // ID пользователя Telegram
  _telegramUserId: null,
  // Время последней проверки
  _lastCheck: 0,
  // Интервал проверки (24 часа в мс)
  CHECK_INTERVAL: 24 * 60 * 60 * 1000,

  /**
   * Инициализация модуля
   * Загружает сохраненный статус из store
   */
  init() {
    this._isSubscribed = store.get('telegramVerified', false);
    this._telegramUserId = store.get('telegramUserId', null);
    this._lastCheck = store.get('telegramLastCheck', 0);

    console.log('GameFilter initialized:', {
      subscribed: this._isSubscribed,
      userId: this._telegramUserId
    });
  },

  /**
   * Проверка разрешен ли запуск сетевого режима
   * @returns {boolean}
   */
  canStartNetworkMode() {
    // Если не подписан - запрещаем
    if (!this._isSubscribed) {
      return false;
    }

    // Если подписан - проверяем не истекла ли проверка
    const now = Date.now();
    if (now - this._lastCheck > this.CHECK_INTERVAL) {
      // Нужна повторная проверка, но пока разрешаем
      // Проверка будет выполнена асинхронно
      this.refreshSubscriptionStatus();
    }

    return true;
  },

  /**
   * Получение текущего статуса
   * @returns {{verified: boolean, userId: number|null, needsRefresh: boolean}}
   */
  getStatus() {
    const now = Date.now();
    const needsRefresh = now - this._lastCheck > this.CHECK_INTERVAL;

    return {
      verified: this._isSubscribed,
      userId: this._telegramUserId,
      needsRefresh
    };
  },

  /**
   * Верификация кода от Telegram бота
   * @param {string} code - Код верификации
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyCode(code) {
    try {
      const result = await TelegramAuth.verifyCode(code);

      if (result.success && result.subscribed) {
        // Сохраняем статус
        this._isSubscribed = true;
        this._telegramUserId = result.userId;
        this._lastCheck = Date.now();

        store.set('telegramVerified', true);
        store.set('telegramUserId', result.userId);
        store.set('telegramLastCheck', this._lastCheck);

        console.log('GameFilter: User verified:', result.userId);

        return { success: true };
      }

      if (result.success && !result.subscribed) {
        return { success: false, error: 'Вы не подписаны на канал' };
      }

      return { success: false, error: result.error || 'Неверный код' };
    } catch (err) {
      console.error('GameFilter verify error:', err);
      return { success: false, error: 'Ошибка проверки' };
    }
  },

  /**
   * Обновление статуса подписки (фоновая проверка)
   */
  async refreshSubscriptionStatus() {
    if (!this._telegramUserId) {
      return;
    }

    try {
      const result = await TelegramAuth.checkSubscription(this._telegramUserId);

      if (result.subscribed) {
        this._lastCheck = Date.now();
        store.set('telegramLastCheck', this._lastCheck);
        console.log('GameFilter: Subscription refreshed');
      } else {
        // Подписка истекла
        this._isSubscribed = false;
        store.set('telegramVerified', false);
        console.log('GameFilter: Subscription expired');
      }
    } catch (err) {
      console.error('GameFilter refresh error:', err);
      // При ошибке не сбрасываем статус
    }
  },

  /**
   * Сброс верификации (выход)
   */
  reset() {
    this._isSubscribed = false;
    this._telegramUserId = null;
    this._lastCheck = 0;

    store.delete('telegramVerified');
    store.delete('telegramUserId');
    store.delete('telegramLastCheck');

    console.log('GameFilter: Reset');
  },

  /**
   * Получение ссылок для UI
   */
  getLinks() {
    return TelegramAuth.getLinks();
  }
};

module.exports = GameFilter;
