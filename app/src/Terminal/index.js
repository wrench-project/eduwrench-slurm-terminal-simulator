import React from 'react';
import {Terminal} from 'xterm';
import 'xterm/css/xterm.css'

let term = new Terminal();
term.open(document.getElementById('terminal'));
term.write('Hello World');

class ATerminal extends React.Component {

}

export default ATerminal;