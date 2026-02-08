/* global PowerPoint console */

import type { EditInstruction, SlideFormat } from "./types";

export type SlideTheme = "professional" | "casual" | "academic" | "creative" | "minimal" | "slider";

export type SlideLayout =
  | "title-content"      // Default: Title + bullet points
  | "title-only"         // Just a title, large centered
  | "two-column"         // Title + two columns of content
  | "big-number"         // Large number/stat + description
  | "quote"              // Large centered quote
  | "image-left"         // Image on left, content on right
  | "image-right";       // Image on right, content on left

export interface SlideData {
  title: string;
  bullets: string[];
  sources?: string[];
  theme?: SlideTheme;
  format?: SlideFormat;
  layout?: SlideLayout;
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
  slider: {
    titleSize: 38,
    titleColor: "#D4784A",
    titleBold: true,
    contentSize: 18,
    contentColor: "#D4CFC8",  // #D4CFC8 content color
    backgroundColor: "#0D0A07",  // #0D0A07 background
    accentColor: "#D4784A",  // #D4784A accent color
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

      // Load shapes to delete placeholders
      const shapes = newSlide.shapes;
      shapes.load("items");
      await context.sync();

      // Delete all placeholder shapes (like "Click to add title" boxes)
      const shapesToDelete = shapes.items.slice(); // Create a copy of the array
      for (const shape of shapesToDelete) {
        shape.delete();
      }
      await context.sync();

      // Get theme style and layout
      const theme = slideData.theme || "professional";
      const layout = slideData.layout || "title-content";
      const style = themeStyles[theme];

      // Note: Shapes are layered in creation order (first created = bottom layer)

      // Add background rectangle for certain themes
      if (theme === "casual" || theme === "creative" || theme === "slider") {
        const bgRect = newSlide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle);
        bgRect.left = 0;
        bgRect.top = 0;
        bgRect.width = 1000;
        bgRect.height = 540;
        bgRect.fill.setSolidColor(style.backgroundColor);
        bgRect.lineFormat.visible = false;
      }

      // Add accent bar for some themes (created after background, before text)
      if (theme === "professional" || theme === "creative" || theme === "academic" || theme === "slider") {
        const accentBar = newSlide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle);
        accentBar.left = 0;
        accentBar.top = 0;
        accentBar.width = 10;
        accentBar.height = 540;
        accentBar.fill.setSolidColor(style.accentColor);
        accentBar.lineFormat.visible = false;
      }

