/**
 * Встроенные конфигурации режимов сетевого подключения
 * Эти конфигурации оптимизированы для стабильного соединения
 */

const fs = require('fs');
const path = require('path');

// Проверка включен ли Game Filter (для поддержки игр типа Roblox)
function isGameFilterEnabled(binPath) {
  try {
    const flagFile = path.join(binPath, 'game_filter.enabled');
    return fs.existsSync(flagFile);
  } catch (e) {
    return true; // По умолчанию включен
  }
}

// Получить диапазон UDP портов в зависимости от Game Filter
function getGameFilterPorts(binPath) {
  if (isGameFilterEnabled(binPath)) {
    return '1024-65535'; // Полный диапазон для игр (Roblox и др.)
  }
  return '12'; // Минимальный диапазон
}

// Функция для генерации аргументов с путями
function generateArgs(config, binPath, listsPath, gameFilterPorts) {
  const args = [];
  
  for (const arg of config) {
    let processed = arg;
    // Заменяем плейсхолдеры на реальные пути
    processed = processed.replace(/{BIN}/g, binPath + '\\');
    processed = processed.replace(/{LISTS}/g, listsPath + '\\');
    // Заменяем плейсхолдер Game Filter на актуальный диапазон портов
    processed = processed.replace(/{GAME_FILTER}/g, gameFilterPorts);
    args.push(processed);
  }
  
  return args;
}

