import "./header.css"
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate();


    const [showOptions, setShowOptions] = useState(false);

    function logOut() {
        localStorage.setItem("loggedin", "false");
        localStorage.setItem("email", "");
        navigate("/");
        setShowOptions(false);

        sendPOSTLogout();

    }

    function settings() {
        navigate("/settings");
        setShowOptions(false);
    }

    const sendPOSTLogout = async () => {

        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
            const res = await fetch(`/logout`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();


        } catch (error) {
            // alert("Došlo je do pogreške tijekom registracije");

            setText("Došlo je do pogreške tijekom registracije");
            console.error('Error posting data:', error);
        }
    }


    return (
        <>
            <div id="header-holder">
                <div id="title">
                    Flow<span id="track">Track</span>
                </div>
                <div 
                onClick={() => setShowOptions(prev => !prev)}
                
                id="profile-holder">
                    <div id="profile">
                        <div id="profile-icon">

                        </div>
                        {localStorage.getItem("email")}
                    </div>

                </div>
                    {showOptions ? <div id="profile-options-holder">
                        <div id="profile-options">

                            <button 
                            onClick={() => settings()}
                            id="logout">Postavke</button>

                                                        <button 
                            onClick={() => logOut()}
                            id="logout">Odjava</button>
                        </div>
                    </div> : null}
            </div>
        </>
    )
}

export default Header;