// Render content based on layout
      switch (layout) {
        case "title-only":
          // Large centered title only
          const titleOnlyBox = newSlide.shapes.addTextBox(slideData.title);
          titleOnlyBox.left = 60;
          titleOnlyBox.top = 200;
          titleOnlyBox.width = 600;
          titleOnlyBox.height = 140;
          titleOnlyBox.textFrame.textRange.font.size = style.titleSize + 16;
          titleOnlyBox.textFrame.textRange.font.bold = true;
          titleOnlyBox.textFrame.textRange.font.color = style.titleColor;
          titleOnlyBox.textFrame.verticalAlignment = PowerPoint.TextVerticalAlignment.middle;
          titleOnlyBox.fill.clear();
          titleOnlyBox.lineFormat.visible = false;
          break;

        case "two-column":
          // Title at top
          const twoColTitle = newSlide.shapes.addTextBox(slideData.title);
          twoColTitle.left = theme === "minimal" ? 50 : 70;
          twoColTitle.top = theme === "creative" ? 40 : 50;
          twoColTitle.width = 640;
          twoColTitle.height = 60;
          twoColTitle.textFrame.textRange.font.size = style.titleSize;
          twoColTitle.textFrame.textRange.font.bold = style.titleBold;
          twoColTitle.textFrame.textRange.font.color = style.titleColor;
          twoColTitle.fill.clear();
          twoColTitle.lineFormat.visible = false;

          // Split bullets into two columns
          const midpoint = Math.ceil(slideData.bullets.length / 2);
          const leftBullets = slideData.bullets.slice(0, midpoint);
          const rightBullets = slideData.bullets.slice(midpoint);

          // Left column
          const leftCol = newSlide.shapes.addTextBox(leftBullets.map(b => `• ${b}`).join("\n"));
          leftCol.left = theme === "minimal" ? 50 : 70;
          leftCol.top = 130;
          leftCol.width = 300;
          leftCol.height = slideData.sources ? 280 : 330;
          leftCol.textFrame.textRange.font.size = style.contentSize;
          leftCol.textFrame.textRange.font.color = style.contentColor;
          leftCol.fill.clear();
          leftCol.lineFormat.visible = false;

          // Right column
          const rightCol = newSlide.shapes.addTextBox(rightBullets.map(b => `• ${b}`).join("\n"));
          rightCol.left = 390;
          rightCol.top = 130;
          rightCol.width = 300;
          rightCol.height = slideData.sources ? 280 : 330;
          rightCol.textFrame.textRange.font.size = style.contentSize;
          rightCol.textFrame.textRange.font.color = style.contentColor;
          rightCol.fill.clear();
          rightCol.lineFormat.visible = false;
          break;

        case "big-number":
          // Large number/stat on left, description on right
          const bigNum = slideData.bullets[0] || "100%";
          const description = slideData.bullets.slice(1).join("\n");

          const numberBox = newSlide.shapes.addTextBox(bigNum);
          numberBox.left = 70;
          numberBox.top = 150;
          numberBox.width = 280;
          numberBox.height = 200;
          numberBox.textFrame.textRange.font.size = 72;
          numberBox.textFrame.textRange.font.bold = true;
          numberBox.textFrame.textRange.font.color = style.accentColor;
          numberBox.textFrame.verticalAlignment = PowerPoint.TextVerticalAlignment.middle;
          numberBox.fill.clear();
          numberBox.lineFormat.visible = false;

          const descBox = newSlide.shapes.addTextBox(description);
          descBox.left = 370;
          descBox.top = 150;
          descBox.width = 320;
          descBox.height = 200;
          descBox.textFrame.textRange.font.size = style.contentSize + 2;
          descBox.textFrame.textRange.font.color = style.contentColor;
          descBox.textFrame.verticalAlignment = PowerPoint.TextVerticalAlignment.middle;
          descBox.fill.clear();
          descBox.lineFormat.visible = false;

          // Title at top
          const bigNumTitle = newSlide.shapes.addTextBox(slideData.title);
          bigNumTitle.left = 70;
          bigNumTitle.top = 50;
          bigNumTitle.width = 640;
          bigNumTitle.height = 60;
          bigNumTitle.textFrame.textRange.font.size = style.titleSize;
          bigNumTitle.textFrame.textRange.font.bold = style.titleBold;
          bigNumTitle.textFrame.textRange.font.color = style.titleColor;
          bigNumTitle.fill.clear();
          bigNumTitle.lineFormat.visible = false;
          break;

        case "quote":
          // Large centered quote
          const quoteText = slideData.bullets[0] || slideData.title;
          const quoteBox = newSlide.shapes.addTextBox(`"${quoteText}"`);
          quoteBox.left = 100;
          quoteBox.top = 180;
          quoteBox.width = 520;
          quoteBox.height = 180;
          quoteBox.textFrame.textRange.font.size = style.titleSize + 4;
          quoteBox.textFrame.textRange.font.italic = true;
          quoteBox.textFrame.textRange.font.color = style.titleColor;
          quoteBox.textFrame.verticalAlignment = PowerPoint.TextVerticalAlignment.middle;
          quoteBox.fill.clear();
          quoteBox.lineFormat.visible = false;

          // Author/source if provided
          if (slideData.bullets.length > 1) {
            const authorBox = newSlide.shapes.addTextBox(`— ${slideData.bullets[1]}`);
            authorBox.left = 100;
            authorBox.top = 380;
            authorBox.width = 520;
            authorBox.height = 40;
            authorBox.textFrame.textRange.font.size = style.contentSize;
            authorBox.textFrame.textRange.font.color = style.contentColor;
            authorBox.fill.clear();
            authorBox.lineFormat.visible = false;
          }
          break;

        case "title-content":
        default:
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

          // Build content text based on slide format
          const format = slideData.format || "bullets";
          let contentText: string;
          let contentFontSize: number = style.contentSize;

          switch (format) {
            case "numbered":
              contentText = slideData.bullets.map((item, i) => `${i + 1}. ${item}`).join("\n");
              break;
            case "paragraph":
              contentText = slideData.bullets.join("\n\n");
              break;
            case "headline":
              contentText = slideData.bullets[0] || "";
              contentFontSize = Math.min(style.contentSize + 8, 28);
              break;
            case "bullets":
            default:
              contentText = slideData.bullets.map(bullet => `• ${bullet}`).join("\n");
              break;
          }

          const contentBox = newSlide.shapes.addTextBox(contentText);

          // Position and size the content box based on theme and format
          if (format === "headline") {
            contentBox.left = theme === "minimal" ? 50 : 70;
            contentBox.top = 200;
            contentBox.width = 640;
            contentBox.height = 200;
          } else {
            contentBox.left = theme === "minimal" ? 50 : 70;
            contentBox.top = theme === "creative" ? 140 : 150;
            contentBox.width = 640;
            contentBox.height = slideData.sources ? 300 : 350;
          }

          // Style the content box
          contentBox.textFrame.textRange.font.size = contentFontSize;
          contentBox.textFrame.textRange.font.color = format === "headline" ? style.titleColor : style.contentColor;
          if (format === "headline") {
            contentBox.textFrame.textRange.font.bold = true;
          }
          contentBox.fill.clear();
          contentBox.lineFormat.visible = false;
          break;
      }

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
        sourcesBox.textFrame.textRange.font.color = theme === "slider" ? "#9A9590" : "#666666";
        sourcesBox.fill.clear(); // Transparent background
        sourcesBox.lineFormat.visible = false;
      }

      await context.sync();
    });
  } catch (error) {
    console.log("Error creating slide: " + error);
    throw error;
  }
}

