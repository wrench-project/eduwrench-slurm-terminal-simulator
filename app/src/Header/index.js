import React from 'react';
import ReactDOM from 'react-dom';
import {setTime} from '../Clock'
import Clock from 'react-clock'
import './index.css'

function add1() {
    fetch('http://localhost:8080/add1', {
        method: 'POST'
    })
    .then((response) => response.json())
    .then((res) => {
        setTime(res['time']);
    });
}

function add10() {
    fetch('http://localhost:8080/add10', {
        method: 'POST'
    })
    .then((response) => response.json())
    .then((res) => {
        setTime(res['time']);
    });
}

function add60() {
    fetch('http://localhost:8080/add60', {
        method: 'POST'
    })
    .then((response) => response.json())
    .then((res) => {
        setTime(res['time']);
    });
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