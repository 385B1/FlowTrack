import { useState, useRef, useEffect } from "react";

const SAMPLE_CATEGORIES = [
  { id: 1, name: "cat1", dailyTimes: { "2026-03-21": 1100, "2026-03-22": 200, "2026-03-23": 100, "2026-03-24": 400, "2026-03-25": 800, "2026-03-26": 1200, "2026-03-27": 1200, "2026-03-28": 1200, "2026-03-29": 1600, "2026-03-30": 1600 } },
  { id: 2, name: "cat2", dailyTimes: { "2026-03-21": 12000, "2026-03-28": 4500 } },
  { id: 3, name: "cat3", dailyTimes: { "2026-03-21": 6000, "2026-03-27": 8000 } },
];


export default function TodoPage() {
  const [value, setValue] = useState(0);
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [timerOn, setTimerOn] = useState(false);
  const [timeScales, setTimeScales] = useState(null);


  /* increment every second if the timer is on */
  useEffect(
    () => {

      const interval = setInterval(() => {

        if (timerOn) {
          console.log(1);
          const todaysDate = new Date().toISOString().slice(0, 10)
          setCategories(prev => prev.map(t => (t.id == selectedCategory ? { ...t, dailyTimes: { ...t.dailyTimes, [todaysDate]: (t.dailyTimes[todaysDate] ? t.dailyTimes[todaysDate] : 0) + 100 } } : t)));

        }

      }, 1000);

      return () => clearInterval(interval);

    }, [timerOn, selectedCategory]
  );

  var timeScalesV = [];
  var maxTime;
  var maxTimeAdjusted;

  function determineScale() {
    maxTime = Object.values(maxTimeCategories.find(t => t[selectedCategory] != null))[0];

    if (maxTime > 3600)  {

      maxTimeAdjusted = Math.ceil(maxTime / 3600);
      const interval = maxTimeAdjusted / 5;

      timeScalesV = [];

      for (var i = 1; i < 6; i++) {
    
        timeScalesV.push(i * interval);
        
      }
      
      timeScalesV = timeScalesV.map(t => Math.round(t * 100) / 100);
      timeScalesV.reverse();

      return (
            timeScalesV.map(t => (
              <div key={t} style={styles.scaleMark}> {t}h
            </div>
            ))
      );
    }

    if (maxTime < 3600)  {

      maxTimeAdjusted = Math.ceil(maxTime / 60);
      maxTimeAdjusted = Math.ceil(maxTimeAdjusted / 10) * 10;
      const interval = maxTimeAdjusted / 5;

      timeScalesV = [];

      for (var i = 1; i < 6; i++) {
    
        timeScalesV.push(i * interval);
        
      }
      
      timeScalesV = timeScalesV.map(t => Math.round(t * 100) / 100);
      timeScalesV.reverse();

      return (
            timeScalesV.map(t => (
              <div key={t} style={styles.scaleMark}> {t}m
            </div>
            ))
      );
    }



  }



  /* array of max time per category for hraph normalization */
  const maxTimeCategories = categories.map(t => (

    { [parseInt(t.id)]: Math.max(...Object.values(t.dailyTimes)) }

  ));

  return (
    <div style={styles.background}>
      <div style={styles.pageHold}>

        {/* glavni progress bar */}

        <div style={styles.mainProgressHold}>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressBarFill,
              width: `${Math.round((1 / 100) * 100)}%`
            }}>
            </div>
          </div>
        </div>

        {/* panel for category selection and timer button */}

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

        {/* main graphs */}

        <div>{JSON.stringify(maxTimeCategories)}</div>

        <div>a{JSON.stringify(Object.values(maxTimeCategories.find(t => t[selectedCategory] != null))[0])}</div>

        <div>a{selectedCategory}</div>

        <div style={styles.mainGraphPanel}>
          <div style={styles.mainScaleGraphHolder}>
            <div style={styles.scale}>

              {determineScale()}

            </div>
            <div style={styles.mainGraphHolder}>
              {Object.entries(categories.find(
                t => (selectedCategory ? (t.id === selectedCategory) : true)

              ).dailyTimes)
                .slice(-20)
                .map(([date, time]) =>
                (
                  <div key={date}
                    style={{
                      ...styles.graphPillar,
                      height: `${Math.round(time / (maxTime > 3600 ? timeScalesV[0] * 3600 : timeScalesV[0] * 60) * 100)}%`
                    }
                    }></div>
                )
                )

              }
            </div>
            {timeScalesV[4]}
          </div>

          <div style={styles.mainGraphX}>

          </div>

        </div>
      </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F1EC; }

        `}</style>
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
  },

  mainGraphPanel: {
    borderRadius: "20px",
    padding: "20px",
    background: "#522525",
    maxWidth: 400,
    margin: "auto auto 30px auto"
  },

  mainScaleGraphHolder: {
    borderRadius: "20px",
    background: "#255247",
    maxWidth: 400,
    margin: "auto auto 10px auto",
    display: "flex",
    justifyContent: "flex-start",
    height: 300,
    gap: 10,
    
    
  },

  mainGraphHolder: {
    borderRadius: "20px",
    padding: "30px",
    background: "#524925",
    maxWidth: 400,
    minWidth: 300,
    display: "flex",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100%",
    backgroundImage: "linear-gradient(rgba(0, 0, 0, 1) 1px, rgb(255, 255, 255) 1px)",
    backgroundSize: "30px 30px"
  },

    scale: {
    borderRadius: "20px",
    padding: "3px",
    background: "#524925",
    maxWidth: 50,
    minWidth: 35,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start",
    height: "100%"
  },

      scaleMark: {
    maxWidth: 2,
    minWidth: 30,
    marginTop: 20,
    fontSize: 10,
    height: 30
  },

  graphPillar: {
    background: "#62aa87",
    zIndex: 100,
    width: 30

  },

  mainGraphX: {
    borderRadius: "20px",
    padding: "20px",
    background: "#253652",
    maxWidth: 400,
    margin: "auto auto 30px auto",
    display: "flex",
    gap: 10,
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 100
  },

};