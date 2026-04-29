import "./registrirajse.css";
import { Bolt, Lock, Mail } from "lucide-react";
import { User } from 'lucide-react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from 'lucide-react';
import { isValidUsername, isValidPassword, isValidEmail } from '../credentialValidation.jsx';

const Registrirajse = () => {
    const [username, setUsername] = useState(null);
    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [passwordRepeated, setPasswordRepeated] = useState(null);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(null);
    const [showPassword2, setShowPassword2] = useState(null);
    const [text, setText] = useState(null);
    const [redirect, setRedirect] = useState(false);

    const sendPOSTRegister = async () => {

        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
            const res = await fetch(`/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: username, password: password, email: email })
            });
            const data = await res.json();
            if (data.message == "user_created") {
                console.log(data);
                setRedirect(true);
                setText("Račun je uspješno izrađen");
                setRedirect(true);
            }

            if (data.message == "user_exists") {
                console.log(data);
                setText("Ovaj email je već korišten");
            }


            if (data?.detail?.length > 0) {
                //localStorage.setItem("loggedin", "false");
                //navigate("/");
                setText("Pokušajte kasnije");
            }
        } catch (error) {
            setText("Došlo je do pogreške tijekom registracije");
            console.error(error);
        }
    }

    function popup() {
        setText(null);

        if (redirect) navigate("/");
    }

    function sendRegisterRequest() {
        if (!isValidUsername(username)) {
            setText("Korisničko ime se mora sastojati od slova i/ili brojki, bez razmaka i posebnih karaktera te duljine između 3 i 20 karaktera");
            return;
        }

        if (!isValidPassword(password)) {
            setText("Lozinka se mora sastojati od barem jednog malog, velikog slova i broja, bez razmaka i posebnih karaktera te duljine između 8 i 50 karaktera");
            return;
        }

        if (!isValidEmail(email)) {
            setText("Potrebno je unjeti ispravni email");
            return;
        }

        if (password !== passwordRepeated) {
            setText("Potrebno je unjeti podudarajuće lozinke");
            return;
        }
        sendPOSTRegister();
    }

    return (
        <div id="registrirajse-page">
            <div id="registrirajse-page-header">
                <img src="/realflowtracklogo.png" alt="FlowTracklogo" className="flowtracklogo"/>
            </div>
            <div className="registrirajse-container">
                <div id="registrirajse-title">
                    Registrirajte se
                    <span id="registrirajse-desc">
                        Unesite svoje podatke za kreiranje korisničkog računa
                    </span>
                </div>
                <div id="registrirajse-line-holder">
                    <span className="registrirajse-line">
                    </span>
                    <div>
                        <Bolt className="registrirajse-input-icon" />
                    </div>
                    <span className="registrirajse-line">
                    </span>
                </div>
                <div id="registrirajse-input-container">
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <User className="registrirajse-icon" /> Unesite svoje korisničko ime:
                        </span>
                        <input
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            type="text" placeholder="Korisničko ime..." className="registrirajse-unosi-korisnika" />
                    </div>
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <Mail className="registrirajse-icon" /> Unesite svoju E-Mail adresu:
                        </span>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email" placeholder="unesite@email.com" className="registrirajse-unosi-korisnika" />
                    </div>
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <Lock className="registrirajse-icon" />Unesite svoju lozinku:
                        </span>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type={showPassword ? "text" : "password"} placeholder="Vaša lozinka..." className="registrirajse-unosi-korisnika" />
                        <span
                            onMouseDown={() => setShowPassword(true)}
                            onMouseUp={() => setShowPassword(false)}
                            onMouseLeave={() => setShowPassword(false)}
                            style={{ position: "absolute", left: 1150, bottom: 495, cursor: "pointer", marginRight: 0, width: 10 }}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>

                    </div>
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <Lock className="registrirajse-icon" />Potvrdite svoju lozinku:
                        </span>
                        <input
                            onChange={(e) => setPasswordRepeated(e.target.value)}
                            value={passwordRepeated}
                            type={showPassword2 ? "text" : "password"} placeholder="Ponovite vašu lozinku..." className="registrirajse-unosi-korisnika" />

                        <span
                            onMouseDown={() => setShowPassword2(true)}
                            onMouseUp={() => setShowPassword2(false)}
                            onMouseLeave={() => setShowPassword2(false)}
                            style={{ position: "absolute", left: 1150, bottom: 425, cursor: "pointer", marginRight: 0, width: 10 }}>
                            {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>
                <div id="registrirajse-button"
                    onClick={() => sendRegisterRequest()}>
                    REGISTRIRAJ SE
                </div>
                <div id="registrirajse-footer-holder">
                    <div id="registrirajse-footer">
                        Već imate korisnički račun? <a href="/" id="prijava-link">Prijavite se!</a>
                    </div>
                </div>
            </div>

            {text ? (<div id="overlay">
                <div id="modal">
                    <div id="dialog-text">
                        {text}
                    </div>

                    <div
                        onClick={() => popup()}
                        id="dialog-button">
                        OK</div>
                </div>

            </div>) : null}

        </div>
    );
};

export default Registrirajse;