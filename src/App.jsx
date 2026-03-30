import { useState, useRef, useEffect } from "react";

const SAMPLE_CATEGORIES = [
  { id: 1, name: "cat1", dailyTimes: { "2026-03-21": 1100, "2026-03-22": 200, "2026-03-23": 100, "2026-03-24": 400, "2026-03-25": 800, "2026-03-26": 1200, "2026-03-27": 1200, "2026-03-28": 1200, "2026-03-29": 1600, "2026-03-30": 1800 } },
  { id: 2, name: "cat2", dailyTimes: { "2026-03-21": 12000, "2026-03-28": 4500 } },
  { id: 3, name: "cat3", dailyTimes: { "2026-03-21": 6000, "2026-03-27": 8000 } },
  { id: 4, name: "cat4", dailyTimes: { "2026-03-21": 120, "2026-03-27": 200 } },
];


export default function graphsPage() {
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

  /* convert time in seconds to string and relevant unit */

  function determineTimeUnit(timeInSeconds) {

    if (timeInSeconds > 3600)

      return `${Math.round(timeInSeconds / 3600)}h`;

    if (timeInSeconds > 60)

      return `${Math.round(timeInSeconds / 60)}m`;

    if (timeInSeconds < 60)

      return `${Math.round(timeInSeconds / 1)}s`;


  }

  /* calculate total time for each category */

  function totalPerCategory() {
    const categoryTotals = [];

    categories.map(
      cat => {
        const total = Object.values(cat.dailyTimes).reduce((acc, val) =>
          acc + val, 0);

        categoryTotals.push(

          { id: [cat.id], total: total }
        );

      }
    );

    console.log(JSON.stringify(categoryTotals));

    const totalOfAllCategories = categoryTotals.reduce(
      (acc, val) => acc += val.total, 0
    );

    console.log(totalOfAllCategories);

    return (

      categoryTotals.map(
        (total, index) => (
          <div
            key={index}
            style={{
              ...styles.progressBarFill,
              width: `${Math.round((total.total / totalOfAllCategories) * 100)}%`,
              background: `hsl(${index * 60}, 70%, 50%)`,
              borderBottomRightRadius: index == categoryTotals.length - 1 ? 200 : 0,
              borderTopRightRadius: index == categoryTotals.length - 1 ? 200 : 0,

              borderBottomLeftRadius: index == 0 ? 200 : 0,
              borderTopLeftRadius: index == 0 ? 200 : 0,
            }}>{categories.find(cat => cat.id == total.id).name} {determineTimeUnit(categoryTotals.find(cat => cat.id == total.id).total)}</div>)
      )
    );
  };

  var timeScalesV = [];
  var maxTime;
  var maxTimeAdjusted;
  var collected = 0;

  /* return divs representing time marks on the main graph scale */

  function determineScale(from) {
    maxTime = Object.values(getMaxTimeCategories(from).find(t => t[selectedCategory] != null))[0];


    console.log(maxTime);

    if (maxTime == -Infinity) {
      maxTime = 0;
    }

    if (maxTime > 3600) {

      maxTimeAdjusted = Math.ceil(maxTime / 3600);
      const interval = maxTimeAdjusted / 5;

      timeScalesV = [];

      for (var i = 1; i < 6; i++) {

        timeScalesV.push(i * interval);

      }
      timeScalesV = timeScalesV.map(t => Math.round(t * 100) / 100);
      timeScalesV.reverse();

      timeScalesV.push(0);

      return (
        timeScalesV.map((t, index) => (
          <div key={t} style={{ ...styles.scaleMark, marginTop: index == 0 ? -10 : 0 }}> {t}h
          </div>
        ))
      );
    }

    if (maxTime < 3600) {

      maxTimeAdjusted = Math.ceil(maxTime / 60);
      maxTimeAdjusted = Math.ceil(maxTimeAdjusted / 10) * 10;
      const interval = maxTimeAdjusted / 5;

      timeScalesV = [];

      for (var i = 1; i < 6; i++) {

        timeScalesV.push(i * interval);

      }
      timeScalesV = timeScalesV.map(t => Math.round(t * 100) / 100);
      timeScalesV.reverse();
      timeScalesV.push(0);
      return (
        timeScalesV.map((t, index) => (
          <div key={index} style={{ ...styles.scaleMark, marginTop: index == 0 ? -10 : 0 }}> {t}m
          </div>
        ))
      );
    }
  }

  function getWeeks(from) {

    from = from.map(
      entry => {
        var init = new Date(Object.entries(entry.dailyTimes)[0][0]);
        const end = new Date(Object.entries(entry.dailyTimes).at(-1)[0]);

        const count = (end - init) / 86400000;

        console.log(count);
        console.log(entry.dailyTimes);

        entry.dailyTimes = Object.entries(entry.dailyTimes);
        var date = new Date(init);

        for (var i = 1; i < count + 1; i++) {

          date.setDate(date.getDate() + 1)
          const target = date.toISOString().slice(0, 10);

          console.log(entry.dailyTimes);

          if (!entry.dailyTimes.find(([date, time]) => date == target)) {
            entry.dailyTimes = [...entry.dailyTimes, [target, 0]];
          }
        }

        entry.dailyTimes = Object.fromEntries(entry.dailyTimes);
        entry.dailyTimes = Object.fromEntries(
          Object.entries(entry.dailyTimes).sort(([a], [b]) => new Date(a) - new Date(b))
        );

        console.log(entry.dailyTimes);
        return entry;
      }
    );

    console.log(from);
    collected = 0;
    return from.map(cat =>
    { 
      collected = 0;
  
      return {
      ...cat, dailyTimes: Object.entries(cat.dailyTimes).map(
        ([date, time]) => {
          if (new Date(date).getDay() == 0) {

            collected += time;
            const temp = collected;
            collected = 0;
            return [date, temp];
          } else {
            collected += time;
          }
        }
      )}
    }
    ).map(cat => ({ ...cat, dailyTimes: Object.fromEntries(cat.dailyTimes.filter((val) => val != null)) }
    ))
  }

  function graph(categories, text) {
    console.log(categories, text);


    return (

      <div style={styles.mainGraphPanel}>
        <span>{text}</span>
        <div style={styles.mainScaleGraphHolder}>
          <div style={styles.scaleHolder}>
            <div style={styles.scale}>

              {determineScale(categories)}

            </div>
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

          {Object.entries(categories.find(
            t => (selectedCategory ? (t.id === selectedCategory) : true)

          ).dailyTimes)
            .slice(-20)
            .map(([date, time], index) => (index % 3 == 0 ?

              <div
                key={index}
                style={styles.xmark}>{date.slice(-5)}</div> : <div key={index} />
            )

            )

          }
        </div>

      </div>
    )
  }

  /* array of max time per category for graph normalization */

  function getMaxTimeCategories(from) {
    const maxTimeCategories = from.map(t => (

      { [parseInt(t.id)]: Math.max(...Object.values(t.dailyTimes)) }

    ));

    return maxTimeCategories;
  }



  return (
    <div style={styles.background}>
      <div style={styles.pageHold}>

        {/* main progress bar */}

        <div style={styles.mainProgressHold}>
          <div style={styles.progressBar}>
            {totalPerCategory()}

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

        <div>{JSON.stringify(getMaxTimeCategories(categories))}</div>

        <div>a{JSON.stringify(Object.values(getMaxTimeCategories(categories).find(t => t[selectedCategory] != null))[0])}</div>

        <div>a{selectedCategory}</div>

        {graph(categories, "Dnevna analiza")}

        {graph(getWeeks(categories), "Tjedna analiza")}


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
    display: "flex",
    gap: 0
  },

  progressBarFill: {
    background: "#155b18",
    borderRadius: "0px",
    height: "30px",
    overflow: "hidden",
    marginRight: 0
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
    margin: "auto auto 30px auto",
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
    width: "85%",
    display: "flex",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100%",
    backgroundImage: "linear-gradient(rgba(0, 0, 0, 1) 1px, rgb(255, 255, 255) 1px)",
    backgroundSize: "30px 30px"
  },

  scaleHolder: {
    borderRadius: "20px",
    background: "#252d52",
    maxWidth: 50,
    minWidth: 35,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start",
    height: "100%"
  },

  scale: {
    borderRadius: "20px",
    margin: "30px 0px 30px 0px",
    background: "#524925",
    maxWidth: 50,
    minWidth: 35,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 0,
    alignItems: "center",
    height: "100%",
    paddingTop: 0
  },

  scaleMark: {
    maxWidth: 2,
    minWidth: 30,
    fontSize: 10,
    height: 10
  },

  xmark: {
    maxWidth: 2,
    minWidth: 30,
    fontSize: 10,
    height: 10,
    position: "relative",
    bottom: 40
  },

  graphPillar: {
    background: "#62aa87",
    zIndex: 100,
    width: 30

  },

  mainGraphX: {
    borderRadius: "20px",
    background: "#253652",
    maxWidth: 400,
    margin: "auto auto 30px auto",
    display: "flex",
    gap: 45,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    height: 100,
    paddingLeft: 75
  },

};