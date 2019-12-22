import React from 'react';
import ReactDOM from 'react-dom';
import Clock from 'react-clock'

class Timer extends React.Component {

    addTime() {
        let time = new Date(document.getElementsByClassName('react-clock')[0].dateTime);
        time.setSeconds(time.getSeconds() + 1);
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

export default Timer;