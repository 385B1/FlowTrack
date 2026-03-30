import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Layout from './components/layout/layout.jsx';
import Main from './components/main/main.jsx';
import Mjerenje from './components/mjerenje/mjerenje.jsx';
import Datoteke from './components/datoteke/datoteke.jsx';
import Prijavise from "./components/prijavljivanje/prijavise.jsx";
import Registrirajse from './components/registriranje/registrirajse.jsx';

function App() {
    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route index element={<Prijavise/>}/>
                    <Route path="registrirajse" element={<Registrirajse/>}/>
                    <Route element={<Layout/>}>
                        <Route path="podsjetnici" element={<Main/>}/>
                        <Route path="mjerenje" element={<Mjerenje/>}/>
                        <Route path="datoteke" element={<Datoteke/>}/>
                    </Route>
                </Routes>
            </div>
        </Router>
    )
}

export default App
