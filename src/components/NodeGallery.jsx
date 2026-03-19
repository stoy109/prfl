import React from 'react';
import { SocialNode } from './SocialNode';
import { LINKS_DATA } from '../constants';
import '../index.css';

export function NodeGallery({ mode, osuEvent, mousePos }) {
  return (
    <div className="gallery-container">
      <div className="orbit-scroller">
        {LINKS_DATA.map((link, index) => (
          <SocialNode
            key={link.platform}
            index={index}
            total={LINKS_DATA.length}
            platform={link.platform}
            url={link.url}
            color={link.color}
            icon={link.icon}
            behavior={link.behavior}
            mode={mode}
            osuEvent={osuEvent}
            mousePos={mousePos}
          />
        ))}
      </div>
    </div>
  );
}
