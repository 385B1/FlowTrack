import "./prijavise.css";
import { Mail } from 'lucide-react';
import { Lock } from 'lucide-react';
import { Bolt } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from "react";
import { isValidUsername, isValidPassword, isValidEmail } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";


const Prijavise = ({ prijava }) => {
    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [showPassword, setShowPassword] = useState(null);
    const [text, setText] = useState(null);
    const navigate = useNavigate();

    function sendLoginRequest() {
        if (!isValidEmail(email)) {

            setText("Potrebno je unjeti ispravni email");
            return;
        }

        if (!isValidPassword(password)) {

            setText("Neispravna lozinka");
            return;
        }

        sendPOSTLogin();

    }

    const sendPOSTLogin = async () => {

        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
            const res = await fetch(`/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            });
            const data = await res.json();



            if (data.message == "user_exists") {
                console.log(data);
                prijava(email, data.id);
                navigate("/mjerenje");
            } else {
                setText("Nije pronađen račun sa ovim podacima");
                
            }

        } catch (error) {
            // alert("Došlo je do pogreške tijekom registracije");

            setText("Došlo je do pogreške tijekom registracije");
            console.error('Error posting data:', error);
        }
    }



    return (
        <div id="prijavise-page">
            <div id="prijavise-page-header">
                Flow<span id="prijavise-track">Track</span>
            </div>
            <div className="prijavise-container">
                <div id="prijavise-title">
                    Prijavite se
                    <span id="prijavise-desc">
                        Unesite svoje podatke za prijavu na platformu FlowTrack
                    </span>
                </div>
                <div id="line-holder">
                    <span className="prijavise-line">
                    </span>
                    <div>
                        <Bolt className="input-icon" />
                    </div>
                    <span className="prijavise-line">
                    </span>
                </div>
                <div id="prijavise-input-container">
                    <div className="prijavise-input">
                        <span className="prijavise-label">
                            <Mail className="prijavise-icon" /> Unesite svoju E-Mail adresu:
                        </span>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}



                            type="email" placeholder="unesite@email.com" className="unosi-korisnika" />
                    </div>
                    <div className="prijavise-input">
                        <span className="prijavise-label">
                            <Lock className="prijavise-icon" />Unesite svoju lozinku:
                        </span>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type={showPassword ? "text" : "password"}
                            placeholder="Vaša lozinka..." className="unosi-korisnika" />
                        <span
                            onMouseDown={() => setShowPassword(true)}
                            onMouseUp={() => setShowPassword(false)}
                            onMouseLeave={() => setShowPassword(false)}
                            style={{ position: "relative", left: 420, bottom: 32, cursor: "pointer", marginRight: 0, width: 10 }}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>
                <div
                    onClick={() => sendLoginRequest()}
                    id="prijavise-button">
                    PRIJAVI SE
                </div>
                <div id="footer-holder">
                    <div id="prijavise-footer">
                        Nemate korisnički račun? <a href="/registrirajse" id="registracija-link">Registrirajte se!</a>
                    </div>
                </div>
            </div>


            {text ? (<div id="overlay">
                <div id="modal">
                    <div id="dialog-text">
                        {text}
                    </div>

                    <div
                        onClick={() => setText(null)}
                        id="dialog-button">
                        OK</div>
                </div>

            </div>) : null}


        </div>


    );
};

export default Prijavise;