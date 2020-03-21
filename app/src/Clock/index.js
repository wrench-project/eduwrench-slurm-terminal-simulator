import React from 'react';
import ReactDOM from 'react-dom';
import Clock from 'react-clock'

let elapsedTime = -1000*3600*2;

function getElapsedTime() {
    return elapsedTime;
}

function setTime(milliseconds) {
    elapsedTime = milliseconds + (-1000*3600*2);
}

function addTime(milliseconds) {
    elapsedTime += milliseconds;
}

class Timer extends React.Component {

    addTime() {
        elapsedTime += 1000;
        let time = new Date(elapsedTime);
        time.setSeconds(time.getSeconds());
        const clockElement = (
            <Clock id="clock" value={time}/>
        );
        ReactDOM.render( clockElement, document.getElementById('clock-area'));
    }
   
    componentDidMount() {
      setInterval(() => {
          this.addTime();
      }, 1000
      );
    }
   
    render() {
        let time = new Date(elapsedTime);
        fetch('http://localhost:8080/start', {
            method: 'POST'
        }).then((res) => {
            console.log(res);
        });
        return (
            <Clock id="clock" value={time}/>
        );
    }
  }

export {Timer, getElapsedTime, addTime, setTime };