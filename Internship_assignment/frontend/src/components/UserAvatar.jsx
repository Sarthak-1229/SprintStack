import React from 'react';
import { useAuth } from '../context/AuthContext';

function UserAvatar({ username, avatarUrl, size = 26, className = '', style = {}, showBorder = true }) {
  const { getUserAvatar } = useAuth();
  const effectiveAvatar = avatarUrl || (username ? getUserAvatar(username) : '');

  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    ...(showBorder ? { border: '2px solid var(--accent-black, #1D1D1D)' } : {}),
    ...style
  };

  if (effectiveAvatar) {
    return (
      <div
        className={`user-avatar-wrap ${className}`}
        style={dimensionStyle}
        title={username ? `@${username}` : ''}
      >
        <img
          src={effectiveAvatar}
          alt={username || 'User Avatar'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            // Fallback to text initial if broken image
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
        <div
          style={{
            display: 'none',
            width: '100%',
            height: '100%',
            background: 'var(--accent-black, #1D1D1D)',
            color: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: size >= 40 ? '1.5rem' : size >= 30 ? '0.85rem' : '0.72rem'
          }}
        >
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`user-avatar-initial ${className}`}
      style={{
        ...dimensionStyle,
        background: 'var(--accent-black, #1D1D1D)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '900',
        fontSize: size >= 40 ? '1.5rem' : size >= 30 ? '0.85rem' : '0.72rem',
        userSelect: 'none'
      }}
      title={username ? `@${username}` : ''}
    >
      {username ? username.charAt(0).toUpperCase() : 'U'}
    </div>
  );
}

export default React.memo(UserAvatar);

