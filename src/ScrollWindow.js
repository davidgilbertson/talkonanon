import React from 'react';
import PropTypes from 'prop-types';

class ScrollWindow extends React.PureComponent {
  messagesRef = React.createRef();

  componentDidUpdate (prevProps, prevState, shouldScrollAfterUpdate) {
    if (shouldScrollAfterUpdate) {
      // Give it a tick to render
      setTimeout(() => {
        const el = this.messagesRef.current;
        el.scrollTop = el.scrollHeight - el.clientHeight;
      });
    }
  }

  getSnapshotBeforeUpdate (prevProps, prevState) {
    let shouldScrollAfterUpdate = false;

    if (this.messagesRef.current) {
      const el = this.messagesRef.current;
      const maxScrollTop = el.scrollHeight - el.clientHeight;

      const isScrolledDown = maxScrollTop - el.scrollTop < 20; // is scrolled down (or close)
      if (isScrolledDown) shouldScrollAfterUpdate = true;
    }

    return shouldScrollAfterUpdate;
  }

  render() {
    return (
      <div
        ref={this.messagesRef}
        className={this.props.className}
      >
        {this.props.children}
      </div>
    );
  }
}

ScrollWindow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default ScrollWindow;
