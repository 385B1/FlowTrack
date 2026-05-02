import { useState, useEffect } from "react";
import { getCookie } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [chosenAnswer, setChosenAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getQuizzes();
  }, []);

  const getQuizzes = async () => {
    try {
      const res = await fetch(`/get_quizzes`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      const data = await res.json();

      if (data?.detail?.length > 0) {
        localStorage.setItem("loggedin", "false");
        navigate("/");
      }

      setQuizzes(data.quizzes);

    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  }

  function openQuiz(quiz) {

    setSelectedQuiz(quiz);
    setCurrentQuestion(0);


    setChosenAnswer(null);
    setScore(0);

    setFinished(false);
    setShowQuiz(true);
  }

  function closeQuiz() {

    setShowQuiz(false);

    setSelectedQuiz(null);

    setChosenAnswer(null);
    setCurrentQuestion(0);
    setScore(0);
    setFinished(false);
  }

  function pickAnswer(i) {

    if (chosenAnswer !== null) return; // already answered
    setChosenAnswer(i);


    if (i === selectedQuiz.quiz.questions[currentQuestion].correct) {

      setScore(prev => prev + 1);
    }
  }

  const updateGoal = async () => {
      const res = await fetch(`/goal_update`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({
            category: 2
          })
      });
  }

  const nextQuestion = async () => {
    const total = selectedQuiz.quiz.questions.length;

    if (currentQuestion + 1 >= total) {

      setFinished(true);

      console.log("finished")

      if (score / total >= 0.8) {
        await updateGoal();
      }
    } else {

      setCurrentQuestion(prev => prev + 1);

      setChosenAnswer(null);
    }
  }

  function getAnswerStyle(i) {

    if (chosenAnswer === null) return styles.answerOption;

    const q = selectedQuiz.quiz.questions[currentQuestion];

    if (i === q.correct) return { ...styles.answerOption, ...styles.answerCorrect };

    if (i === chosenAnswer) return { ...styles.answerOption, ...styles.answerWrong };

    return { ...styles.answerOption, ...styles.answerDimmed };
  }


  const q = selectedQuiz?.quiz.questions[currentQuestion];
  const total = selectedQuiz?.quiz.questions.length;

  return (
    <div style={styles.background}>

      <div style={styles.pageHold}>
        <div style={styles.backgroundImg} />

        <div style={styles.quizzes}>
          {quizzes.length > 0 ? quizzes.map(quiz => (
            <div
              key={quiz.id}
              style={styles.quizcard}
              onClick={() => openQuiz(quiz)}
            >
              {quiz.name}
            </div>
          )) : <div style={{ color: "white" }}>Nema kvizova</div>}
        </div>

        {showQuiz && selectedQuiz && (


          <div style={styles.overlay}>
            <div style={styles.modal}>

              {!finished ? (
                <>
                  {/* progress */}
                  <div style={styles.progressRow}>
                    <span style={styles.progressText}>{currentQuestion + 1} / {total}</span>
                    <div style={styles.progressBarBg}>
                      <div style={{
                        ...styles.progressBarFill,

                        width: `${((currentQuestion + 1) / total) * 100}%`
                      }} />
                    </div>

                  </div>


                  {/* question */}
                  <div style={styles.questionText}>{q.question}</div>


                  {/* answers */}
                  <div style={styles.answersHolder}>
                    {[q.answer_0, q.answer_1, q.answer_2, q.answer_3].map((answer, i) => (
                      <div
                        key={i}
                        style={getAnswerStyle(i)}
                        onClick={() => pickAnswer(i)}
                      >
                        <span style={styles.answerLetter}>
                          {["A", "B", "C", "D"][i]}
                        </span>
                        {answer}

                      </div>
                    ))}
                  </div>

                  {/* reveal message after answering */}
                  {chosenAnswer !== null && (

                    <div style={{
                      ...styles.revealMsg,

                      background: chosenAnswer === q.correct ? "#14532d" : "#7f1d1d"
                    }}>

                      {chosenAnswer === q.correct
                        ? "✓ Točno!"

                        : `✗ Netočno — točan odgovor: ${["A", "B", "C", "D"][q.correct]}`}
                    </div>
                  )}

                  {/* buttons */}
                  <div style={styles.buttonRow}>

                    <div onClick={closeQuiz} style={styles.btnSecondary}>ODUSTANI</div>
                    {chosenAnswer !== null && (

                      <div onClick={nextQuestion} style={styles.btnPrimary}>
                        {currentQuestion + 1 >= total ? "ZAVRŠI" : "SLJEDEĆE →"}

                      </div>
                    )}

                  </div>

                </>
              ) : (

                /* finished screen */
                <>

                  <div style={styles.finishedIcon}>

                    {score === total ? "🏆" : score >= total / 2 ? "👍" : "😬"}
                  </div>
                  <div style={styles.finishedTitle}>Kviz završen!</div>
                  <div style={styles.finishedScore}>
                    {score} / {total} točnih odgovora
                  </div>
                  <div style={styles.finishedPercent}>
                    {Math.round((score / total) * 100)}%

                  </div>

                  <div style={styles.buttonRow}>

                    <div onClick={closeQuiz} style={styles.btnSecondary}>ZATVORI</div>

                    <div onClick={() => openQuiz(selectedQuiz)} style={styles.btnPrimary}>PONOVI</div>
                  </div>
                </>
              )}

            </div>

          </div>
        )}
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
    margin: "100px 200px 10px",
    minHeight: "100vh",
    padding: "20px",
    position: "relative",
  },

  quizzes: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  quizcard: {
    width: "150px",
    height: "100px",
    background: "#1d1d1d",
    color: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "10px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "transform 0.2s ease",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(20,20,40,0.55)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },

  modal: {
    background: "#2a2a2a",
    borderRadius: "24px",
    padding: "36px 32px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  progressRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  progressText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: 600,
  },

  progressBarBg: {
    background: "#444",
    borderRadius: 99,
    height: 6,
    overflow: "hidden",
  },

  progressBarFill: {
    background: "#3b82f6",
    height: "100%",
    borderRadius: 99,
  },

  questionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 1.4,
  },

  answersHolder: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  answerOption: {
    padding: "12px 16px",
    borderRadius: 12,
    background: "#3a3a3a",
    color: "white",
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "2px solid transparent",
  },

  answerCorrect: {
    background: "#14532d",
    border: "2px solid #22c55e",
    cursor: "default",
  },

  answerWrong: {
    background: "#7f1d1d",
    border: "2px solid #ef4444",
    cursor: "default",
  },

  answerDimmed: {
    opacity: 0.4,
    cursor: "default",
  },

  answerLetter: {
    background: "#555",
    borderRadius: 6,
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "bold",
    flexShrink: 0,
  },

  revealMsg: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    padding: "12px",
    borderRadius: 10,
  },

  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },

  btnPrimary: {
    flex: 1,
    height: 48,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },

  btnSecondary: {
    flex: 1,
    height: 48,
    backgroundColor: "#3a3a3a",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#aaa",
    cursor: "pointer",
    fontSize: 14,
  },

  finishedIcon: {
    fontSize: 60,
    textAlign: "center",
  },

  finishedTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },

  finishedScore: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },

  finishedPercent: {
    color: "#3b82f6",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default Quiz;