import { useState, } from "react";

import { Send } from 'lucide-react';
import { getCookie } from '../credentialValidation.jsx';


const Chatbot = () => {
    const [requestText, setRequestText] = useState(null);

    async function sendRequest() {

        const res = await fetch(`/send_request`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": getCookie("csrf_token")
            },
            body: JSON.stringify({ message: requestText, id: localStorage.getItem("id") })
        });
        const data = await res.json();

    }


    return (
        <div style={styles.background}>
            <div style={styles.pageHold}>
                <div style={styles.backgroundImg} />
                <div style={styles.description}>a</div>
                <div style={styles.label}>
                    <input
                        value={requestText}
                        onChange={(e) => setRequestText(e.target.value)}
                        style={styles.labelinput}
                        type="text"
                        placeholder="Upitaj..." />

                    <div
                        onClick={() => sendRequest()}
                        style={styles.submit}><Send stlye={{
                            size: 32,
                            background: "#0015ff"
                        }} /></div>
                </div>
            </div>
        </div>

    );
}

const styles = {
    background: {
        position: "absolute",
        inset: 0,
        background: "#00000000",
        margin: "0 50px",
        zIndex: 300
    },

    backgroundImg: {
        position: "fixed",
        inset: 0,
        background: "#979797",
        backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        zIndex: -10
    },

    pageHold: {
        background: "#0a4d1300",

        margin: "100px 200px 10px",
        minHeight: "100vh",
        padding: "20px 20px 20px",
        position: "relative",
    },

    label: {
        height: "100px",
        background: "#ff040400",
        position: "fixed",
        bottom: 10,
        right: 300,
        left: 300,
        display: "flex",
        alignItems: "center"
    },

    labelinput: {
        height: "100%",
        width: "100%",
        borderRadius: "30px"
    },

    submit: {
        position: "absolute",
        right: 10,
        width: "50px",
        height: "50px",
        background: "#656565",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10px"
    },

    description: {
        background: "#ff000009",
        width: "100%",
        height: "200px",
        position: "fixed",
        bottom: "200px"

    }
}

export default Chatbot;


