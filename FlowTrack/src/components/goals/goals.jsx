import { useState, useEffect } from "react";
import { getCookie } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";
import { Send, X, FileText } from 'lucide-react';

const Quiz = () => {

    const [category, setCategory] = useState(-1);
    const [quantity, setQuantity] = useState([0, 0]);
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);
    const [datetime, setDatetime] = useState(null);
    const [goals, setGoals] = useState([]);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [name, setName] = useState(null);

    useEffect(() => {
        getGoals();
    }, []);

    const getGoals = async () => {
        const res = await fetch("/get_goals", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": getCookie("csrf_token")
            },
        });
        const data = await res.json();
        setGoals(data.goals);
        console.log(data.goals);
    }

    function abortNewGoal() {
        setShowAddGoal(false);
    }

    const confirmNewGoal = async () => {
        console.log(datetime)
        if (category == null || category == -1) {
            return;
        }
        if (category == 0) {

            if (!(quantity.at(0) + quantity.at(1) > 0)) {
                return;
            }
        } else {
            if (!(quantity.at(0) > 0 && quantity.at(0) < 100)) {
                return;
            }
        }
        if (datetime == null) {
            return;
        }
        const due = new Date(datetime) < new Date();
        if (due) {
            return;
        }

        if (name == null) {
            return;
        }

        console.log("quantity")
        console.log((parseInt(quantity.at(0)) * 60 + parseInt(quantity.at(1))))

        const goal = {
            category: parseInt(category),
            quantity: parseInt(category == 0 ? (parseInt(quantity.at(0)) * 60 + parseInt(quantity.at(1))) : quantity.at(0))*60,
            deadline: datetime,
            name: name
        }

        /* setCategory(-1);
        setQuantity([0, 0]);
        setDatetime(null);
        setName(null); */
        setShowAddGoal(false);

        console.log(goal);
        setGoals(prev => [...prev, goal]);
        const res = await fetch("/add_goal", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(goal),
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": getCookie("csrf_token")
            },
        });
        const data = await res.json();

    }

    const removeGoal = async (id) => {
        const res = await fetch(`/remove_goal?id=${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": getCookie("csrf_token")
            },
        });
        const data = await res.json();

        setGoals(prev => prev.filter(goal => goal.id != id));
    }

    function advancedTime(from) {
        const hrs = Math.floor(from / 3600);
        const min = Math.floor((from % 3600) / 60);
        const sec = Math.floor(from % 60);

        return `${hrs}h ${min}m ${sec}s`;
    }

    function formatDatetime(str) {
        const d = new Date(str);
        const pad = (n) => String(n).padStart(2, "0");

        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    return (
        <div style={styles.background}>
            <div style={styles.pageHold}>
                <div style={styles.backgroundImg} />
                <div style={styles.newButtonHolder}>

                    <button
                        onClick={() => setShowAddGoal(true)}
                        style={styles.goalButton}>Novi cilj</button>
                </div>

                <div style={styles.goalCardHolder}>
                    {
                        goals.length > 0 ? goals.map(
                            goal => {
                                const due = new Date(goal.deadline) < new Date();

                                return (<div
                                    style={styles.goalCard}>
                                    <div style={styles.infoHolder}>
                                        <div style={styles.goalCardName}>{goal.name}</div>
                                        <button
                                            style={styles.xbutton}
                                            onClick={() => removeGoal(goal.id)}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <div style={styles.goalCardProgress}>
                                        <div style={{
                                            ...styles.goalCardProgressFill,
                                            width: `${Math.min(Math.round(goal.progress / goal.quantity * 100), 100)}%`,
                                            background: due ? "#ff0000" : "#11ff00"
                                        }}>

                                        </div>
                                    </div>
                                    <div>{"Napravljeno: " + (goal.category == 0 ? advancedTime(goal.progress) : goal.progress) + " od " + (goal.category == 0 ? advancedTime(goal.quantity) : goal.quantity)}</div>
                                    {due ?
                                        <div>Rok je istekao</div> : <div>{"Rok: " + formatDatetime(goal.deadline)}</div>}
                                </div>

                                )
                            }) : <div>Nema ciljeva</div>
                    }
                </div>

                {showAddGoal ? <div style={styles.overlay}>
                    <div style={styles.modal}>

                        <div style={styles.categorySelectionHolder}>

                            <div style={styles.categorySelectionLabel}>Unesite ime cilja:</div>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                min="0"
                                max="100"
                                placeholder="Ime cilja"
                                style={styles.categorySelection}>

                            </input>

                        </div>


                        <div style={styles.categorySelectionHolder}>

                            <div style={styles.categorySelectionLabel}>Odaberite kategoriju:</div>

                            <select style={styles.categorySelection}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="a">
                                <option value="-1">ODABERI</option>
                                <option value="0">Vrijeme učenja</option>
                                <option value="1">Broj odrađenih zadataka</option>
                                <option value="2">Broj kvizova 80%+</option>
                            </select>

                        </div>

                        {category == 0 ? <div style={styles.categorySelectionHolder}>

                            <div style={styles.categorySelectionLabel}>Unesite željeni iznos (h,min):</div>
                            <input
                                value={quantity.at(0)}
                                onChange={(e) => setQuantity(prev => [e.target.value, quantity.at(1)])}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="h"
                                style={styles.categorySelection}>

                            </input>
                            <input
                                value={quantity.at(1)}
                                onChange={(e) => setQuantity(prev => [quantity.at(0), e.target.value])}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="min"
                                style={styles.categorySelection}>

                            </input>
                        </div> : <div style={styles.categorySelectionHolder}>

                            <div style={styles.categorySelectionLabel}>Unesite željeni iznos:</div>
                            <input
                                value={quantity.at(0)}
                                onChange={(e) => setQuantity(prev => [e.target.value, quantity.at(1)])}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="h"
                                style={styles.categorySelection}>

                            </input>

                        </div>}

                        <div style={styles.categorySelectionHolder}>
                            <div style={styles.categorySelectionLabel}>Rok cilja:</div>
                            <input
                                style={styles.categorySelection}
                                type="datetime-local"
                                value={datetime} onChange={(e) => setDatetime(e.target.value)} />

                        </div>
                        <div style={styles.dialogButtonHolder}>
                            <div
                                onClick={() => abortNewGoal()}
                                style={styles.dialogButtonSmall}>
                                ODUSTANI</div>

                            <div
                                onClick={() => confirmNewGoal()}
                                style={styles.dialogButtonSmall}>
                                OK</div>
                        </div>
                    </div>

                </div> : <></>}
            </div>
        </div>
    );
}

const styles = {
       background: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap:10,
    zIndex: 0,
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
    background: "#ff000000",
    //margin: "100px 200px 10px",
    minHeight: "100vh",
    padding: "20px 20px 20px",
    position: "relative",
  },

    newButtonHolder: {
        width: "100px",
        height: "100px",
        background: "#636363",
        display: "flex",
        margin: "auto",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10px",
        marginBottom: "20px"
    },

    goalButton: {
        padding: "10px",
        borderRadius: "10px",
        border: "3px solid #515151"

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
        height: "410px",
        justifyContent: "flex-start",
        gap: "30px",
        alignItems: "center",
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

    dialogButtonHolder: {
        display: "flex",
        width: "80%",
        justifyContent: "space-between"
    },

    categorySelectionHolder: {
        background: "#00000000",
        padding: "10px",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    categorySelection: {
        padding: "10px",
        borderRadius: "10px",
        border: "4px solid #000000"
    },

    categorySelectionLabel: {
        color: "#ffffff"
    },

    goalCardHolder: {
        background: "#64646400",
        display: "flex",
        flexWrap: "wrap",
        gap: 10
    },

    goalCard: {
        background: "#a3a3a3",
        width: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        gap: "10px",
        borderRadius: "20px"
    },

    goalCardProgress: {
        background: "#3d3d3d",
        width: "90%",
        borderRadius: "10px"
    },

    goalCardProgressFill: {
        height: "10px",
        borderRadius: "10px"
    },

    infoHolder: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        width: "100%"
    },

    xbutton: {
        padding: "10px",
        borderRadius: "10px"
    }
};

export default Quiz;