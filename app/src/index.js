import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ATerminal from './Terminal/index';
import * as serviceWorker from './serviceWorker';

function Main() {
    document.title = "Terminal Front-end";
    return (
        <div>
            Hello World
        </div>
    );
  }
ReactDOM.render(<Main/>, document.getElementById('top-root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
