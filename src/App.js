import React from 'react';
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

// TODO (davidg): this logic is all a right mess
class App extends React.PureComponent {
  state = {
    userId: this.props.userId,
    chatId: this.props.chatId,
    messages: [],
    draft: '',
    name: 'Anon',
  };

  inputRef = React.createRef();

  changesPending = false;

  mergeMessagesIntoState = newMessages => {
    const messages = mergeItems(newMessages, this.state.messages);

    this.setState({messages});

    return messages;
  };

  startPolling = () => {
    api.poll(this.state.chatId, data => {
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

          api.update(this.state.chatId, {messages: mergedMessages});
        }
      } else {
        console.warn('Something is not OK');
      }
    });
  };

  loadChat = async () => {
    const data = await api.read(this.state.chatId);

    if (data.error) {
      console.error(data.error);
      resetApp();
    } else if (data.messages) {
      this.mergeMessagesIntoState(data.messages);

      setUrl(this.state.chatId);

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

      this.setState(
        {chatId: data.id},
        this.startPolling,
      );
    }
  };

  updateChat = async () => {
    const newMessage = {
      id: uuid(),
      userId: this.state.userId,
      text: this.state.draft,
      name: this.state.name,
      dateTime: Date.now(),
    };

    // Update the store so it renders on the screen
    const nextMessages = this.state.messages.slice();
    nextMessages.push(newMessage);

    this.mergeMessagesIntoState(nextMessages);
    this.setState({draft: ''});

    // But don't send the changes to the API right away.
    // This makes it more likely that the database will contain the latest messages
    // This really doesn't work very well for a chat app.
    this.changesPending = true;
  };

  destroy = async () => {
    await api.delete(this.state.chatId);

    resetApp();
  };

  componentDidMount = async () => {
    if (this.state.chatId) {
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

          {!!this.state.chatId && (
            <React.Fragment>
              <ScrollWindow className={styles.messages}>
                {this.state.messages.length > 0
                  ? this.state.messages.map(message => (
                    <div
                      key={message.dateTime}
                      className={styles.message}
                    >
                      {message.userId === this.state.userId
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
                  value={this.state.draft}
                  placeholder="Words go in here"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      this.updateChat();
                    }
                  }}
                  onChange={e => {
                    this.setState({draft: e.target.value});
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

export default App;
