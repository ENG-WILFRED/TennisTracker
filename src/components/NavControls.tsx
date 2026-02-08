"use client"

import React from "react";
import Button from './Button';

const NavControls: React.FC<{ showBack?: boolean; showForward?: boolean }> = ({ showBack = true, showForward = true }) => {
  return (
    <div className="flex items-center gap-2">
      {showBack && (
        <Button
          onClick={() => window.history.back()}
          aria-label="Go back"
          variant="outline"
        >
          ←
        </Button>
      )}
      {showForward && (
        <Button
          onClick={() => window.history.forward()}
          aria-label="Go forward"
          variant="outline"
        >
          →
        </Button>
      )}
    </div>
  );
};

export default NavControls;
