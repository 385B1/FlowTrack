import "./registrirajse.css";
import {Bolt, Lock, Mail} from "lucide-react";
import { User } from 'lucide-react';

const Registrirajse = () => {
    return (
        <div id="registrirajse-page">
            <div id="registrirajse-page-header">
                Flow<span id="registrirajse-track">Track</span>
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
                            <User className="registrirajse-icon"/> Unesite svoje korisničko ime:
                        </span>
                        <input type="text" placeholder="Korisničko ime..." className="registrirajse-unosi-korisnika"/>
                    </div>
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <Mail className="registrirajse-icon"/> Unesite svoju E-Mail adresu:
                        </span>
                        <input type="email" placeholder="unesite@email.com" className="registrirajse-unosi-korisnika"/>
                    </div>
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <Lock className="registrirajse-icon"/>Unesite svoju lozinku:
                        </span>
                        <input type="password" placeholder="Vaša lozinka..." className="registrirajse-unosi-korisnika"/>
                    </div>
                    <div className="registrirajse-input">
                        <span className="registrirajse-label">
                            <Lock className="registrirajse-icon"/>Potvrdite svoju lozinku:
                        </span>
                        <input type="password" placeholder="Ponovite vašu lozinku..." className="registrirajse-unosi-korisnika"/>
                    </div>
                </div>
                <div id="registrirajse-button">
                    REGISTRIRAJ SE
                </div>
                <div id="registrirajse-footer-holder">
                    <div id="registrirajse-footer">
                        Već imate korisnički račun? <a href="/" id="prijava-link">Prijavite se!</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registrirajse;