(function () {
    'use strict';

    var PLUGIN_NAME = 'number-remote-navigation';

    // 1..5: Фильмы, Сериалы, Избранное, Главная, Фильтр
    var ROUTES = {
        49: { // Digit1
            actions: ['movie', 'movies', 'film', 'films'],
            labels: ['фильмы', 'movies', 'movie', 'films']
        },
        50: { // Digit2
            actions: ['tv', 'series', 'serial', 'serials', 'shows'],
            labels: ['сериалы', 'series', 'tv shows', 'shows', 'serials']
        },
        51: { // Digit3
            actions: ['bookmarks', 'favorite', 'favorites', 'favourites'],
            labels: ['избранное', 'закладки', 'bookmarks', 'favorites', 'favourites']
        },
        52: { // Digit4
            actions: ['main', 'home'],
            labels: ['главная', 'main', 'home']
        },
        53: { // Digit5
            actions: ['filter', 'catalog'],
            labels: ['фильтр', 'filter', 'каталог', 'catalog']
        },

        // Numpad 1..5
        97: null,
        98: null,
        99: null,
        100: null,
        101: null
    };

    ROUTES[97] = ROUTES[49];
    ROUTES[98] = ROUTES[50];
    ROUTES[99] = ROUTES[51];
    ROUTES[100] = ROUTES[52];
    ROUTES[101] = ROUTES[53];

    var started = false;

    function log() {
        try {
            console.log.apply(console, ['[' + PLUGIN_NAME + ']'].concat([].slice.call(arguments)));
        } catch (e) {}
    }

    function normalize(text) {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function isBlockedContext() {
        var ae = document.activeElement;

        if (ae) {
            var tag = (ae.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || ae.isContentEditable) return true;
        }

        if (document.body) {
            if (document.body.classList.contains('settings--open')) return true;
            if (document.body.classList.contains('selectbox--open')) return true;
            if (document.body.classList.contains('search--open')) return true;
        }

        if (document.querySelector('.modal, .search-box, .player, .simple-keyboard, .keyboard')) return true;

        return false;
    }

    function getMenuCandidates() {
        return Array.from(document.querySelectorAll(
            '.menu [data-action], .menu .menu__item, .menu .selector[data-action], [data-action].menu__item'
        ));
    }

    function findMenuItem(route) {
        var items = getMenuCandidates();

        if (!items.length) return null;

        var wantedActions = route.actions.map(normalize);
        var wantedLabels = route.labels.map(normalize);

        var byAction = items.find(function (item) {
            var action = normalize(item.getAttribute('data-action'));
            return wantedActions.indexOf(action) >= 0;
        });

        if (byAction) return byAction;

        var byText = items.find(function (item) {
            var textNode = item.querySelector('.menu__text') || item;
            var text = normalize(textNode.textContent);

            return wantedLabels.some(function (label) {
                return text.indexOf(label) >= 0;
            });
        });

        return byText || null;
    }

    function activateItem(item) {
        if (!item) return false;

        try {
            // По возможности закрываем оверлеи и возвращаемся в контентный слой
            if (window.Lampa && Lampa.Controller && typeof Lampa.Controller.toContent === 'function') {
                Lampa.Controller.toContent();
            }
        } catch (e) {}

        try {
            if (window.Lampa && Lampa.Utils && typeof Lampa.Utils.trigger === 'function') {
                Lampa.Utils.trigger(item, 'hover:enter');
            } else if (typeof item.click === 'function') {
                item.click();
            } else {
                item.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true
                }));
            }

            return true;
        } catch (e) {
            log('activate error', e);
            return false;
        }
    }

    function openSectionByNumber(code) {
        var route = ROUTES[code];
        if (!route) return false;

        var item = findMenuItem(route);
        if (!item) {
            log('section not found for code:', code, route);
            return false;
        }

        return activateItem(item);
    }

    function onKeydown(payload) {
        if (!payload || !payload.code) return;
        if (isBlockedContext()) return;

        var handled = openSectionByNumber(payload.code);

        // Keypad сначала рассылает событие слушателям, а потом проверяет defaultPrevented,
        // поэтому можно остановить дальнейшую стандартную обработку.
        if (handled && payload.event) {
            try {
                payload.event.preventDefault();
                payload.event.stopPropagation();
            } catch (e) {}
        }
    }

    function init() {
        if (started) return;
        started = true;

        Lampa.Keypad.listener.follow('keydown', onKeydown);
        log('initialized');
    }

    function start() {
        if (!window.Lampa || !Lampa.Listener || !Lampa.Keypad) {
            return setTimeout(start, 300);
        }

        if (window.appready) {
            init();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e && e.type === 'ready') init();
            });
        }
    }

    start();
})();
