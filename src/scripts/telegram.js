/**
 * Telegram Verification UI Module
 * Управление модальным окном верификации Telegram
 */

const TelegramUI = {
  elements: {
    modal: null,
    codeInput: null,
    verifyBtn: null,
    cancelBtn: null,
    errorDiv: null,
    channelLink: null,
    botLink: null
  },

  // Статус верификации
  isVerified: false,
  
  // Флаг обязательной верификации
  mandatoryMode: false,

  async init() {
    // Получаем элементы
    this.elements.modal = document.getElementById('telegramModal');
    this.elements.codeInput = document.getElementById('telegramCode');
    this.elements.verifyBtn = document.getElementById('telegramVerify');
    this.elements.cancelBtn = document.getElementById('telegramCancel');
    this.elements.errorDiv = document.getElementById('telegramError');
    this.elements.channelLink = document.getElementById('openTelegramChannel');
    this.elements.botLink = document.getElementById('openTelegramBot');

    // Проверяем статус при загрузке
    if (window.electronAPI) {
      await this.checkStatus();
      await this.loadLinks();
      this.setupEventListeners();
      
      // Показываем модальное окно при старте, если не верифицирован
      if (!this.isVerified) {
        this.showModal(true); // true = mandatory mode
      }
    }
  },

  /**
   * Загрузка ссылок на канал и бота
   */
  async loadLinks() {
    if (window.electronAPI && window.electronAPI.getTelegramLinks) {
      try {
        const links = await window.electronAPI.getTelegramLinks();
        
        if (this.elements.channelLink) {
          this.elements.channelLink.textContent = '@' + links.channelUsername;
          this.elements.channelLink.dataset.url = links.channel;
        }
        
        if (this.elements.botLink) {
          this.elements.botLink.textContent = '@' + links.botUsername;
          this.elements.botLink.dataset.url = links.bot;
        }
      } catch (e) {
        console.log('Failed to load Telegram links:', e);
      }
    }
  },

  /**
   * Проверка статуса верификации
   */
  async checkStatus() {
    if (window.electronAPI && window.electronAPI.getTelegramStatus) {
      try {
        const status = await window.electronAPI.getTelegramStatus();
        this.isVerified = status.verified;
        
        // Если нужно обновить подписку - делаем это в фоне
        if (status.needsRefresh && status.verified) {
          window.electronAPI.telegramRefresh();
        }
      } catch (e) {
        console.log('Failed to check Telegram status:', e);
      }
    }
  },

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Кнопка верификации
    if (this.elements.verifyBtn) {
      this.elements.verifyBtn.addEventListener('click', () => this.verify());
    }

    // Кнопка отмены - работает только если не обязательная верификация
    if (this.elements.cancelBtn) {
      this.elements.cancelBtn.addEventListener('click', () => {
        if (!this.mandatoryMode) {
          this.hideModal();
        }
      });
    }

    // Клик вне модального окна - работает только если не обязательная верификация
    if (this.elements.modal) {
      this.elements.modal.addEventListener('click', (e) => {
        if (e.target === this.elements.modal && !this.mandatoryMode) {
          this.hideModal();
        }
      });
    }
    
    // Блокируем Escape если обязательная верификация
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mandatoryMode && this.elements.modal?.classList.contains('open')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Ввод кода - Enter для подтверждения
    if (this.elements.codeInput) {
      this.elements.codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.verify();
        }
      });

      // Очистка ошибки при вводе
      this.elements.codeInput.addEventListener('input', () => {
        this.clearError();
      });
    }

    // Ссылка на канал
    if (this.elements.channelLink) {
      this.elements.channelLink.addEventListener('click', (e) => {
        e.preventDefault();
        const url = this.elements.channelLink.dataset.url;
        if (url && window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(url);
        }
      });
    }

    // Ссылка на бота
    if (this.elements.botLink) {
      this.elements.botLink.addEventListener('click', (e) => {
        e.preventDefault();
        const url = this.elements.botLink.dataset.url;
        if (url && window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(url);
        }
      });
    }

    // Слушаем событие от main процесса для показа модального окна
    if (window.electronAPI && window.electronAPI.onShowTelegramModal) {
      window.electronAPI.onShowTelegramModal(() => {
        this.showModal();
      });
    }
    
    // Слушаем событие отзыва доступа (когда пользователь выходит из канала)
    if (window.electronAPI && window.electronAPI.onTelegramAccessRevoked) {
      window.electronAPI.onTelegramAccessRevoked(() => {
        this.revokeAccess();
      });
    }
  },

  /**
   * Верификация кода
   */
  async verify() {
    const code = this.elements.codeInput?.value.trim();
    
    if (!code) {
      this.showError('Введите код верификации');
      return;
    }

    // Блокируем кнопку
    if (this.elements.verifyBtn) {
      this.elements.verifyBtn.disabled = true;
      this.elements.verifyBtn.textContent = 'Проверка...';
    }

    this.clearError();

    try {
      const result = await window.electronAPI.telegramVerify(code);

      if (result.success) {
        this.isVerified = true;
        this.mandatoryMode = false; // Выключаем обязательный режим после успеха
        Toast.show('Доступ подтвержден!', 'success');
        this.hideModal();
        
        // Очищаем поле
        if (this.elements.codeInput) {
          this.elements.codeInput.value = '';
        }
      } else {
        this.showError(result.error || 'Неверный код или вы не подписаны на канал');
      }
    } catch (err) {
      console.error('Verification error:', err);
      this.showError('Ошибка проверки. Попробуйте позже.');
    }

    // Разблокируем кнопку
    if (this.elements.verifyBtn) {
      this.elements.verifyBtn.disabled = false;
      this.elements.verifyBtn.textContent = 'Подтвердить';
    }
  },

  /**
   * Показать ошибку
   */
  showError(message) {
    if (this.elements.errorDiv) {
      this.elements.errorDiv.textContent = message;
      this.elements.errorDiv.classList.add('visible');
    }
  },

  /**
   * Очистить ошибку
   */
  clearError() {
    if (this.elements.errorDiv) {
      this.elements.errorDiv.textContent = '';
      this.elements.errorDiv.classList.remove('visible');
    }
  },

  /**
   * Показать модальное окно
   * @param {boolean} mandatory - Обязательная верификация (нельзя закрыть)
   */
  showModal(mandatory = false) {
    this.mandatoryMode = mandatory;
    
    if (this.elements.modal) {
      this.elements.modal.classList.add('open');
      
      // Скрываем/показываем кнопку "Позже" в зависимости от режима
      if (this.elements.cancelBtn) {
        this.elements.cancelBtn.style.display = mandatory ? 'none' : 'block';
      }
      
      // Фокус на поле ввода
      setTimeout(() => {
        this.elements.codeInput?.focus();
      }, 100);
    }
  },

  /**
   * Скрыть модальное окно
   * Не закрывается если включен обязательный режим
   */
  hideModal() {
    // Блокируем закрытие в обязательном режиме
    if (this.mandatoryMode) {
      console.log('Cannot close modal in mandatory mode');
      return;
    }
    
    if (this.elements.modal) {
      this.elements.modal.classList.remove('open');
    }
  },

  /**
   * Принудительно показать модальное окно (для вызова из других модулей)
   */
  requireVerification() {
    if (!this.isVerified) {
      this.showModal(true); // Показываем в обязательном режиме
      return false;
    }
    return true;
  },
  
  /**
   * Обработчик отзыва доступа (когда пользователь выходит из канала)
   */
  revokeAccess() {
    this.isVerified = false;
    this.showModal(true); // Показываем модальное окно в обязательном режиме
    Toast.show('Доступ отозван. Пожалуйста, подтвердите подписку.', 'error');
  }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => TelegramUI.init());
