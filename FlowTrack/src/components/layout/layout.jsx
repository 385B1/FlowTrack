import './layout.css'
import Header from "../header/header.jsx";
import Menu from "../menu/menu.jsx";
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <div id="layout-holder">
            <div id="header">
                <Header />
            </div>
            <div id="output">
                <div id="menu">
                    <Menu />
                </div>
                <div id="wrapper">
                    <div id="content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Layout;