# Табель HR — интерфейс Платформы RaccoonAI

Отдельная страница, к лендингу (`../index.html`, `../style.css`, `../js/`) не относится и в его сборку (`../tools/site-build`) не входит. Лендинг из этой папки не трогать.

## Запуск

Страница грузит `src/*.jsx` через Babel в браузере, поэтому с `file://` не откроется — нужен любой локальный сервер из корня репозитория:

```bash
python3 -m http.server 8000
```

Открыть http://localhost:8000/tabel/. Для разработки сборки нет: правишь файл → обновляешь страницу.

Для показа (без Babel в браузере, React в продакшен-сборке, только используемые иконки DS):

```bash
npm i --no-save --no-package-lock esbuild@0.24.2
node tabel/tools/build.mjs
```

Результат — `tabel/dist/` (в git не попадает), открывать http://localhost:8000/tabel/dist/.

## Что где

| Путь | Что это |
|---|---|
| `index.html` | Точка входа: шрифт Inter, токены, бандл DS, React 18.3.1 и Babel с cdnjs |
| `src/shared.jsx` | Общие компоненты и утилиты (`window.TabelUI`): шапка разделов `SectionTabs`, `CheckToggle`, `SelectControl`, `useResizable` |
| `src/screens/*.jsx` | Экраны, каждый регистрируется в `window.TabelScreens`: `Timesheet`, `Exceptions`, `Feed`, `Settings` (правила + типы исключений), `DayDetail` (день с исключением + штатный день) |
| `src/screens/*.css` | Стили экранов; у каждого свой префикс классов (`ex-`, `fd-`, `st-`, `dd-`) |
| `tools/build.mjs` | Сборка для показа в `dist/` |
| `src/main.jsx` | Каркас (SideNav) и роутинг по `#/…` — список маршрутов в шапке файла |
| `src/data.js` | Моковые данные табеля и логика периода (`window.TabelData`). Заменяется на API |
| `src/tabel.css` | Общие стили поверх DS, только на токенах |
| `ds/` | RaccoonAI Design System for Claude, версия `1793218213-9641`: `tokens.css`, `components/bundle.{js,css}`, пропсы в `components/index.d.ts` |
| `handoff/` | Пакет от дизайна: `SPEC.md` (продуктовая спецификация), `screens/*.dc.html` (макеты 7 экранов), `README.md` (как читать макеты) |

## Правила

- Доступность общая для всех экранов, держится в `shared.jsx`: любое окно с `role="dialog"` само получает фокус при открытии, удерживает Tab и возвращает фокус при закрытии; скрытые input внутри кнопок не получают фокус; чекбоксу DS без подписи имя даёт `data-cb-label` на обёртке. Новые окна просто размечайте `role="dialog"` + `aria-modal="true"`.
- Сетка табеля — `role="grid"` с одним шагом Tab: стрелки, Home/End, Ctrl+Home/End, PageUp/PageDown, Enter открывает день. Навигационные ячейки помечены `data-r`/`data-c`, подсветка столбца — `data-col`.
- Смысловые цвета текста (warning, attention, error, success, information) в `tabel.css` переопределены на более тёмную ступень палитры DS: исходные не проходят контраст 4,5:1 на своих подложках. Это стоит перенести в саму дизайн-систему.

- Флоу HR: разобрать исключения → закрыть период → выгрузить. На каждом экране одно главное действие (primary) по текущему шагу, остальное — secondary/tertiary или спрятано: в шапке табеля primary «Разобрать исключения», пока они есть, затем «Закрыть период»; в очереди у строки одно действие («Принять» предложение или «Разобрать»), ручное решение (время, код, причина) — только в карточке дня; в карточке дня решение справа и закреплено, смены и журнал свёрнуты. Итоговые столбцы табеля зависят от выбранной метрики. Здесь экраны сознательно расходятся с макетами `handoff/screens/` (упрощение 2026-11).

- Компоненты — из `window.RaccoonDS` (`DS.Button`, `DS.SegmentedTabs`, `DS.SideNav`, `DS.Icon` …). Перед использованием сверяй пропсы с `ds/components/index.d.ts`. Своих аналогов не делать.
- Цвета, отступы, радиусы, шрифты — только токены: `var(--surface-*)`, `var(--text-*)`, `var(--border-*)`, `var(--icons-*)`, `var(--space-*)`, `var(--radius-*)`, `font: var(--text-body-m-regular)` и т. п. Хардкод hex/px-отступов не допускается (исключение — геометрия сетки: ширина дня, высота строки, заданные переменными в начале `tabel.css`).
- `DS.Checkbox`, `DS.Radio`, `DS.Switch` в бандле неуправляемые (`defaultChecked`). Для управляемого чекбокса — `CheckToggle` из `shared.jsx`; для радио — `onChange` на обёртке-`fieldset` (см. `ExportModal` в `screens/Timesheet.jsx`).
- `DS.Modal` не принимает `onClose`, поэтому модалки собираются из классов `rc-modal__*` вручную (см. `ExportModal` в `screens/Timesheet.jsx`).
- Тексты интерфейса — на русском, как в макетах. Значения в табеле — с запятой (`12,0`).
- Макет экрана — источник правды: структура в `<x-dc>`, данные и логика — в `<script data-dc-script>` внизу `.dc.html`. `{{x}}` — значение из `renderVals()`, `<sc-for>` — цикл, `<sc-if>` — условие, `<x-import component-from-global-scope="RaccoonDS.X">` — компонент DS.

## Как устроен экран

Каждый `src/screens/X.jsx` обёрнут в `(() => { … })();` (Babel исполняет скрипты в общем глобальном пространстве), берёт помощники из `window.TabelUI` и регистрирует компонент: `window.TabelScreens.X = XScreen`. Экран получает пропсы `{ data, period, setPeriod, flagCount, route, day }` и сам рисует шапку раздела `<SectionTabs active="…">`. Новый файл экрана — подключить в `index.html` между `shared.jsx` и `main.jsx`, маршрут — в `resolve()` в `main.jsx`.

## Экраны

| Маршрут | Экран | Макет |
|---|---|---|
| `#/` | Табель за месяц | `Main.dc.html` |
| `#/exceptions` | Очередь исключений | `Exceptions.dc.html` |
| `#/feed` | Лента отметок | `Feed.dc.html` |
| `#/settings` | Настройки: правила и пороги | `SettingsRules.dc.html` |
| `#/settings/exceptions` | Настройки: типы исключений | `SettingsExceptions.dc.html` |
| `#/day/<таб.№>/<дата>` | Карточка дня (с исключением / штатная) | `DayDetail.dc.html`, `DayDetailNormal.dc.html` |

Все данные — моки из макетов. Дальше: подключение к API по разделу «Эндпоинты» в `handoff/SPEC.md`.
