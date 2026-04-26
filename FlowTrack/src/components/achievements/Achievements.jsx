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
  // this useEffect is used for querying data about the achievements and then setting them to their states
  useEffect(() => {
    async function getAchievements() {
      
      try {
      const catRes = await fetch("http://localhost:8000/get_achievement_categories",{
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRF-Token": getCookie("csrf_token")
          }
        });
      const achievementCategoriesData = await catRes.json();
      setAchievementCategories(achievementCategoriesData);

      const res = await fetch("http://localhost:8000/get_achievements",{
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
      const userRes = await fetch("http://localhost:8000/get_user_achievements",{
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      const achievementsUserData = await userRes.json();
      setUserAchievements(achievementsUserData);
      //console.log(achievementsUserData);
      }
      catch (error){
        console.log("ERROR OCCURED WHILE GETTING DATA:",error);
      }
    }
    getAchievements();
  },[])
  // a little too complex, but it works and looks nice
  return (<div className="centered-achievements">
  { achievementCategories.map((category) => {
    return (<div className="achievement-category-section" key={category.id}>
      <h2>{category.name}</h2>
      {achievements.map((achievement) => {
        return achievement.category.name != category.name ? null : <AchievementCard key={achievement.id} achievement={achievement} userAchievements={userAchievements}/>
      })} </div>)
    })}
  </div>);
}

export default Achievements;
