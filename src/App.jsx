import { useState, useRef, useEffect } from "react";

const SAMPLE_CATEGORIES = [
  { id: 1, name: "cat1", dailyTimes: { "2026-03-21": 1200, "2026-03-28": 1600 } },
  { id: 2, name: "cat2", dailyTimes: { "2026-03-21": 12000, "2026-03-28": 4500 } },
  { id: 3, name: "cat3", dailyTimes: { "2026-03-21": 6000, "2026-03-27": 8000 } },
];


export default function TodoPage() {
  const [value, setValue] = useState(0);
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("null");
  const [timerOn, setTimerOn] = useState(false);



  useEffect(
    () => {

      const interval = setInterval(() => {

        if (timerOn) {
          console.log(1);
          const todaysDate = new Date().toISOString().slice(0, 10)
          setCategories(prev => prev.map(t => (t.id == selectedCategory ? { ...t, dailyTimes: { ...t.dailyTimes, [todaysDate]: (t.dailyTimes[todaysDate] ? t.dailyTimes[todaysDate] : 0) + 1 } } : t)));

        }

      }, 1000);

      return () => clearInterval(interval);

    }, [timerOn, selectedCategory]
  );

  return (
    <div style={styles.background}>
      <div style={styles.pageHold}>
        <div style={styles.mainProgressHold}>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressBarFill,
              width: `${Math.round((1 / 100) * 100)}%`
            }}>
            </div>
          </div>
        </div>
        <div style={styles.measurementPanel}>
          <button style={styles.focusButton}
            onClick={() => setTimerOn(t => !t)}>{(timerOn ? "true" : "false")}</button>
          <div style={styles.selectionPanel}>
            {categories.map(category => {
              const selected = category.id === selectedCategory;
              return (
                <button
                  key={category.id}
                  style={{ ...styles.categoryButton, ...(selected ? styles.categoryButtonSelected : {}) }}
                  onClick={() => setSelectedCategory(category.id)}>{category.name}</button>
              );
            }
            )}
          </div>
          {String.toString(categories[1])}
        </div>
   
        <div style={styles.measurementPanel}>

        </div>
      </div>
    </div>

  );
}

const styles = {
  background: {
    position: "fixed",
    inset: 0,
    background: "#979797",
    backgroundImage:
      "linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    zIndex: 0
  },

  pageHold: {
    background: "#878787",
    maxWidth: 800,
    margin: "auto",
    minHeight: "100vh",
    padding: "20px 20px 20px"
  },

  mainProgressHold: {
    background: "#ef1212",
    padding: "10px 10px 10px",
    marginBottom: "20px"
  },

  progressBar: {
    background: "#399d3e",
    borderRadius: "200px",
  },

  progressBarFill: {
    background: "#155b18",
    borderRadius: "200px",
    height: "30px",
    overflow: "hidden"
  },

  measurementPanel: {
    borderRadius: "20px",
    padding: "20px",
    background: "#aa2929",
    maxWidth: 400,
    margin: "auto auto 30px auto"
  },

  focusButton: {
    marginBottom: 30
  },

  selectionPanel: {
    borderRadius: "20px",
    padding: "20px",
    background: "#29aa36",
    maxWidth: 400,
    margin: "0 auto",
    display: "flex",
    flexWrap: "wrap"
  },

  categoryButton: {

  },

  categoryButtonSelected: {
    background: "red"
  }

};