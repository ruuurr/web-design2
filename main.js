import { Dashboard } from './js/core/Dashboard.js';
import { AudiusService } from './js/services/AudiusService.js';
import { ITunesService } from './js/services/ITunesService.js';
import { ToDoWidget } from './js/widgets/ToDoWidget.js';
import { ITunesSearchWidget } from './js/widgets/ITunesSearchWidget.js';
import { TrendingTracksWidget } from './js/widgets/TrendingTracksWidget.js';
import { AlbumCoversWidget } from './js/widgets/AlbumCoversWidget.js';
import { PomodoroWidget } from './js/widgets/PomodoroWidget.js';

// API Key от Audius. Безопасен для фронтенда согласно документации:
// https://docs.audius.co/developers/sdk/ (раздел "Get Your API Key")
// Bearer Token в проекте не используется.
const API_KEY = '0x3e27959a43be06080234cdb8286d8ec262efce52';

const dashboard = new Dashboard('#dashboard');
const audiusService = new AudiusService(API_KEY);
const iTunesService = new ITunesService();

// Фабрика виджетов по типу (для восстановления из localStorage)
function createWidget(type, id, title) {
  switch (type) {
    case 'ToDoWidget':
      return new ToDoWidget({ title, id });
    case 'ITunesSearchWidget':
      return new ITunesSearchWidget({ title, id }, iTunesService);
    case 'TrendingTracksWidget':
      return new TrendingTracksWidget({ title, id }, audiusService);
    case 'AlbumCoversWidget':
      return new AlbumCoversWidget({ title, id }, iTunesService);
    case 'PomodoroWidget':
      return new PomodoroWidget({ title, id });
    default:
      return null;
  }
}

// Восстановление виджетов из localStorage
const saved = dashboard.loadState();
saved.forEach(item => {
  const widget = createWidget(item.type, item.id, item.title);
  if (widget) dashboard.addWidget(widget);
});

// Кнопки добавления
document.querySelector('#add-todo').addEventListener('click', () => {
  dashboard.addWidget(new ToDoWidget({
    title: 'Список дел',
    id: `todo-${Date.now()}`
  }));
});

document.querySelector('#add-search').addEventListener('click', () => {
  dashboard.addWidget(new ITunesSearchWidget(
    { title: 'Поиск в iTunes', id: `itunes-${Date.now()}` },
    iTunesService
  ));
});

document.querySelector('#add-trending').addEventListener('click', () => {
  dashboard.addWidget(new TrendingTracksWidget(
    { title: 'Популярное на Audius', id: `trending-${Date.now()}` },
    audiusService
  ));
});

document.querySelector('#add-albums').addEventListener('click', () => {
  dashboard.addWidget(new AlbumCoversWidget(
    { title: 'Обложки альбомов', id: `albums-${Date.now()}` },
    iTunesService
  ));
});

document.querySelector('#add-pomodoro').addEventListener('click', () => {
  dashboard.addWidget(new PomodoroWidget({
    title: 'Помодоро',
    id: `pomodoro-${Date.now()}`
  }));
});