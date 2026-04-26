import { useState, useEffect } from 'react';
import { getCookie } from '../credentialValidation.jsx';
import './Achievements.css'; 

// this component creates an achievement card
const AchievementCard = ( { achievement, userAchievements } ) =>{
  const userAchievement = userAchievements.find((userAch) => userAch.achievement_id === achievement.id);

  return achievement.isActive ? null : <div 
  className={!userAchievement ? "achievement-card pending" :`achievement-card ${userAchievement.is_completed ? "completed" : "pending"}`} key={achievement.id}>
  <p>{achievement.name}</p>
  <h3>{achievement.description}</h3>
  
  </div>
}

const Achievements = () =>{
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [achievementCategories, setAchievementCategories] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [stats, setStats] = useState([]);
  // this useEffect is used for querying data about the achievements and then setting them to their states
  useEffect(() => {
    async function getAchievements() {
      
      try {
      const catRes = await fetch("/get_achievement_categories",{
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRF-Token": getCookie("csrf_token")
          }
        });
      const achievementCategoriesData = await catRes.json();
      setAchievementCategories(achievementCategoriesData);

      const res = await fetch("/get_achievements",{
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      const achievementsData = await res.json();
      
      for (let achievement of achievementsData){

        //achievement.category = achievementCategoryData ? achievementCategoryData[0] : null;
        const achievementCategory = achievementCategoriesData.find((category) => category.id === achievement.achievement_category);
        achievement.category = achievementCategory ? achievementCategory : undefined;
      }

      setAchievements(achievementsData);
      //console.log(achievementsData);
      const userRes = await fetch("/get_user_achievements",{
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      const achievementsUserData = await userRes.json();
      setUserAchievements(achievementsUserData);
      
      const statsRes = await fetch("/get_user_data_by_table?table=stats",{
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
          }
        });
        const statsData = await statsRes.json();
        // it returns an array
        setStats(statsData[0]);
      const streaksRes = await fetch("/get_user_data_by_table?table=streaks",{
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
          }
        });
        const streaksData = await streaksRes.json();
        // it returns an array
        setStreaks(streaksData[0]);
      //console.log(achievementsUserData);
      }
      catch (error){
        console.log("ERROR OCCURED WHILE GETTING DATA:",error);
      }
    }
    getAchievements();
  },[])
  //console.log("streaks:",streaks,"stats",stats);
  // a little too complex, but it works and looks nice
  const calculateLevel = (total_xp) => {
    let level = 1;
    let calc = 50;
    while (total_xp >= calc){
      console.log(calc);
      calc *= 1.5;
      level++;
    }
    
    return level; 
  }
  console.log("total time:",stats.total_time)
  const display_time = `${Math.floor(stats.total_time / 3600) }h : 
                      ${Math.floor(stats.total_time % 3600 / 60)}m : 
                      ${Math.floor(stats.total_time % 60)}s`;
  const user_level = calculateLevel(stats.total_xp); 
  return (<div className="centered-achievements">
  { achievementCategories.map((category) => {
    return (<div className="achievement-category-section" key={category.id}>
      <h2>{category.name}</h2>
      {achievements.map((achievement) => {
        return achievement.category.name != category.name ? null : <AchievementCard key={achievement.id} achievement={achievement} userAchievements={userAchievements}/>
      })} </div>)
    })}
    <div className="stats-wrapper">
      <div>
        <p>Current Streak: <span>{streaks.current_streak}</span></p>
        <p>Longest Streak: <span>{streaks.longest_streak}</span></p>
        <p>Total XP: <span>{stats.total_xp}</span></p>
        <p>Level: <span>{user_level}</span></p>
      </div>
      <div>
        <p>Made Tasks Count <span>{stats.tasks_count}</span></p>
        <p>Completed Tasks Count: <span>{stats.completed_tasks_count}</span></p>
        <p>Total Logged Time: <span>{display_time}</span></p>
        <p>Log Time count: <span>{stats.log_times_count}</span></p>
      </div>
    </div>
  </div>);
}

export default Achievements;
