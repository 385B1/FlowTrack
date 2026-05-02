import { useState, useEffect } from "react";

import { Send, X, FileText } from 'lucide-react';
import { getCookie } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";

const Chatbot = () => {
    const [requestText, setRequestText] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    const [droppedFiles, setDroppedFiles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const handleDragEnter = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragCounter((prev) => prev + 1);
            setIsDragging(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragCounter((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    setIsDragging(false);
                    return 0;
                }
                return next;
            });
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            setDragCounter(0);

            const files = Array.from(e.dataTransfer.files);
            if (files.length === 0) return;

            setDroppedFiles((prev) => {
                const existingNames = new Set(prev.map((f) => f.name));
                const newFiles = files.filter((f) => !existingNames.has(f.name));
                return [...prev, ...newFiles];
            });

            console.log(droppedFiles)
        };

        window.addEventListener("dragenter", handleDragEnter);
        window.addEventListener("dragleave", handleDragLeave);
        window.addEventListener("dragover", handleDragOver);
        window.addEventListener("drop", handleDrop);

        return () => {
            window.removeEventListener("dragenter", handleDragEnter);
            window.removeEventListener("dragleave", handleDragLeave);
            window.removeEventListener("dragover", handleDragOver);
            window.removeEventListener("drop", handleDrop);
        };
    }, [dragCounter]);

    function removeFile(name) {
        setDroppedFiles((prev) => prev.filter((f) => f.name !== name));
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }



    async function sendRequest() {
        if (requestText == "") return;
        setLoading(true);
        setRequestText("");

        const formData = new FormData();

        // text fields
        formData.append("message", requestText);
        formData.append("id", localStorage.getItem("id"));

        // files
        for (let file of droppedFiles) {
            formData.append("files", file);
        }

        const res = await fetch(`/send_request`, {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CSRF-Token": getCookie("csrf_token")
                // ❗ DO NOT set Content-Type manually
            },
            body: formData
        });
        const data = await res.json();

        setDroppedFiles(null);

        if (data?.detail?.length > 0) {
            localStorage.setItem("loggedin", "false");
            navigate("/");
        } else {
            setPrompts([...prompts, requestText]);
            setAnswers([...answers, data["message"]]);
            setDroppedFiles([]);
            setLoading(false);
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
                {loading ? <div style={styles.loading}>Pričekajte</div> : null}

                <div style={styles.inputArea}>
                    {droppedFiles.length > 0 && (
                        <div style={styles.filesStrip}>
                            {droppedFiles.map((file) => (
                                <div key={file.name} style={styles.fileChip}>
                                    <FileText size={14} style={{ flexShrink: 0, color: "#aaa" }} />
                                    <div style={styles.fileInfo}>
                                        <span style={styles.fileName}>{file.name}</span>
                                        <span style={styles.fileSize}>{formatSize(file.size)}</span>
                                    </div>
                                    <button
                                        style={styles.removeBtn}
                                        onClick={() => removeFile(file.name)}
                                        title="Remove file"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={styles.label}>
                        <input
                            value={requestText}
                            onChange={(e) => setRequestText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.target.value.trim() !== "") {
                                    sendRequest();
                                }
                            }}
                            style={styles.labelinput}
                            type="text"
                            placeholder="Upitaj..." />

                        <div
                            onClick={() => sendRequest()}
                            style={styles.submit}><Send /></div>
                    </div>
                </div>
            </div>

            {isDragging ? <div style={styles.overlay}>
                <div style={styles.content}>
                    📂 Prenesi datoteku
                </div>
            </div> : <></>}
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

    inputArea: {
        position: "fixed",
        bottom: 10,
        right: 300,
        left: 300,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },

    filesStrip: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(30, 30, 30, 0.85)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    fileChip: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "6px 10px 6px 10px",
        maxWidth: "220px",
        minWidth: "0",
    },

    fileInfo: {
        display: "flex",
        flexDirection: "column",
        minWidth: "0",
        flex: 1,
    },

    fileName: {
        color: "#e0e0e0",
        fontSize: "12px",
        fontWeight: "500",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    fileSize: {
        color: "#777",
        fontSize: "10px",
        marginTop: "1px",
    },

    removeBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.08)",
        border: "none",
        borderRadius: "6px",
        color: "#aaa",
        cursor: "pointer",
        padding: "3px",
        flexShrink: 0,
        transition: "background 0.15s, color 0.15s",
    },

    label: {
        height: "100px",
        background: "#ff040400",
        display: "flex",
        alignItems: "center",
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
        gap: "10px",
        minWidth: "400px"
    },

    prompt: {
        width: "90%",
        padding: "30px",
        background: "#b4b4b4",
        borderRadius: "100px 10px 10px 100px",
        display: "flex",
        justifyContent: "flex-end",
    },

    answer: {
        width: "90%",
        padding: "30px",
        background: "#626262",
        borderRadius: "10px 100px 100px 10px",
        display: "flex",
        justifyContent: "flex-start"
    },

    bottom: {
        height: "120px",
        width: "50px",
        background: "#fff20000",
        position: "absolute"
    },

    loading: {
        height: "100px",
        width: "100px",
        background: "#1b1b1b",
        position: "fixed",
        bottom: 30,
        right: 30,
        borderRadius: 20,
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },

    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
    },

    content: {
        color: "#fff",
        fontSize: "32px",
        fontWeight: "bold",
        border: "2px dashed #fff",
        padding: "40px 80px",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.1)"
    }
}

export default Chatbot;