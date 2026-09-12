const { invoke } = window.__TAURI__.core

class Cell {
  constructor(x, y, res) {
    this.x = x
    this.y = y
    this.r = res
    this.col = 0
    this.row = 0
    this.xv = 0
    this.yv = 0
    this.prevXv = 0
    this.prevYv = 0
    this.pressure = 0
  }
}

class Particle {
  constructor(x, y) {
    this.x = this.px = x
    this.y = this.py = y
    this.xv = this.yv = 0
  }
}

class FluidSimulator {
  constructor() {
    this.canvas = document.getElementById('c')
    this.ctx = this.canvas.getContext('2d')

    // Configuration
    this.canvas_width = window.innerWidth * 0.9
    this.canvas_height = window.innerHeight * 0.8
    this.resolution = 20
    this.pen_size = 20
    this.speck_count = 40000

    this.num_cols = Math.floor(this.canvas_width / this.resolution)
    this.num_rows = Math.floor(this.canvas_height / this.resolution)

    // Snap canvas size to exact grid multiple to avoid edge alignment issues
    this.canvas_width = this.num_cols * this.resolution
    this.canvas_height = this.num_rows * this.resolution

    this.vec_cells = []
    this.particles = []

    this.mouse = {
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      vx: 0,
      vy: 0, // <--- add
      down: false
    }

    this.init()
  }

  init() {
    this.canvas.width = this.canvas_width
    this.canvas.height = this.canvas_height

    // Initialize Particles
    for (let i = 0; i < this.speck_count; i++) {
      this.particles.push(new Particle(
        Math.random() * this.canvas_width,
        Math.random() * this.canvas_height
      ))
    }

    // Initialize Grid Cells
    for (let col = 0; col < this.num_cols; col++) {
      this.vec_cells[col] = []
      for (let row = 0; row < this.num_rows; row++) {
        const cell = new Cell(col * this.resolution, row * this.resolution, this.resolution)
        cell.col = col
        cell.row = row
        this.vec_cells[col][row] = cell
      }
    }

    // Link Neighbors
    for (let col = 0; col < this.num_cols; col++) {
      for (let row = 0; row < this.num_rows; row++) {
        const cell = this.vec_cells[col][row]

        const row_up = (row - 1 >= 0) ? row - 1 : this.num_rows - 1
        const col_left = (col - 1 >= 0) ? col - 1 : this.num_cols - 1
        const col_right = (col + 1 < this.num_cols) ? col + 1 : 0

        const up = this.vec_cells[col][row_up]
        const left = this.vec_cells[col_left][row]
        const up_left = this.vec_cells[col_left][row_up]
        const up_right = this.vec_cells[col_right][row_up]

        cell.up = up
        cell.left = left
        cell.up_left = up_left
        cell.up_right = up_right

        up.down = this.vec_cells[col][row]
        left.right = this.vec_cells[col][row]
        up_left.down_right = this.vec_cells[col][row]
        up_right.down_left = this.vec_cells[col][row]
      }
    }

    this.addEventListeners()
    this.draw()
  }

  addEventListeners() {
    const handler = (e, down) => {
      if (e.cancelable) e.preventDefault()
      this.mouse.down = down
    }

    window.addEventListener('mousedown', (e) => handler(e, true))
    window.addEventListener('mouseup', (e) => handler(e, false))

    window.addEventListener('touchstart', (e) => {
      handler(e, true)
      const rect = this.canvas.getBoundingClientRect()
      this.mouse.x = this.mouse.px = e.touches[0].pageX - rect.left
      this.mouse.y = this.mouse.py = e.touches[0].pageY - rect.top
    }, { passive: false })

    window.addEventListener('touchend', (e) => {
      if (!e.touches.length) this.mouse.down = false
    })

    const moveHandler = (e, isTouch) => {
      if (e.cancelable) e.preventDefault()
      this.mouse.px = this.mouse.x
      this.mouse.py = this.mouse.y

      if (isTouch) {
        const rect = this.canvas.getBoundingClientRect()
        this.mouse.x = e.touches[0].pageX - rect.left
        this.mouse.y = e.touches[0].pageY - rect.top
      } else {
        this.mouse.x = e.offsetX || e.layerX
        this.mouse.y = e.offsetY || e.layerY
      }
    }

    this.canvas.addEventListener('mousemove', (e) => moveHandler(e, false))
    this.canvas.addEventListener('touchmove', (e) => moveHandler(e, true), { passive: false })
  }

