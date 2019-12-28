import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';

import './index.css';
import Header from './Header/index';
import {Timer} from './Clock/index';
import runTerminal from './Terminal/index';
import TextArea from './TextArea/index';

ReactDOM.render(<Timer />, document.getElementById('clock-area'));
ReactDOM.render(<Header/>, document.getElementById('top-root'));
ReactDOM.render(<TextArea />, document.getElementById('bot-root'));
runTerminal();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
