import "./prijavise.css";
import { Mail } from 'lucide-react';
import { Lock } from 'lucide-react';
import { Bolt } from 'lucide-react';

const Prijavise = () => {
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
                            <Mail className="prijavise-icon"/> Unesite svoju E-Mail adresu:
                        </span>
                        <input type="email" placeholder="unesite@email.com" className="unosi-korisnika"/>
                    </div>
                    <div className="prijavise-input">
                        <span className="prijavise-label">
                            <Lock className="prijavise-icon"/>Unesite svoju lozinku:
                        </span>
                        <input type="password" placeholder="Vaša lozinka..." className="unosi-korisnika"/>
                    </div>
                </div>
                <div id="prijavise-button">
                    PRIJAVI SE
                </div>
                <div id="footer-holder">
                <div id="prijavise-footer">
                    Nemate korisnički račun? <a href="/registrirajse" id="registracija-link">Registrirajte se!</a>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Prijavise;