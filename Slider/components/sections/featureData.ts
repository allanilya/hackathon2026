export interface Feature {
  id: number
  title: string
  description: string
  iconPaths: string[]  // Array of SVG path 'd' attributes
}

export const features: Feature[] = [
  {
    id: 1,
    title: "AI-Powered Skills",
    description: "Expert-crafted Skills that understand your intent and deliver professional results in seconds.",
    iconPaths: [
      "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
    ]
  },
  {
    id: 2,
    title: "Lives in PowerPoint",
    description: "No context switching. Slider works directly in your familiar PowerPoint environment as a sidebar.",
    iconPaths: [
      "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z",
      "M2 10h20"
    ]
  },
  {
    id: 3,
    title: "Instant Results",
    description: "Create polished slides in seconds, not hours. Focus on your message while AI handles the design.",
    iconPaths: [
      "M13 2L3 14h9l-1 10l10-12h-9l1-10z"
    ]
  },
  {
    id: 4,
    title: "Team Ready",
    description: "Share Skills across your organization. Everyone presents with the same professional quality.",
    iconPaths: [
      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2",
      "M9 11a4 4 0 100-8 4 4 0 000 8z",
      "M23 21v-2a4 4 0 00-3-3.87",
      "M16 3.13a4 4 0 010 7.75"
    ]
  }
]
