import React from 'react';
import SummaryCards from './SummaryCards';
import ContentBlocks from './ContentBlocks';
import '../css/MainContent.css';
import { useAuth } from '../context/AuthContext';
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
          <p className="tagline">Your presence makes progress possible—consistency creates results.</p>
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
