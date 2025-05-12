import React from "react";

interface SendSquareProps {
  fill?: string;
  width?: number | string;
  height?: number | string;
  outline?: string | undefined;
  outlineWidth?: number | string;
}

const SendSquare: React.FC<SendSquareProps> = ({
  fill = "black",
  width = 24,
  height = 24,
  outline = "none",
  outlineWidth = 1,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={fill}
      viewBox="0 0 24 24"
      strokeWidth={outlineWidth}
      stroke={outline}
      height = {height}
      width = {width}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
      />
    </svg>
  );
};

export default SendSquare;
