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
  
// Find the minimum area bounding rectangle using Rotating Calipers
// this to address rectangles with inclination, 
// Rotating Calipers found in internet, not my implementation
function findMinAreaRectangle(points) {
    if (points.length < 4) return [];

    let minArea = Number.MAX_SAFE_INTEGER;
    let bestRectangle = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
  
      const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
  
      for (let j = 0; j < points.length; j++) {
        const rotatedX = (points[j][0] - p1[0]) * Math.cos(angle) + (points[j][1] - p1[1]) * Math.sin(angle);
        const rotatedY = -(points[j][0] - p1[0]) * Math.sin(angle) + (points[j][1] - p1[1]) * Math.cos(angle);
  
        minX = Math.min(minX, rotatedX);
        minY = Math.min(minY, rotatedY);
        maxX = Math.max(maxX, rotatedX);
        maxY = Math.max(maxY, rotatedY);
      }
  
      const area = (maxX - minX) * (maxY - minY);
  
      if (area < minArea) {
        minArea = area;
        bestRectangle = [
          [minX * Math.cos(angle) - minY * Math.sin(angle) + p1[0], minX * Math.sin(angle) + minY * Math.cos(angle) + p1[1]],
          [maxX * Math.cos(angle) - minY * Math.sin(angle) + p1[0], maxX * Math.sin(angle) + minY * Math.cos(angle) + p1[1]],
          [maxX * Math.cos(angle) - maxY * Math.sin(angle) + p1[0], maxX * Math.sin(angle) + maxY * Math.cos(angle) + p1[1]],
          [minX * Math.cos(angle) - maxY * Math.sin(angle) + p1[0], minX * Math.sin(angle) + maxY * Math.cos(angle) + p1[1]],
        ];
      }
    }
  
    return bestRectangle;
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


// workable solution,
// sample output
/*
const output = [
    {
        "id": 0,
        "coordinates": [
            {
                "x": 43.096000000000046,
                "y": 397.472
            },
            {
                "x": 106.36000000000001,
                "y": 49.51999999999998
            },
            {
                "x": 160.65599999999998,
                "y": 59.39199999999994
            },
            {
                "x": 97.392,
                "y": 407.344
            }
        ]
    },
    {
        "id": 1,
        "coordinates": [
            {
                "x": 196.72800000000004,
                "y": 424.496
            },
            {
                "x": 259.992,
                "y": 76.54400000000004
            },
            {
                "x": 314.28799999999995,
                "y": 86.416
            },
            {
                "x": 251.024,
                "y": 434.368
            }
        ]
    },
    {
        "id": 2,
        "coordinates": [
            {
                "x": 350.34400000000005,
                "y": 451.608
            },
            {
                "x": 413.608,
                "y": 103.656
            },
            {
                "x": 467.904,
                "y": 113.52799999999996
            },
            {
                "x": 404.64,
                "y": 461.48
            }
        ]
    }
];
*/