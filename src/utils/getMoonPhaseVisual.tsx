import React from "react";
import newMoonImg from "../assets/phases/new.png";
import phase1 from "../assets/phases/1.png";
import phase2 from "../assets/phases/2.png";
import phase3 from "../assets/phases/3.png";
import phase4 from "../assets/phases/4.png";
import phase5 from "../assets/phases/5.png";
import phase6 from "../assets/phases/6.png";
import phase7 from "../assets/phases/7.png";
import phase8 from "../assets/phases/8.png";
import phase9 from "../assets/phases/9.png";
import phase10 from "../assets/phases/10.png";
import phase11 from "../assets/phases/11.png";
import phase12 from "../assets/phases/12.png";
import phase13 from "../assets/phases/13.png";
import phase14 from "../assets/phases/14.png";
import phase15 from "../assets/phases/15.png";
import phase16 from "../assets/phases/16.png";
import phase17 from "../assets/phases/17.png";
import phase18 from "../assets/phases/18.png";
import phase19 from "../assets/phases/19.png";
import phase20 from "../assets/phases/20.png";
import phase21 from "../assets/phases/21.png";
import phase22 from "../assets/phases/22.png";
import phase23 from "../assets/phases/23.png";
import phase24 from "../assets/phases/24.png";
import phase25 from "../assets/phases/25.png";
import phase26 from "../assets/phases/26.png";
import phase27 from "../assets/phases/27.png";
import phase28 from "../assets/phases/28.png";
import type { MoonPhaseEntry } from "../types/moonPhase";

const phaseImgs = [
  phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8, phase9, phase10,
  phase11, phase12, phase13, phase14, phase15, phase16, phase17, phase18, phase19, phase20,
  phase21, phase22, phase23, phase24, phase25, phase26, phase27, phase28
];

export function getMoonPhaseVisual(
  entry: MoonPhaseEntry,
  size: string = "2rem",
  className?: string,
  theme?: string // add theme prop
): React.ReactNode {
  const age = Math.floor(entry.moon_age_days);
  const imgSrc = (entry.major_phase === "New Moon" || age >= 28)
    ? newMoonImg.src
    : (age >= 0 && age < 28 ? phaseImgs[age].src : newMoonImg.src);

  // Only add background for traditional theme
  if (theme === "traditional") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          borderRadius: "50%",
          width: size,
          height: size,
          padding: 0,
        }}
        className={className}
      >
        <img
          src={imgSrc}
          alt="Moon phase"
          style={{
            width: "80%",
            height: "80%",
            display: "block",
            objectFit: "contain",
          }}
        />
      </span>
    );
  }
  // Default: just the image
  return <img src={imgSrc} alt="Moon phase" style={{ width: size, height: size }} className={className} />;
} 