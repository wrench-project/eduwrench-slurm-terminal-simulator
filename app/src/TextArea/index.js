import React from 'react';
import './index.css';

let ConfigFile = "";

function onSave() {
    let textArea = document.getElementById('textarea');
    let textButton = document.getElementById('textbutton');
    ConfigFile = textArea.value;
    textArea.hidden = true;
    textButton.hidden = true;
    console.log(ConfigFile);
}

class TextArea extends React.Component {
    render() {
        return (
            <div >
                <div id="textbutton" type="hidden">
                    <button onClick={onSave}>Save</button>
                </div>
                <textarea id="textarea" rows="20"></textarea> 
            </div>
        )
    }
}

export {TextArea, ConfigFile};