  updateParticle() {
    this.ctx.lineWidth = 1
    // this.ctx.strokeStyle = "#FF0000";
    this.ctx.strokeStyle = `rgba(255,0,0,${this.redAlpha})`
    this.ctx.beginPath()

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      if (p.x >= 0 && p.x < this.canvas_width && p.y >= 0 && p.y < this.canvas_height) {
        const col = parseInt(p.x / this.resolution)
        const row = parseInt(p.y / this.resolution)
        const cell = this.vec_cells[col][row]

        const ax = (p.x % this.resolution) / this.resolution
        const ay = (p.y % this.resolution) / this.resolution

        p.xv += (1 - ax) * cell.xv * 0.25
        p.yv += (1 - ay) * cell.yv * 0.25
        p.xv += ax * cell.right.xv * 0.25
        p.yv += ax * cell.right.yv * 0.25
        p.xv += ay * cell.down.xv * 0.25
        p.yv += ay * cell.down.yv * 0.25

        p.x += p.xv
        p.y += p.yv

        const dx = p.px - p.x
        const dy = p.py - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const limit = Math.random() * 0.5

        this.ctx.moveTo(p.x, p.y)
        if (dist > limit) {
          this.ctx.lineTo(p.px, p.py)
        } else {
          this.ctx.lineTo(p.x + limit, p.y + limit)
        }

        p.px = p.x
        p.py = p.y
      } else {
        p.x = p.px = Math.random() * this.canvas_width
        p.y = p.py = Math.random() * this.canvas_height
        p.xv = p.yv = 0
      }

      p.xv *= 0.1
      p.yv *= 0.1
    }

    this.ctx.stroke()
  }

  changeCellVelocity(cell, mvelX, mvelY) {
    const dx = cell.x - this.mouse.x
    const dy = cell.y - this.mouse.y
    let dist = Math.sqrt(dy * dy + dx * dx)

    if (dist < this.pen_size) {
      if (dist < 4) dist = this.pen_size
      const power = this.pen_size / dist
      cell.xv += mvelX * power
      cell.yv += mvelY * power
    }
  }

  updatePressure(cell) {
    const pressure_x = (
      cell.up_left.xv * 0.5 + cell.left.xv + cell.down_left.xv * 0.5 -
      cell.up_right.xv * 0.5 - cell.right.xv - cell.down_right.xv * 0.5
    )
    const pressure_y = (
      cell.up_left.yv * 0.5 + cell.up.yv + cell.up_right.yv * 0.5 -
      cell.down_left.yv * 0.5 - cell.down.yv - cell.down_right.yv * 0.5
    )
    cell.pressure = (pressure_x + pressure_y) * 0.25
  }

  updateVelocity(cell) {
    cell.xv += (
      cell.up_left.pressure * 0.5 + cell.left.pressure + cell.down_left.pressure * 0.5 -
      cell.up_right.pressure * 0.5 - cell.right.pressure - cell.down_right.pressure * 0.5
    ) * 0.25

    cell.yv += (
      cell.up_left.pressure * 0.5 + cell.up.pressure + cell.up_right.pressure * 0.5 -
      cell.down_left.pressure * 0.5 - cell.down.pressure - cell.down_right.pressure * 0.5
    ) * 0.25

    // --- Memory: elastic pull toward previous velocity ---
    const mem = 0.04 // 0.02 subtle, 0.06 strong
    cell.xv += (cell.prevXv - cell.xv) * mem
    cell.yv += (cell.prevYv - cell.yv) * mem

    cell.xv *= 0.975
    cell.yv *= 0.975

    cell.prevXv = cell.xv
    cell.prevYv = cell.yv
  }

  draw() {
    const raw_xv = this.mouse.x - this.mouse.px
    const raw_yv = this.mouse.y - this.mouse.py

    // --- Memory: smooth cursor velocity (0.15–0.3 feels great) ---
    const smooth = 0.22
    this.mouse.vx = this.mouse.vx * (1 - smooth) + raw_xv * smooth
    this.mouse.vy = this.mouse.vy * (1 - smooth) + raw_yv * smooth

    const mouse_xv = this.mouse.vx
    const mouse_yv = this.mouse.vy

    // --- Rhythm: pulse "brightness" of the red ink ---
    const t = performance.now() * 0.001 // seconds
    const beat = 0.5 + 0.5 * Math.sin(t * 1.2) // 0..1 (slow pulse)
    this.redAlpha = 0.52 + 0.48 * beat // alpha 0.62..1.10

    for (let i = 0; i < this.vec_cells.length; i++) {
      const cell_datas = this.vec_cells[i]
      for (let j = 0; j < cell_datas.length; j++) {
        const cell = cell_datas[j]
        if (this.mouse.down) {
          this.changeCellVelocity(cell, mouse_xv, mouse_yv)
        }
        this.updatePressure(cell)
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.updateParticle()

    for (let i = 0; i < this.vec_cells.length; i++) {
      const cell_datas = this.vec_cells[i]
      for (let j = 0; j < cell_datas.length; j++) {
        const cell = cell_datas[j]
        this.updateVelocity(cell)
      }
    }

    this.mouse.px = this.mouse.x
    this.mouse.py = this.mouse.y

    requestAnimationFrame(() => this.draw())
  }
}

// Global Init with Error Handling
try {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // eslint-disable-next-line no-new
    new FluidSimulator()
  } else {
    window.onload = () => {
      // eslint-disable-next-line no-new
      new FluidSimulator()
    }
  }
} catch (e) {
  console.error('Failed to initialize Fluid Simulator:', e)
}
