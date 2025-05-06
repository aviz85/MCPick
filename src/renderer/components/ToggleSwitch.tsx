import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  checked, 
  onChange,
  disabled = false
}) => {
  return (
    <label
      className="switch"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '40px',
        height: '20px',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        style={{
          opacity: 0,
          width: 0,
          height: 0
        }}
      />
      <span
        className="switch-slider"
        style={{
          position: 'absolute',
          cursor: disabled ? 'not-allowed' : 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#1976d2' : '#ccc',
          transition: '.4s',
          borderRadius: '20px'
        }}
      >
        <span
          style={{
            position: 'absolute',
            content: '""',
            height: '16px',
            width: '16px',
            left: '2px',
            bottom: '2px',
            backgroundColor: 'white',
            transition: '.4s',
            borderRadius: '50%',
            transform: checked ? 'translateX(20px)' : 'translateX(0)'
          }}
        />
      </span>
    </label>
  );
};

export default ToggleSwitch; 