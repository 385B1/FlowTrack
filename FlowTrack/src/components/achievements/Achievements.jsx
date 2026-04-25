import { useState, useEffect } from 'react';
import { getCookie } from '../credentialValidation.jsx';
import './Achievements.css'; 

const AchievementCard = ( { achievement, userAchievements } ) =>{
  // the ternary operator is used to check if the achievemnt is active, if it is then show it, if not then don't show it
  return achievement.isActive ? null : <div 
  className="achievement-card" key={achievement.id}>
  <p>{achievement.name}</p>
  <h3>{achievement.description}</h3>
  </div>
}

const Achievements = () =>{
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [achievementCategories, setAchievementCategories] = useState([]);
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
        console.log("achievement: ",achievement);
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
