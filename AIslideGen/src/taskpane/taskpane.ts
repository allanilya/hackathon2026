/* global PowerPoint console */

export interface SlideData {
  title: string;
  bullets: string[];
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

      // Add title text box
      const titleBox = newSlide.shapes.addTextBox(slideData.title);
      titleBox.left = 50;
      titleBox.top = 50;
      titleBox.width = 600;
      titleBox.height = 80;
      titleBox.textFrame.textRange.font.size = 32;
      titleBox.textFrame.textRange.font.bold = true;
      titleBox.fill.setSolidColor("white");
      titleBox.lineFormat.visible = false;

      // Create bullet points in a text box
      const bulletText = slideData.bullets.map(bullet => `• ${bullet}`).join("\n");
      const contentBox = newSlide.shapes.addTextBox(bulletText);

      // Position and size the content box
      contentBox.left = 50;
      contentBox.top = 150;
      contentBox.width = 600;
      contentBox.height = 350;

      // Style the content box
      contentBox.textFrame.textRange.font.size = 18;
      contentBox.fill.setSolidColor("white");
      contentBox.lineFormat.visible = false;

      await context.sync();
    });
  } catch (error) {
    console.log("Error creating slide: " + error);
    throw error;
  }
}
