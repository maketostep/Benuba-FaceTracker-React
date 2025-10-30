# Banuba WebAR (React + Vite + Tailwind)

Проект с интеграцией Banuba WebAR (только face tracking) на React (Vite) с Tailwind. Реализованы тёплый старт SDK, запрос разрешения камеры через модальное окно, съёмка кадра и скачивание снимка. Адаптирован для Android (Chrome/Яндекс) и iOS (Safari).

Автор: Martun Mkrtchyan — team@wavewebstudio.ru

## Возможности

- Инициализация Banuba SDK с тёплым стартом (preload/prefetch WASM/DATA/модуль/эффект).
- Face tracker модуль + пользовательский эффект из `src/effects/effect_sber.zip`.
- Модальное окно «Разрешить камеру», корректная работа на iOS (требуется жест пользователя).
- Съёмка кадра и скачивание изображения (Blob + objectURL, фоллбэк через `navigator.share`/`window.open`).

## Технологии

- React 18, Vite 5, Tailwind CSS 3
- Banuba WebAR (`@banuba/webar`) через NPM

## Инструменты и документация

- Эффект создан в Banuba Studio: https://studio.banuba.com/
- Документация Banuba (Face AR SDK): https://docs.banuba.com/far-sdk/

## Требования

- Node.js 18+ (рекомендовано LTS)
- Действительный Banuba Client Token

## Установка и запуск

1. Склонировать репозиторий и установить зависимости:
   - `npm install`
2. Указать токен Banuba:
   - Создать файл `.env.local` в корне и добавить строку:
     - `VITE_BANUBA_TOKEN=ВАШ_ТОКЕН`
   - Пример: см. `./.env.example:1`.
3. Запуск разработки:
   - `npm run dev`
   - Открыть ссылку из терминала (обычно `http://localhost:5173`).

## Сборка и деплой

- Сборка: `npm run build` (артефакты в `dist/`)
- Предпросмотр: `npm run preview`
- Рекомендуется хостинг со статической выдачей и HTTPS (Netlify, Vercel, Cloudflare Pages или свой сервер Nginx/Apache).

### Важно для продакшна

- Включить HTTPS (Chrome более строг к TLS/редиректам/CORS). Для IDN‑домена используйте Punycode в сертификате.
- Отключить любые серверные инъекции/редиректы внешних скриптов для `/assets/*` (иначе CORS/политики модулей будут блокировать загрузку).
- Настроить корректные типы контента:
  - `.wasm` → `application/wasm`
  - `.data` → `application/octet-stream`
  - `.zip` → `application/zip`
- Включить сжатие и кэширование статических файлов:
  - `Cache-Control: public, max-age=31536000, immutable` для файлов в `dist/assets/` и `@banuba` ассетов.
  - gzip/brotli для `.js`, `.css`, `.wasm`, `.data`, `.zip`.

## Структура

- `src/widgets/BanubaFaceTracker.jsx` — основной виджет: тёплый старт, модальное окно, рендер, съёмка, скачивание.
- `src/lib/useViewportHeight.js` — установка `--vh` для корректной высоты на iOS.
- `src/styles/index.css` — Tailwind и глобальный градиент‑фон.
- `src/effects/effect_sber.zip` — локальный эффект, импортируется как asset URL.

## Скрипты

- `npm run dev` — дев‑сервер
- `npm run build` — сборка prod
- `npm run preview` — предпросмотр сборки

## Оптимизация (мобильные)

- Тёплый старт: SDK, модуль и эффект загружаются сразу при входе на сайт, до запроса камеры.
- Прелоад/префетч: важные ассеты подкачиваются сразу и с высоким приоритетом.
- Можно добавить Service Worker (Workbox) для кэширования `@banuba` и эффектов стратегией cache‑first (повторные визиты станут мгновенными).

## Типичные проблемы

- Блокировка в Chrome из‑за CORS/редиректов: проверьте, что ваши бандлы/ассеты не редиректятся на сторонние домены, и всё отдается с вашего HTTPS.
- Камера не стартует на iOS: инициализацию камеры выполняем только после пользовательского клика («Разрешить камеру»).
- Скачивание на мобильном Chrome: используется Blob + objectURL + временная `<a>`; при отсутствии `download` fallback через `navigator.share`/`window.open`.

---

Контакты: Martun Mkrtchyan — team@wavewebstudio.ru
