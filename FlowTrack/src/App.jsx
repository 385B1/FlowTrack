import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Layout from './components/layout/layout.jsx';
import Main from './components/main/main.jsx';
import Mjerenje from './components/mjerenje/mjerenje.jsx';
import Datoteke from './components/datoteke/datoteke.jsx';
import Prijavise from "./components/prijavljivanje/prijavise.jsx";
import Registrirajse from './components/registriranje/registrirajse.jsx';
import { useState } from "react";

function App() {
    const [loggedin, setLoggedin] = useState(() => {
        const savedValue = localStorage.getItem("loggedin");
        return savedValue === "true";

    }
    );

    const prijava = (email, id) => {

        setLoggedin(true);
        localStorage.setItem("loggedin", "true");
        localStorage.setItem("email", email);
        localStorage.setItem("id", id);

    }


    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route index element={<Prijavise prijava={prijava}/>}/>
                    <Route path="registrirajse" element={<Registrirajse/>}/>
                    <Route element={<Layout/>}>
                        <Route path="podsjetnici" element={loggedin ? <Main/> : <Navigate to={"/"}/>}/>
                        <Route path="mjerenje" element={loggedin ? <Mjerenje/> : <Navigate to={"/"}/>}/>
                        <Route path="datoteke" element={loggedin ? <Datoteke/> : <Navigate to={"/"}/>}/>
                    </Route>
                </Routes>
            </div>
        </Router>
    )
}

export default App