// Базовые конфигурации для всех режимов
// {BIN} и {LISTS} будут заменены на реальные пути при запуске
const BYPASS_CONFIGS = {
  'general': {
    name: 'Вариант 1',
    description: 'Стандартный метод подключения',
    args: [
      '--wf-tcp=80,443,2053,2083,2087,2096,8443',
      '--wf-udp={GAME_FILTER}',
      // QUIC трафик
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      // Discord/STUN
      '--filter-udp=19294-19344,50000-50100',
      '--filter-l7=discord,stun',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      // Discord media
      '--filter-tcp=2053,2083,2087,2096,8443',
      '--hostlist-domains=discord.media',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=568',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_4pda_to.bin',
      '--new',
      // Google
      '--filter-tcp=443',
      '--hostlist={LISTS}list-google.txt',
      '--ip-id=zero',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=681',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      // General TCP
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=568',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_4pda_to.bin',
      '--new',
      // QUIC by IP
      '--filter-udp=443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      // TCP by IP
      '--filter-tcp=80,443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=568',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_4pda_to.bin'
    ]
  },

  'ALT': {
    name: 'Вариант 2',
    description: 'Альтернативный метод подключения',
    args: [
      '--wf-tcp=80,443,2053,2083,2087,2096,8443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-udp=19294-19344,50000-50100',
      '--filter-l7=discord,stun',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=2053,2083,2087,2096,8443',
      '--hostlist-domains=discord.media',
      '--dpi-desync=fake,fakedsplit',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fooling=ts',
      '--dpi-desync-fakedsplit-pattern=0x00',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=443',
      '--hostlist={LISTS}list-google.txt',
      '--ip-id=zero',
      '--dpi-desync=fake,fakedsplit',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fooling=ts',
      '--dpi-desync-fakedsplit-pattern=0x00',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake,fakedsplit',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fooling=ts',
      '--dpi-desync-fakedsplit-pattern=0x00',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-udp=443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake,fakedsplit',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fooling=ts',
      '--dpi-desync-fakedsplit-pattern=0x00',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin'
    ]
  },

  'ALT2': {
    name: 'Вариант 3',
    description: 'Расширенный метод подключения',
    args: [
      '--wf-tcp=80,443,2053,2083,2087,2096,8443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-udp=19294-19344,50000-50100',
      '--filter-l7=discord,stun',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=2053,2083,2087,2096,8443',
      '--hostlist-domains=discord.media',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=652',
      '--dpi-desync-split-pos=2',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=443',
      '--hostlist={LISTS}list-google.txt',
      '--ip-id=zero',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=652',
      '--dpi-desync-split-pos=2',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=652',
      '--dpi-desync-split-pos=2',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-udp=443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=multisplit',
      '--dpi-desync-split-seqovl=652',
      '--dpi-desync-split-pos=2',
      '--dpi-desync-split-seqovl-pattern={BIN}tls_clienthello_www_google_com.bin'
    ]
  },

  'ALT3': {
    name: 'Вариант 4',
    description: 'Адаптивный метод подключения',
    args: [
      '--wf-tcp=80,443,2053,2083,2087,2096,8443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-udp=19294-19344,50000-50100',
      '--filter-l7=discord,stun',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=2053,2083,2087,2096,8443',
      '--hostlist-domains=discord.media',
      '--dpi-desync=fakedsplit',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-autottl',
      '--dpi-desync-fooling=badseq',
      '--dpi-desync-repeats=8',
      '--new',
      '--filter-tcp=443',
      '--hostlist={LISTS}list-google.txt',
      '--ip-id=zero',
      '--dpi-desync=fakedsplit',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-autottl',
      '--dpi-desync-fooling=badseq',
      '--dpi-desync-repeats=8',
      '--new',
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fakedsplit',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-autottl',
      '--dpi-desync-fooling=badseq',
      '--dpi-desync-repeats=8',
      '--new',
      '--filter-udp=443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fakedsplit',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-autottl',
      '--dpi-desync-fooling=badseq',
      '--dpi-desync-repeats=8'
    ]
  },

  'ALT4': {
    name: 'Вариант 5',
    description: 'Синхронный метод подключения',
    args: [
      '--wf-tcp=80,443,2053,2083,2087,2096,8443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-udp=19294-19344,50000-50100',
      '--filter-l7=discord,stun',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=2053,2083,2087,2096,8443',
      '--hostlist-domains=discord.media',
      '--dpi-desync=syndata',
      '--dpi-desync-fake-syndata={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=443',
      '--hostlist={LISTS}list-google.txt',
      '--ip-id=zero',
      '--dpi-desync=syndata',
      '--dpi-desync-fake-syndata={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=syndata',
      '--dpi-desync-fake-syndata={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-udp=443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=syndata',
      '--dpi-desync-fake-syndata={BIN}tls_clienthello_www_google_com.bin'
    ]
  },

  'ALT5': {
    name: 'Вариант 6',
    description: 'Упрощённый метод подключения',
    args: [
      '--wf-tcp=80,443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-udp=50000-65535',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--dpi-desync=fake,split2',
      '--dpi-desync-split-seqovl=1',
      '--dpi-desync-split-pos=1',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin'
    ]
  },

  'FAKE_TLS': {
    name: 'Вариант 7',
    description: 'Защищённый метод подключения',
    args: [
      '--wf-tcp=80,443,2053,2083,2087,2096,8443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-udp=19294-19344,50000-50100',
      '--filter-l7=discord,stun',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=2053,2083,2087,2096,8443',
      '--hostlist-domains=discord.media',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=443',
      '--hostlist={LISTS}list-google.txt',
      '--ip-id=zero',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--hostlist={LISTS}list-general.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin',
      '--new',
      '--filter-udp=443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-quic={BIN}quic_initial_www_google_com.bin',
      '--new',
      '--filter-tcp=80,443',
      '--ipset={LISTS}ipset-all.txt',
      '--hostlist-exclude={LISTS}list-exclude.txt',
      '--ipset-exclude={LISTS}ipset-exclude.txt',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--dpi-desync-fake-tls={BIN}tls_clienthello_www_google_com.bin'
    ]
  },

  'SIMPLE': {
    name: 'Вариант 8',
    description: 'Базовый метод подключения',
    args: [
      '--wf-tcp=80,443',
      '--wf-udp={GAME_FILTER}',
      '--filter-udp=443',
      '--dpi-desync=fake',
      '--dpi-desync-repeats=6',
      '--new',
      '--filter-tcp=80,443',
      '--dpi-desync=fake,split2',
      '--dpi-desync-split-seqovl=1',
      '--dpi-desync-split-pos=1'
    ]
  }
};

// Получить конфигурацию для режима
function getBypassConfig(mode, binPath, listsPath) {
  const config = BYPASS_CONFIGS[mode] || BYPASS_CONFIGS['general'];
  // Получаем диапазон UDP портов в зависимости от Game Filter
  const gameFilterPorts = getGameFilterPorts(binPath);
  return {
    name: config.name,
    description: config.description,
    args: generateArgs(config.args, binPath, listsPath, gameFilterPorts)
  };
}

// Получить список доступных режимов
function getAvailableModes() {
  return Object.entries(BYPASS_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description
  }));
}

module.exports = {
  BYPASS_CONFIGS,
  getBypassConfig,
  getAvailableModes,
  generateArgs,
  isGameFilterEnabled,
  getGameFilterPorts
};
