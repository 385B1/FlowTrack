import "./mjerenje.css"
import { getCookie } from '../credentialValidation.jsx';
import { useNavigate } from "react-router-dom";

import { useState, useRef, useEffect } from "react";

const SAMPLE_CATEGORIES = [
  { userId: 22, id: 1, name: "cat1", dailyTimes: { "2026-03-21": 1100, "2026-03-22": 200, "2026-03-23": 100, "2026-03-24": 400, "2026-03-25": 800, "2026-03-26": 1200, "2026-03-27": 1200, "2026-03-28": 1200, "2026-03-29": 1600, "2026-03-30": 1800, "2026-03-31": 1100, "2026-04-01": 200, "2026-04-02": 100, "2026-04-03": 400, "2026-04-04": 800, "2026-04-05": 1200, "2026-04-06": 1200, "2026-04-07": 1200, "2026-04-08": 1600, "2026-04-09": 1800 } },
  { userId: 22, id: 2, name: "cat2", dailyTimes: { "2026-03-21": 12000, "2026-03-28": 4500 } },
  { userId: 22, id: 3, name: "cat3", dailyTimes: { "2026-03-21": 6000, "2026-03-27": 8000 } },
  { userId: 22, id: 4, name: "cat4", dailyTimes: { "2026-03-21": 120, "2026-03-27": 200 } },
];


