import "./header.css"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from 'lucide-react';
import { Settings } from 'lucide-react';

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
                    <img src="/realflowtracklogo.png" alt="FlowTracklogo" className="flowtracklogo"/>
                </div>
                <div id="profile-holder">
                    <div id="profile-info-holder" onClick={() => setShowOptions(prev => !prev)}>
                    <div id="profile">
                        {localStorage.getItem("email")}
                    </div>
                    {showOptions ? <div id="profile-options-holder">
                        <div id="profile-options">

                            <div
                                onClick={() => {
                                    settings()
                                    setShowOptions(prev => !prev)
                                }
                            }
                                className="izbornik-postavke"><Settings className="ikonice-izbornik"/>Postavke</div>

                            <div
                                onClick={() => logOut()}
                                className="izbornik-postavke"><LogOut className="ikonice-izbornik"/>Odjava</div>
                        </div>
                    </div> : null}
                    </div>


                </div>

            </div>
        </>
    )
}

export default Header;