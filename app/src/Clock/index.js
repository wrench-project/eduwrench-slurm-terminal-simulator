import React from 'react';
import ReactDOM from 'react-dom';
import Clock from 'react-clock'

let elapsedTime = 0;

function getElapsedTime() {
    return elapsedTime;
}

function addTime(seconds) {
    elapsedTime += seconds;
}

class Timer extends React.Component {

    addTime() {
        let time = new Date(document.getElementsByClassName('react-clock')[0].dateTime);
        time.setSeconds(time.getSeconds() + 1);
        elapsedTime++;
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
        let time = new Date();
        time.setHours(0,0,0,0);
        return (
            <Clock id="clock" value={time}/>
        );
    }
  }

export {Timer, getElapsedTime, addTime};