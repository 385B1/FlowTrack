import './menu.css'
import { Clock5 } from 'lucide-react';
import { Folders } from 'lucide-react';
import { StickyNote } from 'lucide-react';
import { Bot } from 'lucide-react';

const Menu = () => {
    return (
        <div id="menu">
            <div id="menu-holder">
                <div id="title-menu">
                    IZBORNIK
                    <span id="crta">
                    </span>
                </div>

                <ul id="menu-list">
                    <li>
                        <a href="/podsjetnici" className="linkovi-menu">
                            <span className="menu-option">
                                <StickyNote className="icon" />Podsjetnici
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="/mjerenje" className="linkovi-menu">
                            <span className="menu-option">
                                <Clock5 className="icon" />Mjerenje
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="/datoteke" className="linkovi-menu">
                            <span className="menu-option">
                                <Folders className="icon" />Datoteke
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="/ai" className="linkovi-menu">
                            <span className="menu-option">
                                <Bot className="icon" />Chatbot
                            </span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    )
}
export default Menu;