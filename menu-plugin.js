(function () {
    'use strict';

    // Включаем TV‑режим (как делают другие hotkeys/аниме плагины)
    if (Lampa && Lampa.Platform && typeof Lampa.Platform.tv === 'function') {
        Lampa.Platform.tv();
    }

    function start() {
        // Защита от повторной инициализации
        if (window.lampa_numkeys_plugin) return;
        window.lampa_numkeys_plugin = true;

        // Основной обработчик нажатий цифр
        function onKeyDown(e) {
            // Если открыт selectbox (списки фильтров и т.п.) — не вмешиваемся
            if (document.body.classList.contains('selectbox--open')) return;

            // Если фокус в инпуте/текстовом поле — не перехватываем цифры
            var active = document.activeElement;
            if (active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable
            )) {
                return;
            }

            // Если самого меню нет (например, полноэкранный плеер) — выходим
            if (!document.querySelector('.menu .menu__list')) return;

            var code = e.keyCode || e.which;

            // Маппинг keyCode → действия.
            // Включены коды верхнего ряда клавиатуры, NumPad и типичные TV‑коды,
            // по аналогии с существующим hotkeys.js.[web:6][web:12]

            // 1 → Фильмы
            if (code === 49 || code === 97 || code === 1) {
                openSection({
                    action: 'movie',
                    titleKey: 'menu_movies'
                });
                return;
            }

            // 2 → Сериалы (TV)
            if (code === 50 || code === 98 || code === 2) {
                openSection({
                    action: 'tv',
                    titleKey: 'menu_tv'
                });
                return;
            }

            // 3 → Избранное
            if (code === 51 || code === 99 || code === 3) {
                openSection({
                    action: 'favorite',
                    titleKey: 'menu_favorite'
                });
                return;
            }

            // 4 → Главная
            if (code === 52 || code === 100 || code === 4) {
                openSection({
                    action: 'main',
                    titleKey: 'menu_main'
                });
                return;
            }

            // 5 → Фильтр
            // По образцу других плагинов работаем с .simple-button--filter.[web:5]
            if (code === 53 || code === 101 || code === 5 || code === 6) {
                openFilter();
                return;
            }
        }

        /**
         * Открыть раздел через клик по пункту бокового меню.
         * Сначала ищем по data-action, если не нашли — по локализованному тексту.
         */
        function openSection(opts) {
            var action = opts.action;
            var titleKey = opts.titleKey;

            // Сперва пробуем по data-action
            var $item = $('body').find('.menu [data-action="' + action + '"]').first();

            if (!$item.length && Lampa && Lampa.Lang && typeof Lampa.Lang.translate === 'function') {
                var expectedTitle = Lampa.Lang.translate(titleKey) || '';

                // Фолбэк: ищем по тексту в .menu__text (учёт текущего языка)[web:5]
                $('body').find('.menu .menu__item').each(function () {
                    var $this = $(this);
                    var text = ($this.find('.menu__text').text() || '').trim();
                    if (text === expectedTitle) {
                        $item = $this;
                        return false; // break
                    }
                });
            }

            if (!$item.length) return;

            // Фокусируем пункт в контроллере, если он селектор
            try {
                if ($item.hasClass('selector') && Lampa.Controller && Lampa.Controller.toggle) {
                    Lampa.Controller.toggle($item[0]);
                }
            } catch (e) {
                // молча игнорируем, если API изменился
            }

            // В Lampa всё “нажатие” обычно эмулируется через событие hover:enter.[web:5]
            $item.trigger('hover:enter');
        }

        /**
         * Открыть фильтр для текущего списка (там, где кнопка фильтра доступна).
         */
        function openFilter() {
            // В разных экранах фильтр может быть спрятан, проверяем видимость.[web:5]
            var $btn = $('body').find('.simple-button--filter').filter(':visible').first();
            if (!$btn.length) return;

            // Для кнопок в интерфейсе Lampa также используется hover:enter.[page:1][web:5]
            $btn.trigger('hover:enter');
        }

        // Вешаем единый keydown‑слушатель
        document.addEventListener('keydown', onKeyDown);
    }

    // Стандартный жизненный цикл: запускаем после готовности приложения.[web:5]
    if (window.appready) {
        start();
    } else if (Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                start();
            }
        });
    }
})();
