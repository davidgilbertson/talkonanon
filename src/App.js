import React from 'react';
import PropTypes from 'prop-types';
import { collect } from 'react-recollect';
import uuid from 'uuid/v4';
import ScrollWindow from './ScrollWindow';
import * as storage from './Utils/storage';
import api from './Data/api';
import mergeItems from './Utils/mergeItems';
import styles from './App.module.css';

const setUrl = id => {
  const newUrl = id ? `${document.location.origin}/${id}` : document.location.origin;
  window.history.replaceState({}, '', newUrl);
};

const resetApp = () => {
  localStorage.clear();
  setUrl();
  document.location.reload();
};

class App extends React.PureComponent {
  inputRef = React.createRef();

  changesPending = false;

  mergeMessagesIntoState = newMessages => {
    const messages = mergeItems(newMessages, this.props.store.messages);

    this.props.store.messages = messages;

    return messages;
  };

  startPolling = () => {
    api.poll(this.props.store.chatId, data => {
      if (data.error) {
        // The ID was probably deleted. So...
        resetApp();
      } else if (data.messages) {
        // Add the new messages to state
        // To keep size down, keep the last 30 messages only
        const mergedMessages = this.mergeMessagesIntoState(data.messages).slice(-30);

        // Then pass the merged in messages to be sent with the queue
        if (this.changesPending) {
          this.changesPending = false;

          api.update(this.props.store.chatId, {messages: mergedMessages});
        }
      } else {
        console.warn('Something is not OK');
      }
    });
  };

  loadChat = async () => {
    const data = await api.read(this.props.store.chatId);

    if (data.error) {
      console.error(data.error);
      resetApp();
    } else if (data.messages) {
      this.mergeMessagesIntoState(data.messages);

      setUrl(this.props.store.chatId);

      this.startPolling();
    } else {
      console.warn('Something is not OK');
    }
  };

  createChat = async () => {
    const data = await api.create({messages: []});

    if (data.error) {
      // TODO (davidg): Show a message or something. For now, nothing
      console.error(data.error);
    } else {
      storage.set('chatId', data.id);
      setUrl(data.id);

      this.props.store.chatId = data.id;
      this.startPolling();
    }
  };

  updateChat = async () => {
    const newMessage = {
      id: uuid(),
      userId: this.props.store.userId,
      text: this.props.store.draft,
      name: this.props.store.name,
      dateTime: Date.now(),
    };

    // Update the store so it renders on the screen
    const nextMessages = this.props.store.messages.slice();
    nextMessages.push(newMessage);

    this.mergeMessagesIntoState(nextMessages);
    this.props.store.draft = '';

    // But don't send the changes to the API right away.
    // This makes it more likely that the database will contain the latest messages
    // This really doesn't work very well for a chat app.
    this.changesPending = true;
  };

  destroy = async () => {
    await api.delete(this.props.store.chatId);

    resetApp();
  };

  componentDidMount = async () => {
    if (this.props.store.chatId) {
      this.loadChat();
    } else {
      this.createChat();
    }
  };

  render () {
    return (
      <div className={styles.wrapper}>
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.titles}>
              <div className={styles.title}>Talk on anon</div>

              <div className={styles.subTitle}>Share the URL to share this chat</div>
            </div>

            <button className={styles.destroyButton} onClick={this.destroy}>Destroy</button>
          </div>

          {!!this.props.store.chatId && (
            <React.Fragment>
              <ScrollWindow className={styles.messages}>
                {this.props.store.messages.length > 0
                  ? this.props.store.messages.map(message => (
                    <div
                      key={message.dateTime}
                      className={styles.message}
                    >
                      {message.userId === this.props.store.userId
                        ? 'You'
                        : message.name
                      }: {message.text}
                    </div>
                  ))
                  : <div className={styles.new}>Say something!</div>
                }
              </ScrollWindow>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  this.updateChat();
                  if (this.inputRef.current) this.inputRef.current.focus();
                }}
                className={styles.inputWrapper}
              >
                <textarea
                  ref={this.inputRef}
                  className={styles.textarea}
                  rows={2}
                  value={this.props.store.draft}
                  placeholder="Words go in here"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      this.updateChat();
                    }
                  }}
                  onChange={e => {
                    this.props.store.draft = e.target.value;
                  }}
                />

                <button className={styles.sendButton}>Send</button>
              </form>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  store: PropTypes.shape({
    chatId: PropTypes.string,
    userId: PropTypes.string,
    messages: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      userId: PropTypes.string,
      text: PropTypes.string,
      name: PropTypes.string,
      dateTime: PropTypes.number,
    })),
    draft: PropTypes.string,
    name: PropTypes.string,
  })
};

export default collect(App);
