import React from 'react';
import ReactDOM from 'react-dom';
import {addTime} from '../Clock'
import Clock from 'react-clock'
import './index.css'

function add1() {
    addTime(60);
    let time = new Date(document.getElementsByClassName('react-clock')[0].dateTime);
    time.setSeconds(time.getSeconds() + 60);
    const clockElement = (
        <Clock id="clock" value={time}/>
    );
    ReactDOM.render( clockElement, document.getElementById('clock-area'));
}

function add10() {
    addTime(600);
    let time = new Date(document.getElementsByClassName('react-clock')[0].dateTime);
    time.setSeconds(time.getSeconds() + 600);
    const clockElement = (
        <Clock id="clock" value={time}/>
    );
    ReactDOM.render( clockElement, document.getElementById('clock-area'));
}

function add60() {
    addTime(3600);
    let time = new Date(document.getElementsByClassName('react-clock')[0].dateTime);
    time.setSeconds(time.getSeconds() + 3600);
    const clockElement = (
        <Clock id="clock" value={time}/>
    );
    ReactDOM.render( clockElement, document.getElementById('clock-area'));
}

class Header extends React.Component {

    render() {
        return (
            <div id="header">
                <button className="timeButton" onClick={add1} type="button">Skip 1 minute</button>
                <button className="timeButton" onClick={add10} type="button">Skip 10 minutes</button>
                <button className="timeButton" onClick={add60} type="button">Skip 60 minutes</button>
            </div>
        )
    }
}

export default Header;