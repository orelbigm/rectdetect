const { createCanvas, loadImage } = require('canvas');


export async function detectRectangles(imageBuffer) {
  // Load the image
  const img = await loadImage(imageBuffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // Convert image to grayscale
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const grayImageData = grayscale(imageData);

  // Apply Sobel filter for edge detection
  const sobelImageData = sobelFilter(grayImageData);

  // Find contours
  const contours = findContours(sobelImageData);

  // Filter out small contours (adjust the threshold as needed)
  const filteredContours = contours.filter(contour => contour.length > 50);

  // Extract corner coordinates from contours
  const rectangles = filteredContours.map(contour => {
    // Find the minimum area bounding rectangle
    const minAreaRect = findMinAreaRectangle(contour);

    // Extract corner coordinates
    const corners = minAreaRect.map(point => ({ x: point[0], y: point[1] }));

    return corners;
  });

  return rectangles;
}

// Find the minimum area bounding rectangle
function findMinAreaRectangle(points) {
  if (points.length < 4) return [];

  let minArea = Number.MAX_SAFE_INTEGER;
  let bestRectangle = [];

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];

    for (let j = i + 1; j < points.length; j++) {
      const p2 = points[j];

      for (let k = j + 1; k < points.length; k++) {
        const p3 = points[k];

        for (let l = k + 1; l < points.length; l++) {
          const p4 = points[l];

          const area = calculateArea(p1, p2, p3, p4);
          if (area < minArea) {
            minArea = area;
            bestRectangle = [p1, p2, p3, p4];
          }
        }
      }
    }
  }

  return bestRectangle;
}



/////////
function calculateArea(p1, p2, p3, p4) {
    const side1 = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    const side2 = Math.sqrt(Math.pow(p2[0] - p3[0], 2) + Math.pow(p2[1] - p3[1], 2));
    return side1 * side2;
}
  

// Convert image to grayscale
function grayscale(imageData) {
    const { width, height, data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    return imageData;
}

// Sobel filter for edge detection
function sobelFilter(imageData) {
    const { width, height, data } = imageData;
    const sobelData = new Uint8ClampedArray(width * height * 4);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const gx =
                data[((y - 1) * width + x + 1) * 4] +
                2 * data[(y * width + x + 1) * 4] +
                data[((y + 1) * width + x + 1) * 4] -
                data[((y - 1) * width + x - 1) * 4] -
                2 * data[(y * width + x - 1) * 4] -
                data[((y + 1) * width + x - 1) * 4];

            const gy =
                data[((y - 1) * width + x - 1) * 4] +
                2 * data[((y - 1) * width + x) * 4] +
                data[((y - 1) * width + x + 1) * 4] -
                data[((y + 1) * width + x - 1) * 4] -
                2 * data[((y + 1) * width + x) * 4] -
                data[((y + 1) * width + x + 1) * 4];

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            sobelData[(y * width + x) * 4] = magnitude;
            sobelData[(y * width + x) * 4 + 1] = magnitude;
            sobelData[(y * width + x) * 4 + 2] = magnitude;
            sobelData[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
        }
    }

    return { width, height, data: sobelData };
}
  
// Contour finding algorithm using depth-first search
function findContours(imageData) {
    const { width, height, data } = imageData;
    const visited = new Array(width * height).fill(false);
    const contours = [];

    function dfs(x, y, contour) {
        if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
        return;
        }

        visited[y * width + x] = true;

        if (data[(y * width + x) * 4] > 0) {
        contour.push([x, y]);
        dfs(x + 1, y, contour);
        dfs(x - 1, y, contour);
        dfs(x, y + 1, contour);
        dfs(x, y - 1, contour);
        }
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!visited[y * width + x] && data[(y * width + x) * 4] > 0) {
                const contour = [];
                dfs(x, y, contour);
                contours.push(contour);
            }
        }
    }

    return contours;
}