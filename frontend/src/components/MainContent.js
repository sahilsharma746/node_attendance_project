import React from 'react';
import SummaryCards from './SummaryCards';
import ContentBlocks from './ContentBlocks';
import '../css/MainContent.css';
import { useAuth } from '../context/AuthContext';

const DAILY_QUOTES = [
  "Success is not final, failure is not fatal — it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Hard work beats talent when talent doesn't work hard.",
  "Your limitation — it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "You don't have to be great to start, but you have to start to be great.",
  "A positive team is not a team without problems. It is a team that believes it can overcome them.",
  "Coming together is a beginning, staying together is progress, and working together is success.",
  "The strength of the team is each individual member. The strength of each member is the team.",
  "Alone we can do so little; together we can do so much.",
  "Talent wins games, but teamwork and intelligence win championships.",
  "Success usually comes to those who are too busy to be looking for it.",
  "The way to get started is to quit talking and begin doing.",
  "Everything you've ever wanted is on the other side of fear.",
  "Opportunities don't happen. You create them.",
  "Stay hungry, stay foolish.",
  "Work hard in silence, let your success be the noise.",
  "The future depends on what you do today.",
  "Excellence is not a skill, it's an attitude.",
  "Your work is going to fill a large part of your life — make it great.",
];

const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const MainContent = () => {
  const { user } = useAuth();
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const day = today.getDate();
    const year = today.getFullYear();
    const ordinal = getOrdinalSuffix(day);
    return `${weekday}, ${month} ${day}${ordinal}, ${year}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="main-content">
      <div className="main-header">
        <div className="header-left">
          <h1 className="greeting">{getGreeting()}, {user?.name}</h1>
          <p className="quote-label">Today's Power Line</p>
          <p className="tagline">{getDailyQuote()}</p>
        </div>
        <div className="header-right">
          <p className="date-label">Today's Date</p>
          <p className="date-value">{getCurrentDate()}</p>
        </div>
      </div>

      <SummaryCards />
      <ContentBlocks />
    </div>
  );
};

export default MainContent;
