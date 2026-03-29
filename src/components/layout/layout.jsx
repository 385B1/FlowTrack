import './layout.css'
import Header from "../header/header.jsx";
import Menu from "../menu/menu.jsx";
import {Outlet} from "react-router-dom";

const Layout = () =>{
    return(
        <div id="layout-holder">
            <div>
                <Header/>
            </div>
            <div>
                <Menu/>
            </div>
            <div>
                <Outlet/>
            </div>
        </div>
    )
}
export default Layout;