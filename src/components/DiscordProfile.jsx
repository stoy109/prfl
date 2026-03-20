import React from 'react';
import { motion } from 'framer-motion';

export function DiscordProfile({ lanyardData, osuEvent, mode, intensity }) {
  if (!lanyardData) return null;

  const { discord_user, discord_status, activities, listening_to_spotify, spotify } = lanyardData;
  
  const avatarUrl = `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png?size=256`;
  
  const statusColors = {
    online: '#23a559', // Discord green
    idle: '#f0b232',
    dnd: '#f23f43',
    offline: '#80848e'
  };

  const statusColor = statusColors[discord_status] || statusColors.offline;

  // Music reactions (subtle)
  const scalePulse = osuEvent.hasNormal ? 1.02 : 1.0;
  
  // Get primary activity or custom status
  const customStatus = activities.find(a => a.type === 4);
  const mainActivity = activities.find(a => a.type !== 4);

  return (
    <motion.div
      className="discord-profile-card"
      initial={{ x: '-50%', y: '-50%' }}
      animate={{
        scale: scalePulse,
        x: '-50%',
        y: '-50%'
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    >
      <div className="card-avatar-section">
        <img 
          src={avatarUrl} 
          alt={discord_user.username}
          className="card-avatar"
        />
        <div 
          className="card-status-dot" 
          style={{ backgroundColor: statusColor }}
        />
      </div>

      <div className="card-info-section">
        <div className="card-header">
          <span className="card-username">
            {discord_user.username}
          </span>
          {/* Mock badges if needed, or check lanyard data */}
          <div className="card-badges">
             {activities.length > 0 && activities[0].name === 'Arc' && (
                <div className="badge-arc">💠</div>
             )}
          </div>
        </div>
        
        <div className="card-status-text">
          {customStatus ? customStatus.state : (mainActivity ? `playing ${mainActivity.name}` : 'currently doing nothing')}
        </div>
      </div>
    </motion.div>
  );
}
