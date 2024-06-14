document.addEventListener('DOMContentLoaded', function() {
  const styleSelects = document.querySelectorAll('select[name="wordart-style"]');
  const textAreas = document.querySelectorAll('textarea[name^="text-"]');
  const previews = document.querySelectorAll('.preview-one, .preview-two');

  styleSelects.forEach((select, index) => {
    select.addEventListener('change', function() {
      const selectedStyle = this.value;
      const section = this.closest('section');
      section.className = 'section-' + (index + 1);
      section.classList.add('style-' + selectedStyle);
      previews[index].textContent = textAreas[index].value;
    });
  });

  function updatePreview(e, index) {
    previews[index].textContent = e.target.value;
  }

  textAreas.forEach((textarea, index) => {
    textarea.addEventListener('input', function(e) {
      updatePreview(e, index);
    });
  });

  // Enable dragging for preview elements
  function makeDraggable(element) {
    let isMouseDown = false;
    let offset = { x: 0, y: 0 };

    element.addEventListener('mousedown', function(e) {
      isMouseDown = true;
      offset.x = element.offsetLeft - e.clientX;
      offset.y = element.offsetTop - e.clientY;
      element.style.zIndex = 1000;
    });

    document.addEventListener('mouseup', function() {
      isMouseDown = false;
      element.style.zIndex = '';
    });

    document.addEventListener('mousemove', function(e) {
      if (isMouseDown) {
        element.style.left = (e.clientX + offset.x) + 'px';
        element.style.top = (e.clientY + offset.y) + 'px';
      }
    });
  }

  makeDraggable(document.getElementById('preview-one'));
  makeDraggable(document.getElementById('preview-two'));

  // Position the previews in the center with a height difference
  const previewOne = document.getElementById('preview-one');
  const previewTwo = document.getElementById('preview-two');

  previewOne.style.top = (window.innerHeight / 2 - 50) + 'px'; // Adjust the value for desired vertical position
  previewTwo.style.top = (window.innerHeight / 2 + 50) + 'px'; // Adjust the value for desired vertical position

  previewOne.style.left = '50%';
  previewTwo.style.left = '50%';

  // Save canvas image using html2canvas
  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', function() {
    html2canvas(document.body).then(function(canvas) {
      const link = document.createElement('a');
      link.download = 'sticker.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  });
});

// P5.js code for canvas and image handling
class ImageEditor {
  constructor(frameWidth, frameHeight) {
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameX = (windowWidth - frameWidth) / 2;
    this.frameY = (windowHeight - frameHeight) / 2;
    this.img = null;
    this.initialImage = null;
    this.uploadButton = null;
    this.saveButton = null;
    this.undoButton = null;
    this.textOverlay1 = '';
    this.textOverlay2 = '';
    this.textX1 = this.frameX + 10; // Initial text position X for first text
    this.textY1 = this.frameY + this.frameHeight - 40; // Initial text position Y for first text
    this.textX2 = this.frameX + 10; // Initial text position X for second text
    this.textY2 = this.frameY + this.frameHeight - 10; // Initial text position Y for second text
    this.textColor = [255, 0, 0]; // Default color is red
    this.shape = 'rectangle';
    this.scaleSlider = null;
    this.scaleFactor = 1; // Default scale factor
    this.textSizeSlider1 = null; // Slider to control text size for first textarea
    this.textSizeSlider2 = null; // Slider to control text size for second textarea
    this.textSize1 = 32; // Default text size for first textarea
    this.textSize2 = 32; // Default text size for second textarea
  }

  setup() {
    createCanvas(windowWidth, windowHeight);

    // upload button
    this.uploadInput = createFileInput(file => this.handleFile(file));
    this.uploadInput.position(this.frameX - 570, this.frameY + 150);
    this.uploadInput.addClass('button-press-me');

    let uploadButton = createButton('<span>UPLOAD IMAGE</span>');
    uploadButton.addClass('button-press-me');
    uploadButton.position(this.frameX - 570, this.frameY + 150);
    uploadButton.mousePressed(() => this.uploadInput.elt.click());

    // save button
    let saveButton = createButton('SAVE🤍');
    saveButton.position(this.frameX + 75, this.frameY + this.frameHeight + 100);
    saveButton.id('saveButton');
    saveButton.mousePressed(() => this.saveImage());

    // range slider for image scaling
    let sliderX = this.frameX - 555; // Set the slider position on the left side
    let sliderY = this.frameY + this.frameHeight / 2 + 120; // Centering the slider vertically
    this.scaleSlider = createSlider(0.5, 2, 1, 0.01);
    this.scaleSlider.position(sliderX, sliderY);
    this.scaleSlider.style('width', '100px');

    // slider label for image scale
    this.scaleLabel = createP('Image Scale');
    this.scaleLabel.position(sliderX + 1, sliderY - 25);
    this.scaleLabel.style('color', 'blue');
    this.scaleLabel.style('font-size', '14px');

    // slider for text size 1
    this.textSizeSlider1 = createSlider(10, 100, 32, 1);
    this.textSizeSlider1.position(this.frameX + 630, this.frameY + this.frameHeight - 150);
    this.textSizeSlider1.style('width', '100px');

    // slider label for text size 1
    this.textSizeLabel1 = createP('Text Size 1');
    this.textSizeLabel1.position(this.frameX + 630, this.frameY + this.frameHeight - 170);
    this.textSizeLabel1.style('color', 'blue');
    this.textSizeLabel1.style('font-size', '14px');

    // Event listener for text size 1 slider
    this.textSizeSlider1.input(() => {
      let size = this.textSizeSlider1.value() + 'px';
      select('.preview-one').style('font-size', size);
    });

    // slider for text size 2
    this.textSizeSlider2 = createSlider(10, 100, 32, 1);
    this.textSizeSlider2.position(this.frameX + 630, this.frameY + this.frameHeight + 30);
    this.textSizeSlider2.style('width', '100px');

    // slider label for text size 2
    this.textSizeLabel2 = createP('Text Size 2');
    this.textSizeLabel2.position(this.frameX + 630, this.frameY + this.frameHeight + 10);
    this.textSizeLabel2.style('color', 'blue');
    this.textSizeLabel2.style('font-size', '14px');

    // Event listener for text size 2 slider
    this.textSizeSlider2.input(() => {
      let size = this.textSizeSlider2.value() + 'px';
      select('.preview-two').style('font-size', size);
    });

    // dropdown-menu shape
    let shapeSelector = createSelect();
    shapeSelector.position(this.frameX + 180, this.frameY + this.frameHeight + 10);
    shapeSelector.option('Rectangle');
    shapeSelector.option('Circle');
    shapeSelector.addClass('select-shape'); // Add the class here
    shapeSelector.changed(() => this.shape = shapeSelector.value().toLowerCase());
  }

  handleFile(file) {
    // image file
    if (file.type === 'image') {
      // load image
      this.img = loadImage(file.data, () => this.imageLoaded());
      // store initial state of the image
      this.initialImage = this.img.get();
    } else {
      console.log('Not a valid image file.');
    }
  }

  imageLoaded() {
    // resize image to fit frame
    let aspectRatio = this.img.width / this.img.height;
    if (aspectRatio > this.frameWidth / this.frameHeight) {
      this.img.resize(this.frameWidth, this.frameWidth / aspectRatio);
    } else {
      this.img.resize(this.frameHeight * aspectRatio, this.frameHeight);
    }
  }

  saveImage() {
    html2canvas(document.body).then(function(canvas) {
      const link = document.createElement('a');
      link.download = 'sticker.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  undo() {
    // restore initial state of image
    if (this.initialImage) {
      this.img = this.initialImage.get();
    }
  }

  applyText() {
    // text overlays
    const textAreas = document.querySelectorAll('textarea[name^="text-"]');
    this.textOverlay1 = textAreas[0].value;
    this.textOverlay2 = textAreas[1].value;
  }

  draw() {
    clear();
    fill(255);
    noStroke();

    // draw frame based on the selected shape
    switch (this.shape) {
      case 'rectangle':
        rect(this.frameX, this.frameY, this.frameWidth, this.frameHeight);
        break;
      case 'circle':
        ellipse(this.frameX + this.frameWidth / 2, this.frameY + this.frameHeight / 2, this.frameWidth, this.frameHeight);
        break;
    }

    // image inside the frame
    if (this.img) {
      this.drawMaskedImage();
    }

    // text overlays
    this.applyText();

    // Apply text styles
    const styleElements = document.querySelectorAll('select[name="wordart-style"]');

    if (this.textOverlay1) {
      const styleClass = 'style-' + styleElements[0].value;
      const previewOne = document.querySelector('.preview-one');
      previewOne.className = 'preview-one ' + styleClass;
      previewOne.textContent = this.textOverlay1;
    }

    if (this.textOverlay2) {
      const styleClass = 'style-' + styleElements[1].value;
      const previewTwo = document.querySelector('.preview-two');
      previewTwo.className = 'preview-two ' + styleClass;
      previewTwo.textContent = this.textOverlay2;
    }

    // update text position if mouse pressed on text
    if (mouseIsPressed) {
      const previewOne = document.getElementById('preview-one');
      const previewTwo = document.getElementById('preview-two');
      if (mouseX > this.textX1 && mouseX < this.textX1 + previewOne.clientWidth &&
        mouseY > this.textY1 - previewOne.clientHeight && mouseY < this.textY1 + previewOne.clientHeight) {
        this.textX1 = mouseX;
        this.textY1 = mouseY;
        previewOne.style.left = `${this.textX1}px`;
        previewOne.style.top = `${this.textY1}px`;
      }

      if (mouseX > this.textX2 && mouseX < this.textX2 + previewTwo.clientWidth &&
        mouseY > this.textY2 - previewTwo.clientHeight && mouseY < this.textY2 + previewTwo.clientHeight) {
        this.textX2 = mouseX;
        this.textY2 = mouseY;
        previewTwo.style.left = `${this.textX2}px`;
        previewTwo.style.top = `${this.textY2}px`;
      }
    }

    // update scale factor
    this.scaleFactor = this.scaleSlider.value();

    // update text size
    this.textSize1 = this.textSizeSlider1.value();
    this.textSize2 = this.textSizeSlider2.value();
  }

  drawMaskedImage(graphics = null) {
    const g = graphics || this.createTempGraphics();

    // create mask based on the selected shape
    g.drawingContext.save();
    g.drawingContext.beginPath();

    switch (this.shape) {
      case 'rectangle':
        g.rect(0, 0, this.frameWidth, this.frameHeight);
        break;
      case 'circle':
        g.ellipse(this.frameWidth / 2, this.frameHeight / 2, this.frameWidth, this.frameHeight);
        break;
    }

    g.drawingContext.clip();

    // draw the image within the masked area
    let imgX = (this.frameWidth - this.img.width * this.scaleFactor) / 2;
    let imgY = (this.frameHeight - this.img.height * this.scaleFactor) / 2;
    g.image(this.img, imgX, imgY, this.img.width * this.scaleFactor, this.img.height * this.scaleFactor);

    g.drawingContext.restore();

    if (!graphics) {
      image(g, this.frameX, this.frameY);
    }
  }

  createTempGraphics() {
    return createGraphics(this.frameWidth, this.frameHeight);
  }

  mousePressed() {
    // save current image before drawing a new one
    if (mouseX > this.frameX && mouseX < this.frameX + this.frameWidth &&
      mouseY > this.frameY && mouseY < this.frameY + this.frameHeight) {
      this.initialImage = this.img.get();
    }
  }
}

let editor;

function setup() {
  editor = new ImageEditor(300, 300);
  editor.setup();
}

function draw() {
  editor.draw();
}

function mousePressed() {
  editor.mousePressed();
}

// Draggable functionality for emojis
let emojis = ["😀", "🎉", "❤️", "👍", "🔥", "😂", "🤡", "✨"];
let draggableItems = [];
let selectedDraggable = null;

function addItem(content, styleClass, textSize) {
  let newItem = new Draggable(content, mouseX, mouseY, styleClass, textSize);
  draggableItems.push(newItem);
}

class Draggable {
  constructor(content, x, y, styleClass, textSize) {
    this.content = content;
    this.x = x;
    this.y = y;
    this.styleClass = styleClass;
    this.textSize = textSize;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  update() {
    if (this.dragging) {
      this.x = mouseX - this.offsetX;
      this.y = mouseY - this.offsetY;
    }
  }

  display() {
    push();
    textSize(this.textSize);
    if (this.styleClass === 'preview-text-one') {
      fill('blue');
      textFont('Impact');
    } else if (this.styleClass === 'preview-text-two') {
      fill('red');
      textFont('Impact');
    } else {
      textFont('Arial');
    }
    text(this.content, this.x, this.y);
    pop();
  }

  isMouseOver() {
    let bbox = textWidth(this.content);
    return mouseX > this.x && mouseX < this.x + bbox &&
           mouseY > this.y - this.textSize && mouseY < this.y;
  }
}

function mousePressed() {
  for (let i = draggableItems.length - 1; i >= 0; i--) {
    if (draggableItems[i].isMouseOver()) {
      selectedDraggable = draggableItems[i];
      selectedDraggable.dragging = true;
      selectedDraggable.offsetX = mouseX - selectedDraggable.x;
      selectedDraggable.offsetY = mouseY - selectedDraggable.y;
      draggableItems.splice(i, 1);
      draggableItems.push(selectedDraggable);
      break;
    }
  }
}

function mouseReleased() {
  if (selectedDraggable) {
    selectedDraggable.dragging = false;
    selectedDraggable = null;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  editor = new ImageEditor(300, 300);
  editor.setup();

  let startY = 100;
  for (let i = 0; i < emojis.length; i++) {
    let emoji = createDiv(emojis[i]);
    emoji.position(20, startY + i * 40);
    emoji.style('font-size', '32px');
    emoji.mousePressed(() => addItem(emojis[i], null, 32));
  }
}

function draw() {
  editor.draw();

  for (let item of draggableItems) {
    item.update();
    item.display();
  }
}