const Mjerenje = () => {
  const [value, setValue] = useState(0);
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [timerOn, setTimerOn] = useState(false);
  const [timeScales, setTimeScales] = useState(null);
  const [hover, setHover] = useState(null);
  const [lookback, setLookback] = useState(10);
  const startTime = useRef(null);
  const endTime = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const WeekFetch = Object.freeze({
    SUM: 0,
    AVERAGE: 1,
    MAX: 2
  });


  /* increment every second if the timer is on */

  useEffect(
    () => {

      const interval = setInterval(() => {

        if (timerOn) {
          //console.log(1);
          const todaysDate = new Date().toISOString().slice(0, 10)
          setCategories(prev => prev?.map(t => (t.id == selectedCategory ?

            { ...t, ...t.startEndTimes, dailyTimes: { ...t.dailyTimes, [todaysDate]: (t.dailyTimes[todaysDate] ? t.dailyTimes[todaysDate] : 0) + 1 } }


            : t)));

        }

      }, 1000);

      return () => clearInterval(interval);

    }, [timerOn, selectedCategory]
  );

  useEffect(
    () => {

      getCategories();

    }, []
  );


  const getCategories = async () => {

    try {

      const id = localStorage.getItem("id");

      // const res = await fetch(`${import.meta.env.VITE_API_URL}/get_categories?id=${id}`, {
      const res = await fetch(`/get_categories?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      const data = await res.json();

      console.log(data);

      var result = data;

      if (result.detail?.length > 0) {
        localStorage.setItem("loggedin", "false");
        navigate("/");
      }

      if (result.categories?.length == 0) {
        //setCategories([{ id: 5, name: "FALLBACK1", userId: 22, dailyTimes: { "2026-03-21": 120, "2026-03-27": 200 } }]);
        setCategories(null);
      } else {
        result = result.map(cat => {
          if (Object.keys(cat.dailyTimes).length === 0) {
            //console.log("data");
            return { ...cat, dailyTimes: { [new Date().toISOString().slice(0, 10)]: 0 } }
          } else {
            return cat
          }
        });
        //console.log(data);
        setCategories(result);
        setSelectedCategory(result[0].id);
      }

    } catch (error) {

      console.error('Error posting data:', error);
    }
  }

  const sendCategories = async () => {
    //console.log("categories: ",categories,selectedCategory);
    try {

      const id = localStorage.getItem("id");

      // const res = await fetch(`${import.meta.env.VITE_API_URL}/add_categories`, {
      // Sori Jan kaj sam ovak napravio, al bi inace morao brisat i opet insertat cijelu
      // bazu podataka, sto je jako lose s tim da neki fileovi(u files tablici) mogu biti vise MB.
      const category = categories.find((task) => { return task.id == selectedCategory })
      //console.log("selected category: ",category);
      const res = await fetch(`http://localhost:8000/update_category`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({
          catId: selectedCategory,
          dailyTime: category.dailyTimes,
          start: startTime.current,
          end: endTime.current
        })
      });
      const data = await res.json();
      await fetch("http://localhost:8000/update_streak", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        }
      }) 
      //console.log("data:",data);
      const achRes = await fetch("http://localhost:8000/update_time_achievement", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({
          start: startTime.current,
          end: endTime.current
        })
      })
    
      if (data.detail?.length > 0) {
        localStorage.setItem("loggedin", "false");
        navigate("/");
      }


    } catch (error) {

      console.error('Error posting data:', error);
    }
  }


  function dateFormat(from) {
    const day = from.slice(-2);
    const month = from.slice(5, 7);

    return `${day}.${month}.`;

  }

  /* hours, minutes, seconds */

  function advancedTime(from) {
    const hrs = Math.floor(from / 3600);
    const min = Math.floor((from % 3600) / 60);
    const sec = Math.floor(from % 60);

    return `${hrs}h ${min}m ${sec}s`;
  }

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

    //console.log(categories);

    categories?.map(
      cat => {
        const total = Object.values(cat.dailyTimes).reduce((acc, val) =>
          acc + val, 0);

        categoryTotals.push(

          { id: [cat.id], total: total }
        );

      }
    );

    //console.log(JSON.stringify(categoryTotals));

    const totalOfAllCategories = categoryTotals.reduce(
      (acc, val) => acc += val.total, 0
    );

    //console.log(totalOfAllCategories);

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
  var row = 0;

  /* return divs representing time marks on the main graph scale */

  function determineScale(from) {
    maxTime = Object.values(getMaxTimeCategories(from)?.find(t => t[selectedCategory] != null) || 0)[0];


    //console.log(maxTime);

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

  function getWeeks(from, fetchType) {

    from = from?.map(
      entry => {
        var init = new Date(Object.entries(entry.dailyTimes)[0][0]);
        const end = new Date(Object.entries(entry.dailyTimes).at(-1)[0]);

        const count = (end - init) / 86400000;

        //console.log(count);
        console.log(entry.dailyTimes);

        entry.dailyTimes = Object.entries(entry.dailyTimes);
        var date = new Date(init);

        for (var i = 1; i < count + 1; i++) {

          date.setDate(date.getDate() + 1)
          const target = date.toISOString().slice(0, 10);

          //console.log(entry.dailyTimes);

          if (!entry.dailyTimes.find(([date, time]) => date == target)) {
            entry.dailyTimes = [...entry.dailyTimes, [target, 0]];
          }
        }

        entry.dailyTimes = Object.fromEntries(entry.dailyTimes);
        entry.dailyTimes = Object.fromEntries(
          Object.entries(entry.dailyTimes).sort(([a], [b]) => new Date(a) - new Date(b))
        );

        //console.log(entry.dailyTimes);
        return entry;
      }
    );

    //console.log(from);
    collected = 0;
    return from?.map(cat => {
      collected = 0;
      var max = 0;

      return {
        ...cat, dailyTimes: Object.entries(cat.dailyTimes).map(
          ([date, time]) => {
            if (new Date(date).getDay() == 0) {

              collected += time;
              if (time > max) max = time;

              if (fetchType === WeekFetch.AVERAGE) collected /= 7;
              else if (fetchType === WeekFetch.MAX) collected = max;
              const temp = collected;
              //console.log(date);
              collected = 0;
              max = 0;
              return [date, temp];
            } else {
              collected += time;
              if (time > max) max = time;
            }
          }
        )
      }
    }
    ).map(cat => ({ ...cat, dailyTimes: Object.fromEntries(cat.dailyTimes.filter((val) => val != null)) }
    ))
  }

  /* input example 10:15:30 - output is that in seconds */

  function toSeconds(from) {
    const hrs = from.slice(0, 2);
    const min = from.slice(3, 5);
    const sec = from.slice(6, 8);

    console.log(hrs + " " + min + " " + sec);

    console.log(hrs * 3600 + min * 60 + sec);

    return hrs * 3600 + min * 60 + sec;
  }

  /* create a graph from the supplied scale, use the text to display and row for classification */

  function graph(categories, text, row) {

    return (

      <div style={styles.mainGraphPanel}>
        <span style={styles.graphText}>{text}</span>
        <div style={styles.mainScaleGraphHolder}>
          <div style={styles.scaleHolder}>
            <div style={styles.scale}>

              {determineScale(categories)}

            </div>
          </div>
          <div style={styles.mainGraphHolder}>
            {Object.entries(categories?.find(
              t => (selectedCategory ? (t.id === selectedCategory) : true)

            )?.dailyTimes || 0)
              .slice(-lookback)
              .map(([date, time], index) =>
              (<div key={index + row}
                style={{
                  ...styles.pillarHolder, height: "100%", width: lookback == 5 ? 60 : lookback == 10 ? 30 : 15
                }}>
                {
                  hover == index + row ? (<div style={{
                    ...styles.tooltip,
                    left: mousePos.x + 10,
                    top: mousePos.y + 10,
                    height: 80,
                    width: 200,
                    position: "fixed"
                  }}
                    key={index + row}>{advancedTime(time)} {dateFormat(date)}</div>) : <div key={index + row}></div>

                }

                <div key={index + row + 1000}
                  onMouseEnter={() => setHover(index + row)}
                  onMouseLeave={() => setHover(null)}
                  onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                  style={{
                    ...styles.graphPillar,
                    height: `${Math.round(time / (maxTime > 3600 ? timeScalesV[0] * 3600 : timeScalesV[0] * 60) * 100)}%`
                  }
                  }></div>

                {<div
                  key={index + row + 10000}
                  style={{
                    ...styles.xmark,
                    opacity: index % 3 == 0 ? 1 : 1
                  }}
                >{date.slice(-5)}</div>
                }

              </div>
              )
              )
            }
          </div>
        </div>

        <div style={{
          ...styles.mainGraphX,

        }}>
        </div>
      </div>
    )
  }


  function horizontalGraph(categories, text, row) {

    console.log(categories);
    console.log(selectedCategory);

    return (


      <div style={styles.mainGraphPanel}>
        <span style={styles.graphText}>{text}</span>
        <div style={styles.mainScaleGraphHolder}>
          <div style={{ ...styles.scale, maxWidth: 500, width: 70 }}>


          </div>

          {/* map over startend times of the selected category and fill the graph - first map is for the graph stripes (dates), second nesetd graph is for every inner start and end*/}
          <div style={styles.graphScaleHolderHorizontal}>
            <div style={{ ...styles.mainVerticalGraphHolder, paddingLeft: 0, paddingRight: 0 }}>
              {categories?.find(cat => selectedCategory ? (cat.id == selectedCategory) : true).startEndTimes?.slice(-lookback).map(
                entry => {
                  return (
                    <div key={entry.id} style={styles.stripeMarkHolder}>
                      <div style={styles.stripeMark}>{entry.date?.slice(-5)}</div>
                      <div style={styles.horizontalGraphStripeHolder}>
                        {entry.times?.map(
                          startend => {
                            console.log(startend.start + " and " + startend.end);
                            return <div style={{
                              ...styles.horizontalGraphStripeFiller,
                              left: `${toSeconds(startend.start) / 86400}%`,
                              right: `${100 - toSeconds(startend.end) / 86400}%`
                            }}></div>
                          }

                        )}
                      </div>
                    </div>
                  )
                }


              )}
            </div>
            <div style={{
              ...styles.mainGraphXHorizontal,

            }}>
              <div style={styles.horizontalTimeMark}>0h</div>
              <div style={styles.horizontalTimeMark}>6h</div>
              <div style={styles.horizontalTimeMark}>12h</div>
              <div style={styles.horizontalTimeMark}>18h</div>
              <div style={styles.horizontalTimeMark}>24h</div>
                
            </div>
          </div>





        </div>

      </div>
    )
  }

  /* array of max time per category for graph normalization */

  function getMaxTimeCategories(from) {
    const maxTimeCategories = from?.map(t => (

      { [parseInt(t.id)]: Math.max(...Object.values(t.dailyTimes)) }

    ));

    return maxTimeCategories;
  }

  function timer() {
    setTimerOn(t => !t);

    const currentDate = new Date();
    const currentTime = currentDate.toISOString().slice(11, -1);

    if (timerOn) {

      setCategories(prev => prev?.map(t => (t.id == selectedCategory ?
        {
          ...t, ...t.dailyTimes,
          startEndTimes:
            [...t.startEndTimes.slice(0, -1), { start: t.startEndTimes.at(-1).start, end: currentTime }]
        }

        : t)));

      endTime.current = currentTime;

      console.log(JSON.stringify(categories));

      sendCategories();
    } else {

      setCategories(prev => prev?.map(t => (t.id == selectedCategory ?
        {
          ...t, ...t.dailyTimes,
          startEndTimes: [...(t.startEndTimes || []), { start: currentTime, end: null }]
        }
        : t)));

      startTime.current = currentTime;
    }
  }

  return (
    <div style={styles.background}>
      <div style={styles.pageHold}>
        <div style={styles.backgroundImg} />

        {/* main progress bar */}

        <div style={styles.mainProgressHold}>
          <div style={styles.progressBar}>
            {totalPerCategory()}

          </div>
        </div>

        {/* panel for category selection and timer button */}

        <div style={styles.measurementPanel}>
          <div>
            <button style={{ ...styles.focusButton, background: timerOn ? "#720000" : null }}
              onClick={() => timer()}>{(timerOn ? "Zaustavi" : "Započni fokus")}</button>
            <h1>
              {advancedTime(
                categories
                  ?.find(cat => selectedCategory ? cat.id == selectedCategory : true)
                  ?.dailyTimes?.[new Date().toISOString().slice(0, 10)] || 0
              )}
            </h1>
          </div>

          <div style={styles.selectionPanel}>
            {categories?.map(category => {
              const selected = category.id === selectedCategory;
              return (
                <button
                  key={category.id}
                  style={{ ...styles.categoryButton, ...(selected ? styles.categoryButtonSelected : {}) }}
                  onClick={() => setSelectedCategory(category.id)}>{category.name}</button>
              );
            }
            ) || "Molimo izradite kategoriju u Datotekama"}
          </div>

        </div>

        <div style={styles.lookbackHolder}>

          <select style={styles.lookback}
            onChange={(e) => setLookback(parseInt(e.target.value))}
            value={lookback}>
            <option value="5">Broj stavki: 5</option>
            <option value="10">Broj stavki: 10</option>
            <option value="20">Broj stavki: 20</option>
          </select>

        </div>

        {/* main graphs */}
        {graph(categories, "Dnevna analiza", 100)}

        {graph(getWeeks(categories, WeekFetch.SUM), "Tjedna analiza", 200)}

        {graph(getWeeks(categories, WeekFetch.AVERAGE), "Tjedni prosjeci", 300)}

        {graph(getWeeks(categories, WeekFetch.MAX), "Tjedni maksimumi", 400)}

        {horizontalGraph(categories, "Aktivnosti po danu", 100)}


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
    background: "#ff000000",

    margin: "100px 200px 10px",
    minHeight: "100vh",
    padding: "20px 20px 20px",
    position: "relative",
  },

  mainProgressHold: {
    background: "#43434300",
    padding: "10px 10px 10px",
    marginBottom: "20px"
  },

  progressBar: {
    background: "#399d3e",
    borderRadius: "200px",
    display: "flex",
    gap: 0,
    border: "10px solid #000000"
  },

  progressBarFill: {
    background: "#558c57",
    borderRadius: "0px",
    height: "30px",
    overflow: "hidden",
    marginRight: 0
  },

  measurementPanel: {
    borderRadius: "20px",
    padding: "20px",
    background: "#848484",
    maxWidth: 400,
    margin: "auto auto 30px auto",
    alignItems: "center",
    display: "flex",
    flexDirection: "column"
  },

  focusButton: {
    marginBottom: 30,
    padding: 30,
    borderRadius: 15,
    margin: "0 auto"
  },

  selectionPanel: {
    borderRadius: "20px",
    padding: "20px",
    background: "#d2d2d2",
    maxWidth: 400,
    margin: "0 auto",
    display: "flex",
    flexWrap: "wrap",
    gap: 20
  },

  categoryButton: {
    marginBottom: 30,
    padding: 10,
    borderRadius: 15
  },

  categoryButtonSelected: {
    background: "red"
  },

  mainGraphPanel: {
    borderRadius: "20px",
    padding: "20px",
    background: "#191919",
    margin: "auto auto 30px auto",
    maxWidth: 600,
  },

  mainScaleGraphHolder: {
    borderRadius: "20px",
    background: "#e0e0e000",
    margin: "auto auto 10px auto",
    display: "flex",
    justifyContent: "flex-start",
    height: 300,
    gap: 10,


  },

  mainGraphHolder: {
    borderRadius: "20px",
    padding: "30px",
    background: "#383838",
    width: "85%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "space-around",
    height: "100%",
    backgroundImage: "linear-gradient(rgba(0, 0, 0, 1) 1px, rgb(255, 255, 255) 1px)",
    backgroundSize: "30px 30px",

  },

  mainVerticalGraphHolder: {
    borderRadius: "20px",
    padding: "30px",
    background: "#383838",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "space-around",
    height: "100%",
    backgroundImage: "linear-gradient(rgba(0, 0, 0, 1) 1px, rgb(255, 255, 255) 1px)",
    backgroundSize: "30px 30px",

  },

  graphScaleHolderHorizontal: {
    width: "85%",
    display: "flex",
    flexDirection: "column",
    background: "#a0c80000",
  },

  scaleHolder: {
    borderRadius: "20px",
    background: "#000000",
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
    background: "#000000",
    maxWidth: 50,
    minWidth: 35,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 0,
    alignItems: "center",
    height: "100%",
    paddingTop: 0,

  },

  scaleMark: {
    maxWidth: 2,
    minWidth: 30,
    fontSize: 10,
    height: 10,
    color: "#ffffffaa"
  },

  xmark: {
    maxWidth: 2,
    minWidth: 30,
    fontSize: 10,
    height: 10,
    position: "absolute",
    bottom: -10
  },

  graphPillar: {
    background: "#00a2ff",
    zIndex: 100,
    position: "relative",
    zIndex: 0,
    width: "100%",
  },

  mainGraphX: {
    borderRadius: "20px",
    background: "#a2a2a200",
    maxWidth: 400,
    margin: "auto auto 30px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    height: 100,
    paddingLeft: 75,
    paddingRight: 30
  },

  mainGraphXHorizontal: {
    borderRadius: "20px",
    background: "#000000",
    width: "100%",
    margin: "0px auto auto auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    height: 100,
    paddingLeft: 0,
    paddingRight: 0
  },

  horizontalTimeMark: {
    color: "#ffffff"
  },

  tooltip: {
    color: "#ffffff",
    fontSize: 30,
    position: "absolute",
    background: "#000000",
    overflow: "visible",
    width: 100,
    bottom: 50,
    zIndex: 1000
  },

  lookback: {
    width: 200,
    height: 75,
    fontSize: 20,
    margin: "auto auto 30px auto",
  },

  lookbackHolder: {

    borderRadius: "20px",
    padding: "20px",
    background: "#848484",
    maxWidth: 400,
    margin: "auto auto 30px auto",
    alignItems: "center",
    display: "flex",
    flexDirection: "column"
  },

  pillarHolder: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    background: "#d2171700",
    position: "relative"
  },

  graphText: {
    color: "#ffffffaa",
    fontSize: 30
  },

  stripeMarkHolder: {
    background: "#4d57e700",
    display: "flex",
    position: "relative",


    minHeight: 10
  },

  horizontalGraphStripeHolder: {
    width: "100%",
    background: "#e74d4d00",
    display: "flex",
    position: "relative",
    minHeight: 10
  },

  horizontalGraphStripeFiller: {
    background: "#00a2ff",
    display: "flex",
    position: "absolute",
    left: "10%",
    right: "20%",
    height: "100%",
    border: "3px solid #00a2ff",
  },

  stripeMark: {
    width: "200px",
    position: "absolute",
    left: -70,
    color: "#ffffff",

  }

};

export default Mjerenje;
