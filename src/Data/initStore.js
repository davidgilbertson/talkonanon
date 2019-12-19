import { store } from 'react-recollect';
import uuid from 'uuid/v4';
import * as storage from 'Utils/storage';

const getUserId = () => {
  let userId = storage.get('userId');

  if (userId) return userId;

  userId = uuid();
  storage.set('userId', userId);

  return userId;
};

const getChatId = () => {
  // If there's a chat ID in the URL, use it
  const chatId = document.location.pathname.split('/')[1];

  // rudimentary check for UUID/v4
  if (chatId?.length === 36) {
    storage.set('chatId', chatId);

    return chatId;
  }

  // Else check local storage (maybe undefined)
  return storage.get('chatId');
};

store.userId = getUserId();
store.chatId = getChatId();
store.messages = [];
store.draft = '';
store.name = 'Anon';
