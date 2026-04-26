import { useState, } from "react";

import { Columns3Cog, Send } from 'lucide-react';
import { getCookie, isValidPassword, isValidUsername } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const [text, setText] = useState(null);
    const [changePasswordDialog, setChangePasswordDialog] = useState(null);
    const [changeUsernameDialog, setChangeUsernameDialog] = useState(null);
    const [password, setPassword] = useState(null);
    const [newPassword, setNewPassword] = useState(null);
    const [repeatNewPassword, setRepeatNewPassword] = useState(null);
    const [newUsername, setNewUsername] = useState(null);

    function changePassword() {
        setChangePasswordDialog(true);
    }

    function changeUsername() {
        setChangeUsernameDialog(true);
    }

    const resetPasswordInputs = () => {
        setPassword(null);
        setNewPassword(null);
        setRepeatNewPassword(null);
        setChangePasswordDialog(false);
        setChangeUsernameDialog(false);
        setNewUsername(null);
        setText(null);
    }

    const sendPasswordChange = async () => {

        if (!isValidPassword(password)) {
            setChangePasswordDialog(false);
            setText("Neispravna trenutna lozinka");
            return;
        }

        if (!isValidPassword(newPassword)) {
            setChangePasswordDialog(false);
            setText("Lozinka se mora sastojati od barem jednog malog, velikog slova i broja, bez razmaka i posebnih karaktera te duljine između 8 i 50 karaktera");
            return;
        }

        if (!isValidPassword(repeatNewPassword)) {
            setChangePasswordDialog(false);
            setText("Lozinka se mora sastojati od barem jednog malog, velikog slova i broja, bez razmaka i posebnih karaktera te duljine između 8 i 50 karaktera");
            return;
        }

        if (newPassword !== repeatNewPassword) {
            setChangePasswordDialog(false);
            setText("Potrebno je unjeti podudarajuće lozinke");
            return;
        }

        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
            const res = await fetch(`/change_password`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json",
                    "X-CSRF-Token": getCookie("csrf_token")
                },
                body: JSON.stringify({ old: password, new: newPassword })
            });
            const data = await res.json();

            if (data.message == "success") {
                //navigate("/");

                setText("Uspješno je promijenjena lozinka");
            } else if (data.message == "wrong_password") {

                setText("Neispravna stara lozinka");
            }

        } catch (error) {
            // alert("Došlo je do pogreške tijekom registracije");

            setText("Došlo je do pogreške tijekom registracije");
            console.error('Error posting data:', error);
        }

        setChangePasswordDialog(false);
        setPassword(null);
        setNewPassword(null);
        setRepeatNewPassword(null);
    }

        const sendUsernameChange = async () => {

        if (!isValidUsername(newUsername)) {
            setChangeUsernameDialog(false);
            setText("Neispravna trenutna lozinka");
            return;
        }

        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
            const res = await fetch(`/change_username`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json",
                    "X-CSRF-Token": getCookie("csrf_token")
                },
                body: JSON.stringify({ password: password, new_name: newUsername })
            });
            const data = await res.json();

            if (data.message == "success") {
                //navigate("/");
                setText("Uspješno je promijenjeno korisničko ime");
            } else if (data.message == "wrong_password") {
                setText("Neispravna stara lozinka");
            }

        } catch (error) {
            // alert("Došlo je do pogreške tijekom registracije");

            setText("Došlo je do pogreške tijekom registracije");
            console.error('Error posting data:', error);
        }
        
        setChangeUsernameDialog(false);
        setPassword(null);
        setNewPassword(null);
        setRepeatNewPassword(null);
    }

    const deleteCategories = async () => {
        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
            const res = await fetch(`/delete_categories`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json",
                    "X-CSRF-Token": getCookie("csrf_token")
                },
                body: JSON.stringify({ password: password, new_name: newUsername })
            });
            const data = await res.json();

            if (data.message == "success") {
                //navigate("/");
                setText("Uspješno su izbrisane kategorije");
            } else {
                setText("Došlo je do poteškoća pri brisanju kategorija");
            }

        } catch (error) {
            // alert("Došlo je do pogreške tijekom registracije");

            setText("Došlo je do pogreške tijekom registracije");
            console.error('Error posting data:', error);
        }
    }

    const deleteTasks = async () => {
        try {
            // const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
            const res = await fetch(`/delete_tasks`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json",
                    "X-CSRF-Token": getCookie("csrf_token")
                },
                body: JSON.stringify({ password: password, new_name: newUsername })
            });
            const data = await res.json();

            if (data.message == "success") {
                //navigate("/");
                setText("Uspješno su izbrisani zadaci");
            } else {
                setText("Došlo je do poteškoća pri brisanju zadataka");
            }

        } catch (error) {
            // alert("Došlo je do pogreške tijekom registracije");

            setText("Došlo je do pogreške tijekom registracije");
            console.error('Error posting data:', error);
        }
    }

    return (
        <div style={styles.background}>
            <div style={styles.pageHold}>
                <div style={styles.backgroundImg} />

                <div style={styles.editHolder}>
                    <div style={styles.passwordChangeHolder}>
                        <span style={styles.passwordChangeText}>Promijeni lozinku</span>
                        <button
                            onClick={() => changePassword()}
                            style={styles.changePassword}>Promijeni lozinku</button>
                    </div>
                    <div style={styles.passwordChangeHolder}>
                        <span style={styles.passwordChangeText}>Promijeni korisničko ime</span>
                        <button
                            onClick={() => changeUsername()}
                            style={styles.changeUsername}>Promijeni korisničko ime</button>
                    </div>
                    <div style={styles.passwordChangeHolder}>
                        <button
                            onClick={() => deleteCategories()}
                            style={styles.changeUsername}>Obriši sve kategorije</button>
                        <button
                            onClick={() => deleteTasks()}
                            style={styles.changeUsername}>Obriši sve zadadke</button>
                    </div>
                </div>

                {changePasswordDialog ? (<div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.dialogContent}>
                            <label style={styles.passwordInputLabel}>Unesi lozinku</label>
                            <input 
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                style={styles.passwordInput} type="password" placeholder="Trenutna lozinka"></input>
                            <input 
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                                style={styles.passwordInput} type="password" placeholder="Nova lozinka"></input>
                            <input 
                                onChange={(e) => setRepeatNewPassword(e.target.value)}
                                value={repeatNewPassword}
                            style={styles.passwordInput} type="password" placeholder="Ponovljena nova lozinka"></input>
                        </div>
                        <div style={styles.dialogButtonHolder}>
                        <div
                            onClick={() => resetPasswordInputs()}
                            style={styles.dialogButtonSmall}>
                            ODUSTANI</div>

                        <div
                            onClick={() => sendPasswordChange()}
                            style={styles.dialogButtonSmall}>
                            OK</div>
                        </div>
                    </div>

                </div>) : null}
                    {changeUsernameDialog ? (<div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.dialogContent}>
                            <label style={styles.passwordInputLabel}>Unesi korisničko ime</label>
                            <input 
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                style={styles.passwordInput} type="password" placeholder="Trenutna lozinka"></input>
                            <input 
                                onChange={(e) => setNewUsername(e.target.value)}
                                value={newUsername}
                                style={styles.passwordInput} type="text" placeholder="Novo ime"></input>

                        </div>
                        <div style={styles.dialogButtonHolder}>
                        <div
                            onClick={() => resetPasswordInputs()}
                            style={styles.dialogButtonSmall}>
                            ODUSTANI</div>

                        <div
                            onClick={() => sendUsernameChange()}
                            style={styles.dialogButtonSmall}>
                            OK</div>
                        </div>
                    </div>

                </div>) : null}
                {text ? (<div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.dialogContent}>
                            <label style={styles.passwordInputLabel}>{text}</label>
                        </div>

                        <div
                            onClick={() => setText(null)}
                            style={styles.dialogButton}>
                            OK</div>
                    </div>

                </div>) : null}
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

    editHolder: {
        height: "500px",
        maxWidth: "900px",
        background: "#595959",
        margin: "auto",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        padding: "30px",
        gap: "10px"
    },

    passwordChangeHolder: {
        background: "#AAAAAA",
        borderRadius: "20px",
        display: "flex",
        justifyContent: "center"
    },

    changePassword: {
        width: "100px",
        height: "40px",
        backgroundColor: "#616161",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Lilita One', sans-serif",
        fontSize: "15px",
        fontWeight: "bold",
        color: "white",
        transition: "transform 0.3s ease, background-color 0.3s ease",
        margin: "10px"
    },

    changeUsername: {
        width: "200px",
        height: "40px",
        backgroundColor: "#616161",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Lilita One', sans-serif",
        fontSize: "15px",
        fontWeight: "bold",
        color: "white",
        transition: "transform 0.3s ease, background-color 0.3s ease",
        margin: "10px"
    },

    passwordChangeText: {
        margin: "auto 30px auto 30px",
        color: "#000000",
        fontFamily: "'Lilita One', sans-serif",
        fontSize: "20px",
    },

    dialogText: {
        textDecoration: "none",
        color: "#ffffff",
        fontSize: "30px"
    },

    dialogContent: {
        display: "flex",
        flexDirection: "column"
    },

    dialogButton: {
        width: "300px",
        height: "50px",
        backgroundColor: "#1d1d1d",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Lilita One', sans-serif",
        fontSize: "15px",
        fontWeight: "bold",
        color: "white",
        transition: "transform 0.3s ease, background-color 0.3s ease"
    },

    dialogButtonSmall: {
        width: "100px",
        height: "50px",
        backgroundColor: "#1d1d1d",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Lilita One', sans-serif",
        fontSize: "15px",
        fontWeight: "bold",
        color: "white",
        transition: "transform 0.3s ease, background-color 0.3s ease"
    },

    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20,20,40,0.35)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "slideIn 0.2s both"
    },

    modal: {
        background: "#444444",
        borderRadius: "24px",
        padding: "32px 28px 28px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        animation: "slideIn 0.28s cubic-bezier(.4,0,.2,1) both",
        display: "flex",
        flexDirection: "column",
        height: "400px",
        justifyContent: "space-between",
        alignItems: "center",
    },

    passwordInput: {
        borderRadius: "10px",
        padding: "10px",
        marginTop: "20px"
    },

    passwordInputLabel: {
        margin: "auto",
        textDecoration: "none",
        color: "#ffffff",
        fontSize: "30px"
    },

    dialogButtonHolder: {
        display: "flex",
        width: "80%",
        justifyContent: "space-between"
    }
}

export default Settings;


