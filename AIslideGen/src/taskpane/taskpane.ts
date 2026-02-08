/* global PowerPoint console */

export type SlideTheme = "professional" | "casual" | "academic" | "creative" | "minimal";

export interface SlideData {
  title: string;
  bullets: string[];
  sources?: string[];
  theme?: SlideTheme;
}

interface ThemeStyle {
  titleSize: number;
  titleColor: string;
  titleBold: boolean;
  contentSize: number;
  contentColor: string;
  backgroundColor: string;
  accentColor: string;
}

export async function insertText(text: string) {
  try {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.getSelectedSlides().getItemAt(0);
      const textBox = slide.shapes.addTextBox(text);
      textBox.fill.setSolidColor("white");
      textBox.lineFormat.color = "black";
      textBox.lineFormat.weight = 1;
      textBox.lineFormat.dashStyle = PowerPoint.ShapeLineDashStyle.solid;
      await context.sync();
    });
  } catch (error) {
    console.log("Error: " + error);
  }
}

const themeStyles: Record<SlideTheme, ThemeStyle> = {
  professional: {
    titleSize: 36,
    titleColor: "#1F3864",
    titleBold: true,
    contentSize: 18,
    contentColor: "#333333",
    backgroundColor: "#FFFFFF",
    accentColor: "#0078D4",
  },
  casual: {
    titleSize: 40,
    titleColor: "#FF6B6B",
    titleBold: true,
    contentSize: 20,
    contentColor: "#2C3E50",
    backgroundColor: "#FFF9E6",
    accentColor: "#FFD93D",
  },
  academic: {
    titleSize: 32,
    titleColor: "#2C5F2D",
    titleBold: true,
    contentSize: 16,
    contentColor: "#1C1C1C",
    backgroundColor: "#F8F9FA",
    accentColor: "#97BC62",
  },
  creative: {
    titleSize: 44,
    titleColor: "#8B5CF6",
    titleBold: true,
    contentSize: 19,
    contentColor: "#4A5568",
    backgroundColor: "#FAF5FF",
    accentColor: "#EC4899",
  },
  minimal: {
    titleSize: 34,
    titleColor: "#000000",
    titleBold: false,
    contentSize: 17,
    contentColor: "#4A4A4A",
    backgroundColor: "#FFFFFF",
    accentColor: "#000000",
  },
};

export async function createSlide(slideData: SlideData) {
  try {
    await PowerPoint.run(async (context) => {
      const presentation = context.presentation;
      const slides = presentation.slides;
      slides.load("items");
      await context.sync();

      // Add a new slide at the end
      slides.add();
      await context.sync();

      // Get the newly added slide (last one)
      const newSlideIndex = slides.items.length - 1;
      const newSlide = slides.getItemAt(newSlideIndex);
      newSlide.load("shapes");
      await context.sync();

      // Get theme style
      const theme = slideData.theme || "professional";
      const style = themeStyles[theme];

      // Note: Shapes are layered in creation order (first created = bottom layer)

      // Add background rectangle for certain themes
      if (theme === "casual" || theme === "creative") {
        const bgRect = newSlide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle);
        bgRect.left = 0;
        bgRect.top = 0;
        bgRect.width = 720;
        bgRect.height = 540;
        bgRect.fill.setSolidColor(style.backgroundColor);
        bgRect.lineFormat.visible = false;
      }

      // Add accent bar for some themes (created after background, before text)
      if (theme === "professional" || theme === "creative" || theme === "academic") {
        const accentBar = newSlide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle);
        accentBar.left = 0;
        accentBar.top = 0;
        accentBar.width = 10;
        accentBar.height = 540;
        accentBar.fill.setSolidColor(style.accentColor);
        accentBar.lineFormat.visible = false;
      }

      // Add title text box (created last so it appears on top)
      const titleBox = newSlide.shapes.addTextBox(slideData.title);
      titleBox.left = theme === "minimal" ? 50 : 70;
      titleBox.top = theme === "creative" ? 40 : 50;
      titleBox.width = 640;
      titleBox.height = 80;
      titleBox.textFrame.textRange.font.size = style.titleSize;
      titleBox.textFrame.textRange.font.bold = style.titleBold;
      titleBox.textFrame.textRange.font.color = style.titleColor;
      titleBox.fill.clear();
      titleBox.lineFormat.visible = false;

      // Create bullet points in a text box
      const bulletText = slideData.bullets.map(bullet => `• ${bullet}`).join("\n");
      const contentBox = newSlide.shapes.addTextBox(bulletText);

      // Position and size the content box based on theme
      contentBox.left = theme === "minimal" ? 50 : 70;
      contentBox.top = theme === "creative" ? 140 : 150;
      contentBox.width = 640;
      contentBox.height = slideData.sources ? 300 : 350;

      // Style the content box
      contentBox.textFrame.textRange.font.size = style.contentSize;
      contentBox.textFrame.textRange.font.color = style.contentColor;
      contentBox.fill.clear();
      contentBox.lineFormat.visible = false;

      // Add sources citation box if sources exist
      if (slideData.sources && slideData.sources.length > 0) {
        const sourcesText = "Sources: " + slideData.sources.join(", ");
        const sourcesBox = newSlide.shapes.addTextBox(sourcesText);

        // Position at bottom of slide
        sourcesBox.left = 50;
        sourcesBox.top = 470;
        sourcesBox.width = 600;
        sourcesBox.height = 50;

        // Style as smaller, italicized text
        sourcesBox.textFrame.textRange.font.size = 10;
        sourcesBox.textFrame.textRange.font.italic = true;
        sourcesBox.textFrame.textRange.font.color = "#666666";
        sourcesBox.fill.setSolidColor("white");
        sourcesBox.lineFormat.visible = false;
      }

      await context.sync();
    });
  } catch (error) {
    console.log("Error creating slide: " + error);
    throw error;
  }
}
