import './main.css';
import {Calendar, Title} from './Calendar.jsx';

const Main = () => {
  return (
      <div id="calendar-page-holder">
        <div>
          <Title/>
        </div>
        <div>
          <Calendar/>
        </div>
      </div>



  )
};

export default Main;
