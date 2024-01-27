const cv = require('opencv4nodejs');

export function detectRectangles(imageBuffer) {
  // Read image from buffer
  const img = cv.imdecode(imageBuffer);

  // Convert image to grayscale
  const grayImg = img.bgrToGray();

  // Apply Gaussian blur to reduce noise and help edge detection
  const blurredImg = grayImg.gaussianBlur(new cv.Size(5, 5), 0);

  // Use Canny edge detector
  const edges = blurredImg.canny(50, 150);

  // Find contours in the image
  const contours = edges.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const rectangles = [];

  // Iterate through contours
  for (let i = 0; i < contours.length; i++) {
    // Approximate the contour to a polygon
    const epsilon = 0.04 * contours[i].arcLength(true);
    const approx = contours[i].approxPolyDP(epsilon, true);

    // If the polygon has four corners, it's likely a rectangle
    if (approx.length === 4) {
      rectangles.push(approx);
    }
  }

  // Extract coordinates of corners
  const rectangleCoordinates = rectangles.map(rectangle => rectangle.getDataAsArray());

  return rectangleCoordinates;
}