// ── Edit Functions ──

/**
 * Apply a set of edit instructions to the currently selected slide.
 * Returns an array of human-readable result strings.
 */
export async function applyEdits(instructions: EditInstruction[]): Promise<string[]> {
  const results: string[] = [];

  for (const instruction of instructions) {
    try {
      switch (instruction.operation) {
        case "change_title":
          await editShapeText("title", instruction.newText || "");
          results.push(`Changed title to "${instruction.newText}"`);
          break;

        case "replace_content":
          await editShapeText("content", instruction.newText || "");
          results.push("Replaced slide content");
          break;

        case "add_bullets":
          await addBulletsToContent(instruction.bulletsToAdd || []);
          results.push(`Added ${instruction.bulletsToAdd?.length || 0} bullet(s)`);
          break;

        case "remove_bullets":
          await removeBulletsFromContent(instruction.bulletsToRemove || []);
          results.push("Removed specified bullet(s)");
          break;

        case "rewrite":
          await editShapeText(instruction.target || "content", instruction.newText || "");
          results.push(`Rewrote ${instruction.target || "content"}`);
          break;

        case "restyle":
          await restyleShape(instruction.target || "content", instruction.style || {});
          results.push("Applied style changes");
          break;

        case "delete_slide":
          await deleteCurrentSlide();
          results.push("Deleted the slide");
          break;

        default:
          results.push(`Unknown operation: ${instruction.operation}`);
      }
    } catch (error) {
      console.error("Error applying edit instruction:", error);
      results.push(`Failed: ${instruction.operation} - ${error}`);
    }
  }

  return results;
}

/**
 * Find a shape by role ("title", "content", "sources") and replace its text.
 */
async function editShapeText(role: string, newText: string): Promise<void> {
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = slide.shapes;
    shapes.load("items");
    await context.sync();

    for (const shape of shapes.items) {
      try {
        shape.load("name, left, top, width, height");
        await context.sync();

        shape.load("textFrame");
        await context.sync();

        const textFrame = shape.textFrame;
        textFrame.load("textRange");
        await context.sync();

        textFrame.textRange.load("text");
        await context.sync();

        // Classify this shape by role
        let shapeRole = "unknown";
        if (shape.name.toLowerCase().includes("title") || (shape.top < 100 && shape.height < 120)) {
          shapeRole = "title";
        } else if (shape.top >= 100 && shape.top < 400) {
          shapeRole = "content";
        } else if (shape.top >= 400) {
          shapeRole = "sources";
        }

        if (shapeRole === role) {
          textFrame.textRange.text = newText;
          await context.sync();
          return;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`No shape with role "${role}" found on this slide`);
  });
}

