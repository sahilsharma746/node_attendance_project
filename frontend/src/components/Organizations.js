import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/Organizations.css';

const Organizations = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        if (user) fetchTeamMembers();
    }, [user]);

    const fetchTeamMembers = async () => {
        try {
            setError('');
            const response = await axios.get('http://localhost:3002/api/auth/users');
            setTeamMembers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching team members:', err);
            setTeamMembers([]);
            setError(err.response?.data?.msg || 'Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const formatRole = (role) => {
        return role ? role.toUpperCase() : 'USER';
    };

    const isCurrentUser = (memberId) => {
        if (!user) return false;
        const userId = user.id || user._id;
        const compareId = memberId?.toString();
        return userId?.toString() === compareId;
    };

    
    return (
        <div className="organizations-container">
            <div className="organizations-header">
                <h1 className="organizations-title">Organization</h1>
                <p className="organizations-subtitle">Meet your team members.</p>
            </div>

            <div className="team-members-card">
                <div className="team-members-header">
                    <div className="team-members-icon-wrapper">
                        <img src="/images/conversation.png" alt="Team" className="team-members-icon" />
                        <span className="team-members-title">Team Members ({teamMembers.length})</span>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <p>Loading team members...</p>
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <p>{error}</p>
                    </div>
                ) : teamMembers.length === 0 ? (
                    <div className="empty-state">
                        <p>No team members found</p>
                    </div>
                ) : (
                    <div className="team-members-grid">
                        {teamMembers.map((member) => (
                            <div key={member._id || member.id} className="member-card">
                                <div 
                                    className="member-avatar" 
                                    style={{ background: getAvatarColor(member.name) }}
                                >
                                    {getInitials(member.name)}
                                </div>
                                <div className="member-name">{member.name}</div>
                                <div className="member-roles">
                                    <span className={`role-badge role-${member.role?.toLowerCase() || 'user'}`}>
                                        {formatRole(member.role)}
                                    </span>
                                    {isCurrentUser(member._id || member.id) && (
                                        <span className="role-badge role-you">YOU</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Organizations;