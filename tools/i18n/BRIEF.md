# Translation brief: RaccoonAI landing page, Russian → English and Kazakh

RaccoonAI is an AI platform for waste-collection operators (МВО) in Kazakhstan: dispatch ERP («Платформа»), an AI dispatcher that assigns jobs to trucks, a driver app (DriverApp), a client app with WhatsApp bot and SIP telephony. Audience: directors and dispatch heads of large waste haulers, and city akimats. Voice: concrete, operational, calm B2B; no hype, no exclamation marks. Kazakh: formal register (сіз), modern standard Kazakh in Cyrillic, natural word order (not calqued from Russian).

## Two kinds of source strings
- ctx starting with a section id (top, intake, dispatcher, schedule, driverapp, clients, products, proof, demo, site-header, site-footer, head, page, pause…) = a whole text node or attribute of the marketing page. Translate the full sentence naturally. A sentence may be split into several nodes around <strong>/<b>/<a> tags; each node is translated on its own, so keep each piece grammatical and make neighbouring pieces read well together (e.g. a bold lead-in "Двухуровневый контроль." then the rest of the sentence).
- ctx `platform` or `script` = a fragment ("run") cut out of product-UI text in the Platform screen replica or JS-built text. Digits, Latin words, plates, «·», quotes and HTML were cut out, so a fragment may be a single word or the words between numbers (e.g. "точки" from "24 точки", "из" from "3 из 17", "ч" from "2ч 15м"). Translate each fragment so it reads correctly when the removed numbers/words are put back around it in the same place. Keep these SHORT: they sit in dense, fixed-width UI. Keep Russian UI abbreviations short in the target too (ч → h / сағ, м/мин → min / мин, км → km / км, шт → pcs / дана).
- Plural word forms come separately (точка / точки / точек). In English give the singular for the "one" form and the plural for the others; in Kazakh nouns after numerals stay singular (5 нүкте), so all three forms are usually the same word.

## Rules
- Keep the key exactly as given. Output plain text (no HTML, no &nbsp;). Keep leading/trailing punctuation that the source has (a trailing «:» or «.» stays).
- Numbers: never change digits. In English write decimals with a point when the number is inside the string ("1,1 м³" → "1.1 m³"); Kazakh keeps the comma.
- Proper nouns (people, companies, streets, districts, sites):
  - English: transliterate to Latin the way Kazakhstan uses it: "ул. Шугыла" → "Shugyla St.", "пр. Абая" → "Abay Ave.", "мкр. Самал-2" → "Samal-2 microdistrict", "Кабанбай батыра, 45" → "45 Kabanbay Batyr St." (or "Kabanbay Batyr St., 45" when the number is not part of the string), "Сериков Данияр" → "Daniyar Serikov" stays as "Serikov Daniyar" (keep surname-first order), ТОО «Алатау Сервис Групп» → "Alatau Service Group LLP", ИП Сапарова А. → "IE Saparova A.", ТОО «Ак Тартып» → "Ak Tartyp LLP".
  - Kazakh: keep names in Cyrillic with Kazakh spelling where obvious (Қабанбай батыр, Ақ Тартып), ул. → көш., пр. → даң., мкр. → ш/а., ТОО → ЖШС (after the name: «Алатау Сервис Групп» ЖШС), ИП → ЖК.
  - Brand/product names stay: RaccoonAI, DriverApp, Client App, WhatsApp, 2ГИС (en: 2GIS), Wialon, 1С (en: 1C), App Store, Google Play, Яндекс Карты (en: Yandex Maps).
- Plates (123 ABC 02, 714SH02) never change.

## Glossary (ru → en / kk)
- МВО → waste collection operator (short: operator) / қалдық шығаратын компания (short: оператор)
- Платформа → Platform / Платформа
- AI-диспетчер → AI dispatcher / AI-диспетчер
- диспетчер / диспетчерская → dispatcher / dispatch room → диспетчер / диспетчерлік
- заявка → request / өтінім
- задание → job / тапсырма
- маршрут → route / маршрут; маршрутная группа → route group / маршрут тобы; маршрутный лист → route sheet / маршрут парағы
- рейс → trip / рейс
- площадка, контейнерная площадка, КП → site, container site / алаң, контейнер алаңы (КП → en "site", kk "КА")
- точка (маршрута) → stop / нүкте
- машина, ТС, техника → truck, vehicle, fleet / көлік, техника
- водитель → driver / жүргізуші; экипаж → crew / экипаж; грузчик → loader / жүк тиеуші
- смена → shift / ауысым
- ТБО → MSW / ҚТҚ; СО → construction waste / құрылыс қалдықтары (short: en "CW", kk "ҚҚ"); КГО → bulky waste / ірі габаритті қалдық
- мусоровоз → garbage truck / қоқыс тасығыш; мультилифт → multilift / мультилифт; бункер → skip / бункер; контейнер → container / контейнер; евроконтейнер «1,1 евро» → "1.1 euro" / «1,1 евро»
- полигон → landfill / полигон; весовая → weighbridge / таразы
- ГСМ → fuel / ЖЖМ
- акимат → akimat / әкімдік; ситуационный центр → situational center / жағдайлық орталық
- заказчик, клиент → customer, client / тапсырыс беруші, клиент
- договор → contract / шарт; тариф → rate / тариф; по нормативу → on a flat rate (норматив) / норматив бойынша
- БИН → BIN / БСН; ЭСФ → e-invoice (ESF) / ЭШФ; ЭАВР → e-certificate of completion (EAVR) / ЭОАА
- фотоотчёт → photo report / фотоесеп; фото ДО / ПОСЛЕ → BEFORE / AFTER photo / ДЕЙІН / КЕЙІН фото
- статусы: Неназначено → Unassigned / Тағайындалмаған; Назначено → Assigned / Тағайындалды; Назначено AI → Assigned by AI / AI тағайындады; AI предлагает → AI suggests / AI ұсынады; Машина в пути → Truck en route / Көлік жолда; В пути → En route / Жолда; Выполнено → Completed / Орындалды; Невывоз → Missed / Шығарылмады; На линии → On duty / Желіде; Офлайн → Offline / Офлайн
- Запросить демо → Request a demo / Демо сұрау
- Демонстрационные данные → Demo data / Демо деректер
- Иллюстративное изображение → Illustrative image / Иллюстрациялық сурет
- days Пн Вт Ср Чт Пт Сб Вс → Mon Tue Wed Thu Fri Sat Sun / Дс Сс Ср Бс Жм Сб Жс
- months январь…декабрь → January… / қаңтар, ақпан, наурыз, сәуір, мамыр, маусым, шілде, тамыз, қыркүйек, қазан, қараша, желтоқсан

## Output
Write ONE JSON file: an object whose keys are the exact Russian source strings and whose values are {"en": "...", "kk": "..."}. Every input string must be present. Validate it parses (node -e "JSON.parse(require('fs').readFileSync(FILE,'utf8'))") and that the key count equals the input count before you finish.
