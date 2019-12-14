import React from 'react';
import ReactDOM from 'react-dom';
import uuid from 'uuid/v4';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as storage from './Utils/storage';
import './index.css';

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

ReactDOM.render(
  <App
    chatId={getChatId()}
    userId={getUserId()}
  />,
  document.getElementById('app')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
