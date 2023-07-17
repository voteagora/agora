import React, { useState } from "react";

type Props = {
  className?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  tooltipMessage?: string;
};

export function TextInputWithTooltip({
  className,
  onChange,
  placeholder,
  tooltipMessage,
}: Props) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleInputClick = () => {
    setIsTooltipVisible(true);
  };

  const handleInputBlur = () => {
    setIsTooltipVisible(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <TextInputTooltip
        className={className}
        placeholder={placeholder}
        onChange={onChange}
        onClick={handleInputClick}
        onBlur={handleInputBlur}
      />
      {isTooltipVisible && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            color: "white",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            bottom: "100%",
            left: 0,
            marginBottom: "4px",
            zIndex: 9999,
          }}
        >
          {tooltipMessage}
        </div>
      )}
    </div>
  );
}

type TextInputTooltipProps = {
  className?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onClick?: () => void;
  onBlur?: () => void;
};

export function TextInputTooltip({
  className,
  onChange,
  placeholder,
  onClick,
  onBlur,
}: TextInputTooltipProps) {
  return (
    // eslint-disable-next-line react/forbid-elements
    <input
      className={className}
      type="text"
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onClick={onClick} // Add 'onClick' prop here
      onBlur={onBlur} // Add 'onBlur' prop here
    />
  );
}
