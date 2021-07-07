const hyperTexts = []
let system
let img
let link
let currentIndex = 0
let cursorPointer = false
let cursorIndex = null
let imgFade = 0

function randomTexts(amount = 4) {
  const texts = []
  while (texts.length < amount) {
    const idx = int(random(hyperTexts.length))
    if (idx !== currentIndex && !texts.includes(hyperTexts[idx])) {
      texts.push(hyperTexts[idx])
    }
  }
  texts.sort((a, b) => a.string.length < b.string.length)
  return texts
}

function parseStrings(strings) {
  for (let i = 0; i < strings.length; i++) {
    const subString = strings[i].split(',')
    const external = subString[3] ? subString[3] : null;
    const hypertext = {
      string: subString[0],
      id: i,
      link: parseInt(subString[1]),
      img: subString[2],
      external
    }
    hyperTexts.push(hypertext)
  }
}

function mouseVec() {
  const x = mouseX - width / 2
  const y = mouseY - height / 2
  return (createVector(x, y))
}

function resetTexts() {
  const fontSize = min(width, height) * 0.06
  const maxRadius = min(width, height) / 2 - fontSize
  system = new TextSystem(randomTexts(), fontSize / 4, maxRadius, fontSize)
  system.randomizeRotations()
  system.randomizeSpeeds()
  setLink()
}

function prepareImage() {
  const imgUrl = 'images/' + hyperTexts[currentIndex].img
  loadImage(imgUrl, result => {
    img = result
    img.resize(0, height)
    imgFade = 255
  })

}

function preload() {
  loadStrings('hypertext.txt', parseStrings)

}



function drawImg() {
  if (!img) return
  image(img, width / 2 - img.width / 2, height / 2 - img.height / 2)
  if (imgFade > 0) {
    imgFade -= 2
  }
  push()
  noStroke()
  fill(240, imgFade + 100)
  rect(0, 0, width, height)
  pop()
}

function mouseClicked() {
  if (cursorIndex) {
    currentIndex = cursorIndex.id
    resetTexts()
    prepareImage()
  }
}

function setLink() {
  const current = hyperTexts[currentIndex]
  if (!current) return
  if (current.external) {
    push()
    textSize(16)
    const linkWidth = textWidth(current.external)
    link.html(current.external)
    link.position(width - linkWidth, height - 36)
    link.attribute("href", current.external)
    pop()
  } else {
    link.html(null)
  }
}

function drawCurrent() {
  const current = hyperTexts[currentIndex]
  push()
  textSize(width / 40)
  rect(5, 5, textWidth(current.string) + 10, 36)
  text(current.string, 10, 30)
  pop()
}

class TextBand {
  constructor(hypertext, radius, fontSize) {
    this.hypertext = hypertext
    this.string = ' ' + hypertext.string + ' '
    this.radius = radius
    this.fontSize = fontSize
    this.rotation = 0
    this.rotationSpeed = 0
    this.bandWidth = this.fontSize * 0.66
    textSize(this.fontSize)
    this.textArc = textWidth(this.string) / this.radius
    this.bandHover = false
    this.textHover = false
    this.returnHome = false
    this.scale = 0
  }
  draw() {
    push()
    textSize(this.fontSize)
    translate(width / 2, height / 2)
    scale(this.scale)
    rotate(this.rotation)
    this.drawBand()
    this.drawString()
    pop()
  }
  drawString() {
    let arcLength = 0
    for (let c of this.string) {
      push()
      rotate(arcLength / this.radius)
      fill(240)
      if (this.textHover) {
        fill(10)
      }
      text(c, 0, -this.radius)
      arcLength += textWidth(c)
      pop()
    }
  }
  drawBand() {
    push()
    rotate(-HALF_PI)
    noFill()
    strokeCap(SQUARE)
    strokeWeight(this.fontSize)
    stroke(0, 200)
    if (this.textHover) {
      stroke(250)
    }
    const diameter = this.radius * 2 + this.bandWidth
    arc(0, 0, diameter, diameter, 0, this.textArc)
    pop()
  }
  checkVec(vec) {
    this.bandHover = false
    this.textHover = false
    if (abs(vec.mag() - (this.radius + this.bandWidth / 2)) <= this.bandWidth) {
      this.bandHover = true
      const centerAngle = p5.Vector.fromAngle(this.rotation - HALF_PI + this.textArc / 2)
      const angle = vec.angleBetween(centerAngle)
      if (abs(angle) < this.textArc / 2) {
        this.textHover = true
        return this.hypertext
      }
    }
  }
  rotate() {
    this.rotation += this.rotationSpeed

  }
}

class TextSystem {
  constructor(hyperTexts, gap = 0, maxRadius = 300, fontSize = 48) {
    this.bands = []
    hyperTexts.forEach((hypertext, idx) => {
      const textBand = new TextBand(hypertext, maxRadius - idx * (fontSize + gap), fontSize, random(0.005, 0.01) * random([-1, 1]))
      this.bands.push(textBand)
    })
  }
  draw() {
    cursorPointer = false
    this.bands.forEach(band => {
      band.draw()
      if (band.textHover) {
        cursorPointer = true
      }
    })
  }
  update() {
    const mVec = mouseVec()
    this.bands.forEach(band => {
      const hover = band.checkVec(mVec)
      cursorIndex = hover ? hover : cursorIndex
      band.rotate()
      if (band.scale < 1) {
        band.scale += 0.01
      } else {
        band.scale = 1
      }

    })
  }
  randomizeRotations() {
    this.bands.forEach(band => {
      band.rotation = random(TWO_PI)
    })
  }
  randomizeSpeeds() {
    this.bands.forEach((band, idx) => {
      band.rotationSpeed = random(0.001, 0.002 + idx * 0.002) * random([-1, 1])
    })
  }

}

function setup() {
  link = createA('', '', "_blank")
  createCanvas(windowWidth, windowHeight)
  resetTexts()
  prepareImage()
}

function draw() {
  background(240)
  drawImg()
  system.draw()
  system.update()
  if (cursorPointer) {
    cursor(HAND)
  } else {
    cursor(ARROW)
  }
  drawCurrent()
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}