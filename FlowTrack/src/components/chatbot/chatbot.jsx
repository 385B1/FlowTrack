import { useState, } from "react";

import { Columns3Cog, Send } from 'lucide-react';
import { getCookie } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";

const Chatbot = () => {
    const [requestText, setRequestText] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [answers, setAnswers] = useState([]);
    const navigate = useNavigate();

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

        if (data.detail?.length > 0) {
            localStorage.setItem("loggedin", "false");
            navigate("/");
        } else {
            setRequestText(null);
            setPrompts([...prompts, requestText]);
            setAnswers([...answers, data["message"]]);
        }
    }

    return (
        <div style={styles.background}>
            <div style={styles.pageHold}>
                <div style={styles.backgroundImg} />
                <div style={styles.chat}>{prompts.map(
                    (text, id) => 
                    <>
                    <div style={styles.prompt}>{text}</div>
                    <div style={styles.answer}>{answers.at(id)}</div>
                    </>
                )}</div>
                <div style={styles.bottom}></div>
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

    chat: {
        top: "100px",
        background: "#ff000000",
        width: "100%",
        position: "static",
        bottom: "200px",
        display: "flex",
        flexDirection: "column",
        padding: "30px",
        alignItems: "flex-end",
        gap: "10px"
    },

    prompt: {

        width: "90%",
        padding: "30px",
        background: "#5c5c5c",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "flex-end"
    },

    answer: {
        width: "90%",
        padding: "30px",
        background: "#393939",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "flex-start"
    },

    bottom: {
        height: "120px",
        width: "50px",
        background: "#fff20000",
        position: "absolute"
    }
}

export default Chatbot;


