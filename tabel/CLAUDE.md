# Табель HR — интерфейс Платформы RaccoonAI

Отдельная страница, к лендингу (`../index.html`, `../style.css`, `../js/`) не относится и в его сборку (`../tools/site-build`) не входит. Лендинг из этой папки не трогать.

## Запуск

Страница грузит `src/app.jsx` через Babel в браузере, поэтому с `file://` не откроется — нужен любой локальный сервер из корня репозитория:

```bash
python3 -m http.server 8000
```

Открыть http://localhost:8000/tabel/. Сборки нет: правишь файл → обновляешь страницу.

## Что где

| Путь | Что это |
|---|---|
| `index.html` | Точка входа: шрифт Inter, токены, бандл DS, React 18.3.1 и Babel с cdnjs |
| `src/app.jsx` | Экран «Табель за месяц» и каркас (SideNav, вкладки разделов, роутинг по `#/…`) |
| `src/data.js` | Моковые данные и логика периода (`window.TabelData`). Заменяется на API |
| `src/tabel.css` | Стили экрана поверх DS, только на токенах |
| `ds/` | RaccoonAI Design System for Claude, версия `1793218213-9641`: `tokens.css`, `components/bundle.{js,css}`, пропсы в `components/index.d.ts` |
| `handoff/` | Пакет от дизайна: `SPEC.md` (продуктовая спецификация), `screens/*.dc.html` (макеты 7 экранов), `README.md` (как читать макеты) |

## Правила

- Компоненты — из `window.RaccoonDS` (`DS.Button`, `DS.SegmentedTabs`, `DS.SideNav`, `DS.Icon` …). Перед использованием сверяй пропсы с `ds/components/index.d.ts`. Своих аналогов не делать.
- Цвета, отступы, радиусы, шрифты — только токены: `var(--surface-*)`, `var(--text-*)`, `var(--border-*)`, `var(--icons-*)`, `var(--space-*)`, `var(--radius-*)`, `font: var(--text-body-m-regular)` и т. п. Хардкод hex/px-отступов не допускается (исключение — геометрия сетки: ширина дня, высота строки, заданные переменными в начале `tabel.css`).
- `DS.Checkbox`, `DS.Radio`, `DS.Switch` в бандле неуправляемые (`defaultChecked`). Для управляемого чекбокса — `CheckToggle` из `app.jsx`; для радио — `onChange` на обёртке-`fieldset` (см. `ExportModal`).
- `DS.Modal` не принимает `onClose`, поэтому модалки собираются из классов `rc-modal__*` вручную (см. `ExportModal`).
- Тексты интерфейса — на русском, как в макетах. Значения в табеле — с запятой (`12,0`).
- Макет экрана — источник правды: структура в `<x-dc>`, данные и логика — в `<script data-dc-script>` внизу `.dc.html`. `{{x}}` — значение из `renderVals()`, `<sc-for>` — цикл, `<sc-if>` — условие, `<x-import component-from-global-scope="RaccoonDS.X">` — компонент DS.

## Готово / дальше

Сделано: экран 1 «Табель за месяц» (`handoff/screens/Main.dc.html`) — период с шаблонами, фильтры, поиск, группировка, метрики, сетка с закреплёнными колонками и подсветкой строки/столбца, ресайз колонок, сворачивание групп, модалка выгрузки.

Дальше по порядку из `handoff/README.md` (сейчас на их месте заглушка `StubScreen`):

1. Карточка дня — `#/day/<таб.№>/<дата>` → `DayDetail.dc.html` (с исключением) и `DayDetailNormal.dc.html` (штатный день).
2. Очередь исключений — `#/exceptions` → `Exceptions.dc.html`.
3. Лента отметок — `#/feed` → `Feed.dc.html`.
4. Настройки — `#/settings` → `SettingsRules.dc.html`, `SettingsExceptions.dc.html`.

Когда экранов станет больше, вынести каждый в `src/screens/<Name>.jsx` и подключить отдельным `<script type="text/babel">` в `index.html` (порядок важен: общие компоненты раньше экранов, `App` последним).
