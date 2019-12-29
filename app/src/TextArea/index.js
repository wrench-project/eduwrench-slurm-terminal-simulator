import React from 'react';
import './index.css';

class TextArea extends React.Component {
    render() {
        return (
            <div>
                <div id="textbuttons">
                    <button type="button">Skip 1 minute</button>
                    <button type="button">Skip 10 minutes</button>
                </div>
                 <textarea id="textarea" rows="20">
                    Some text
                </textarea> 
            </div>
        )
    }
}

export default TextArea;