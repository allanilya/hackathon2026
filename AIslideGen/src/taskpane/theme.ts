import {
  createDarkTheme,
  createLightTheme,
  Theme,
  BrandVariants,
} from "@fluentui/react-components";

// Custom orange brand colors matching the Slider landing page
const sliderBrand: BrandVariants = {
  10: "#0D0705",
  20: "#1F0E09",
  30: "#31140D",
  40: "#421A11",
  50: "#542015",
  60: "#66261A",
  70: "#792D1F",
  80: "#8D3324",
  90: "#A23A29",
  100: "#B7422F",
  110: "#CD4A35",
  120: "#D9583E",
  130: "#E06548",
  140: "#E57353",
  150: "#EA815F",
  160: "#EE8F6D",
};

// Create the custom dark theme
export const sliderDarkTheme: Theme = {
  ...createDarkTheme(sliderBrand),
  colorNeutralBackground1: "#1C1A17", // hsl(30, 8%, 10%)
  colorNeutralBackground2: "#1C1A17", // hsl(30, 8%, 10%)
  colorNeutralBackground3: "#1C1A17", // hsl(30, 8%, 10%)
  colorNeutralForeground1: "#FFFFFF",
  colorNeutralForeground2: "#E0E0E0",
  colorNeutralForeground3: "#B0B0B0",
  colorNeutralStroke1: "#2A2A2A",
  colorNeutralStroke2: "#1C1A17", // hsl(30, 8%, 10%)
};

// Create the custom light theme
export const sliderLightTheme: Theme = {
  ...createLightTheme(sliderBrand),
  colorNeutralBackground1: "#FFFFFF",
  colorNeutralBackground2: "#F5F5F5",
  colorNeutralBackground3: "#EBEBEB",
  colorNeutralForeground1: "#242424",
  colorNeutralForeground2: "#424242",
  colorNeutralForeground3: "#616161",
  colorNeutralStroke1: "#D1D1D1",
  colorNeutralStroke2: "#E0E0E0",
};
