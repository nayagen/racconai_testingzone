import type { ReactNode } from "react";
export type IconName = "add" | "add-task-icon" | "add-user-icon" | "admin-icon" | "ai" | "ai-icon" | "analytics" | "approved-unlock" | "arrow-right" | "artificial-intelligence" | "attach-icon" | "back" | "back-to" | "badge" | "basket" | "blind" | "box-important" | "budget" | "camera" | "cancel" | "car-service" | "chat" | "chat-icon" | "check" | "check-icon" | "checked-checkbox" | "chevron-down" | "chevron-left" | "chevron-right" | "client-icon" | "combo-chart" | "company-icon" | "connection-offline" | "connection-online" | "container" | "cursor" | "dashboard" | "dashboard-icon" | "decline" | "delete" | "delete-icon" | "double-tick-icon" | "download" | "drag" | "drag-and-drop" | "dropdown" | "dropdown-icon" | "duration" | "edit" | "edit-icon" | "email" | "error" | "expand" | "expand-arrow" | "eye" | "filter" | "filter-icon" | "finish-flag" | "flag" | "forward-10rounded" | "garage" | "garage-filled" | "garbage-truck" | "google-calendar" | "group-of-locations" | "gsm" | "help-circle" | "hidden" | "high-priority" | "info" | "info-icon" | "journey" | "location" | "lock" | "logout" | "make-order" | "maximize-window" | "menu" | "message-disabled" | "message-not-sent" | "message-sent" | "minimize" | "minimize-window" | "more" | "mpz" | "msk" | "my-location" | "navigation" | "no-connection" | "notification" | "open-card" | "operator" | "order" | "password" | "pencil" | "petrol" | "phone" | "phone-calling" | "photo-latlon" | "photo-missing" | "photo-not-finished" | "photo-not-uploaded" | "photo-penalised" | "photo-penalised-ai" | "photo-rewarded" | "photo-rewarded-ai" | "photo-suspect" | "photo-suspect-ai" | "photo-uploaded" | "point-of-interest" | "price" | "print" | "redo" | "registry" | "remove-task-icon" | "replay-10rounded" | "rotate" | "row-actions-button" | "search" | "seen" | "settings" | "signal" | "source-driverapp" | "source-gps" | "spinner" | "stopwatch" | "tarif" | "task" | "tasklist" | "tear-off-calendar" | "telegram" | "test-tube" | "time" | "time-card" | "timetable" | "transfer-base" | "truck" | "undo" | "upward-arrow" | "user" | "user-contact" | "users" | "waste-field" | "weight-station" | "weight-station-map-icon" | "whatsapp" | "zaezd";
/** Icon from the RaccoonAI set, colour via `color` (use an Icons/* token). */
export interface IconProps { name: IconName; size?: number; color?: string; label?: string }
/** Button. One primary per context; hierarchy primary → secondary → tertiary → link. */
export interface ButtonProps { variant?: "primary" | "secondary" | "tertiary" | "link" | "destructive" | "accent-green" | "accent-orange" | "accent-red" | "accent-purple"; size?: "small" | "default" | "large" | "xl-mobile"; icon?: IconName; iconRight?: IconName; disabled?: boolean; fullWidth?: boolean; children?: ReactNode; onClick?: () => void }
export interface IconButtonProps { icon: IconName; label: string; size?: "small" | "medium" | "large"; selected?: boolean; disabled?: boolean; onClick?: () => void }
/** Entity status. Colours come from Status/* tokens; labels from the domain guide. */
export interface StatusBadgeProps { entity?: "job" | "route" | "shift" | "vehicle"; status: string; selected?: boolean; progress?: string; children?: ReactNode }
export interface PlateNumberProps { size?: "large" | "small"; children: ReactNode }
export interface CounterBadgeProps { count: number | string; tone?: "default" | "neutral" | "invert" }
export interface SegmentedItem { value: string; label: ReactNode; count?: number }
export interface SegmentedTabsProps { items: Array<string | SegmentedItem>; value: string; onChange?: (v: string) => void }
export interface FieldProps { label?: string; required?: boolean; placeholder?: string; value?: string; state?: "default" | "selected" | "error" | "success" | "warning" | "disabled" | "readonly"; hint?: string; iconLeft?: IconName; suffix?: string; dropdown?: boolean; layout?: "horizontal" | "vertical" }
export interface CheckboxProps { checked?: boolean; disabled?: boolean; label?: ReactNode }
export interface RadioProps { checked?: boolean; name?: string; label?: ReactNode }
export interface SwitchProps { on?: boolean; disabled?: boolean; label?: ReactNode }
export interface SeparatorProps { orientation?: "horizontal" | "vertical" }
/** Registry table: Caps header with sort, 48px rows, statuses and plates as cell values. */
export interface TableColumn { key: string; title: string; align?: "left" | "center" | "right"; width?: number; sortable?: boolean }
export type TableCell = string | number | { status: string; entity?: string; progress?: string } | { plate: string } | { primary: string; secondary?: string } | null;
export interface TableProps { columns: TableColumn[]; rows: Record<string, TableCell>[]; selectable?: boolean; selectedIndex?: number }
export interface PlateRef { plate: string }
/** Light status banner inside cards (Client App): tone by meaning. */
export interface StatusBannerProps { tone?: "info" | "success" | "error" | "warning" | "neutral"; title: ReactNode; detail?: ReactNode; aside?: ReactNode | PlateRef }
export interface OrderParam { text: string; alert?: boolean }
export interface OrderCost { label: string; value: string }
/** Client App order card. */
export interface OrderCardProps { location: string; date?: string; time?: string; author?: string; jobType?: string; params?: Array<string | OrderParam>; banner?: StatusBannerProps; org?: string; bin?: string; cost?: OrderCost }
/** Mobile bottom tab bar: 3–5 items, exactly one selected. */
export interface TabBarItem { icon: IconName; label: string; value?: string | number }
export interface MobileTabBarProps { items: TabBarItem[]; value?: string | number }
/** Job pin on the map, colour by Status/* (idle / selected). */
export interface MapPinProps { status?: "created" | "assigned" | "in-progress" | "on-service" | "completed" | "failed" | "cancelled"; selected?: boolean; size?: number; title?: string }
/** Truck on the map, top view, by vehicle type and trip state. */
export interface TruckMarkerProps { type?: "truck" | "samosval" | "musorovoz" | "dump" | "kmu" | "eco" | "desinfection"; state?: "enroute" | "enroute-empty" | "enroute-container" | "returning-full" | "on-service"; selected?: boolean; size?: number; rotate?: number; title?: string }
/** RaccoonAI mark (знак-енот). Словесная часть в Figma устаревшая («Rakun AI») — в продуктах ставится только знак. */
export interface LogoProps { size?: number }
/** Аватар: фото или инициалы. user — surface-success-strong (профиль), driver — chart-categorical-7, loader — chart-categorical-2. */
export interface AvatarProps { initials?: string; src?: string; name?: string; size?: 24 | 32 | number; role?: "user" | "driver" | "loader" }
export interface NavUser { initials: string; name: string; role: string }
export interface NavItem { icon: IconName; label: string; value: string; count?: number; href?: string }
/** Боковая навигация Платформы: Expanded 232 / Compact 76. Без groups — стандартный набор разделов Платформы. */
export interface SideNavProps { mode?: "expanded" | "compact"; value?: string; groups?: NavItem[][]; user?: NavUser; quickActions?: boolean; aiSwitch?: boolean; aiOn?: boolean }
export interface TabItem { value: string; label: ReactNode; icon?: IconName; count?: number; status?: "created" | "assigned" | "in-progress" | "on-service" | "completed" | "failed" | "cancelled" }
/** Вкладки. large — подразделы с иконкой (Large tab); medium — вкладки раздела в шапке (Medium Tab); small — фильтр по статусу со счётчиками (Small tab); underline — смены/рейсы (Underline Tab Item). */
export interface TabsProps { variant?: "large" | "medium" | "small" | "underline"; items: Array<string | TabItem>; value: string; onChange?: (v: string) => void; vertical?: boolean }
/** Вертикальное меню разделов в настройках и карточках сущностей (Side Tab Menu), ширина ≈170–200. */
export interface VerticalMenuProps { items: Array<string | TabItem>; value: string; onChange?: (v: string) => void }
export interface MenuItem { label: ReactNode; value?: string; secondary?: ReactNode; icon?: IconName; important?: boolean; selected?: boolean; checked?: boolean }
/** Выпадающий список (Dropdown list item double), shadow-md. */
export interface DropdownMenuProps { items: Array<string | MenuItem>; value?: string; width?: number }
/** Выпадающее поле (Dropdown Field). open + options показывают раскрытый список. */
export interface SelectProps { value?: string; placeholder?: string; secondary?: string; icon?: IconName; state?: "default" | "disabled" | "readonly"; open?: boolean; options?: Array<string | MenuItem>; selectedValue?: string; width?: number | string }
/** Поиск тулбара (Search Field), h32. */
export interface SearchFieldProps { placeholder?: string; value?: string; width?: number | string }
/** Дата или период в тулбаре (Calendar). arrows — навигация по дням ‹ ›. */
export interface DateButtonProps { value?: string; to?: string; arrows?: boolean }
/** Кнопка «Фильтр» тулбара (Filter button). */
export interface FilterButtonProps { active?: boolean; count?: number; children?: ReactNode; onClick?: () => void }
/** Активный фильтр-чип с крестиком (filter tag). */
export interface FilterTagProps { children: ReactNode; onRemove?: () => void }
/** Процент с цветом уровня (Percentage badge). Уровень задаётся явно. */
export interface PercentBadgeProps { level?: "green" | "yellow" | "orange" | "red" | "disabled"; value?: number | string; children?: ReactNode }
/** Сумма (Price Badge): surface-attention, белый текст. */
export interface PriceBadgeProps { children: ReactNode }
/** Отклонение от расчётного времени (ETA Badge). */
export interface EtaBadgeProps { level?: "in-time" | "a-bit-late" | "late"; children: ReactNode }
/** Тег-значение «Активно / Отключено» (Job_type Status) и нейтральные теги типов работ. */
export interface TagProps { tone?: "success" | "neutral" | "info"; children: ReactNode }
/** Количество − N + (Input with adj buttons). */
export interface StepperProps { value?: number; state?: "default" | "disabled" | "readonly" }
export interface EmptyAction { label: string; icon?: IconName }
/** Пустое состояние (Empty box). */
export interface EmptyStateProps { title?: string; text?: string | null; icon?: IconName; action?: EmptyAction }
/** Подпись секции/метрики: Caps + иконка 16 icons-information; aside — значение справа. */
export interface SectionLabelProps { icon?: IconName; children: ReactNode; aside?: ReactNode }
/** Атрибуты «подпись — значение» в карточках и панелях. */
export interface AttributeItem { label: ReactNode; value?: ReactNode; link?: boolean }
export interface AttributeListProps { items: AttributeItem[]; layout?: "horizontal" | "vertical" }
/** Каркас модального окна: шапка → Separator → контент → Separator → подвал. */
export interface ModalProps { title: ReactNode; subtitle?: ReactNode; kind?: "form" | "entity"; nav?: boolean; width?: 900 | 1400 | 1440 | 1800 | number; height?: number; headerAside?: ReactNode; footerLeft?: ReactNode; footerRight?: ReactNode; children?: ReactNode }