/**
 * Append bullet points to the existing content shape.
 */
async function addBulletsToContent(bullets: string[]): Promise<void> {
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = slide.shapes;
    shapes.load("items");
    await context.sync();

    for (const shape of shapes.items) {
      try {
        shape.load("name, top, height");
        await context.sync();

        if (shape.top >= 100 && shape.top < 400) {
          shape.load("textFrame");
          await context.sync();
          const textFrame = shape.textFrame;
          textFrame.load("textRange");
          await context.sync();
          textFrame.textRange.load("text");
          await context.sync();

          const currentText = textFrame.textRange.text;

          // Detect existing format from current text
          const isNumbered = /^\d+\.\s/.test(currentText.trim());
          let newContent: string;
          if (isNumbered) {
            const existingCount = currentText.split("\n").filter(l => /^\d+\.\s/.test(l.trim())).length;
            newContent = bullets.map((b, i) => `${existingCount + i + 1}. ${b}`).join("\n");
          } else if (/^[\u2022\-\*]\s/.test(currentText.trim())) {
            newContent = bullets.map((b) => `\u2022 ${b}`).join("\n");
          } else {
            newContent = bullets.join("\n\n");
          }

          textFrame.textRange.text = currentText + "\n" + newContent;
          await context.sync();
          return;
        }
      } catch {
        continue;
      }
    }
  });
}

/**
 * Remove specific bullets from the content shape by matching text.
 */
async function removeBulletsFromContent(bulletsToRemove: string[]): Promise<void> {
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = slide.shapes;
    shapes.load("items");
    await context.sync();

    for (const shape of shapes.items) {
      try {
        shape.load("name, top, height");
        await context.sync();

        if (shape.top >= 100 && shape.top < 400) {
          shape.load("textFrame");
          await context.sync();
          const textFrame = shape.textFrame;
          textFrame.load("textRange");
          await context.sync();
          textFrame.textRange.load("text");
          await context.sync();

          const lines = textFrame.textRange.text.split("\n");
          const filtered = lines.filter((line) => {
            const lineText = line.replace(/^[\u2022\-\*]\s*/, "").trim().toLowerCase();
            return !bulletsToRemove.some((remove) => lineText.includes(remove.toLowerCase()));
          });

          textFrame.textRange.text = filtered.join("\n");
          await context.sync();
          return;
        }
      } catch {
        continue;
      }
    }
  });
}

/**
 * Apply style changes to a shape identified by role.
 */
async function restyleShape(
  target: string,
  style: { fontSize?: number; fontColor?: string; bold?: boolean; italic?: boolean; backgroundColor?: string }
): Promise<void> {
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = slide.shapes;
    shapes.load("items");
    await context.sync();

    for (const shape of shapes.items) {
      try {
        shape.load("name, top, height");
        await context.sync();

        let shapeRole = "unknown";
        if (shape.name.toLowerCase().includes("title") || (shape.top < 100 && shape.height < 120)) {
          shapeRole = "title";
        } else if (shape.top >= 100 && shape.top < 400) {
          shapeRole = "content";
        }

        if (shapeRole === target || target === "all") {
          shape.load("textFrame");
          await context.sync();
          const textFrame = shape.textFrame;
          textFrame.load("textRange");
          await context.sync();
          const textRange = textFrame.textRange;
          textRange.load("font");
          await context.sync();

          if (style.fontSize) textRange.font.size = style.fontSize;
          if (style.fontColor) textRange.font.color = style.fontColor;
          if (style.bold !== undefined) textRange.font.bold = style.bold;
          if (style.italic !== undefined) textRange.font.italic = style.italic;
          if (style.backgroundColor) {
            shape.fill.setSolidColor(style.backgroundColor);
          }

          await context.sync();
          if (target !== "all") return;
        }
      } catch {
        continue;
      }
    }
  });
}

/**
 * Delete the currently selected slide (refuses if it's the only slide).
 */
async function deleteCurrentSlide(): Promise<void> {
  await PowerPoint.run(async (context) => {
    const allSlides = context.presentation.slides;
    allSlides.load("items");
    await context.sync();

    if (allSlides.items.length <= 1) {
      throw new Error("Cannot delete the only slide in the presentation");
    }

    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    slide.delete();
    await context.sync();
  });
}
