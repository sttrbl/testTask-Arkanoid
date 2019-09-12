class Platform {
  constructor({ width, height }) {
    this.width = width;
    this.height = height;
    this.x = (300 - width) / 2;
    this.y = 280 - height;
    this.img = new Image();
    this.img.src = 'img/platform.png';
  }
}


class Ball {
  constructor(radius, speed) {
    this.radius = radius;
    this.speed = speed;
    this.x = 150 + Math.round(Math.random() * (Math.random() > 0.45 ? -70 : 70));
    this.y = 230 + Math.round(Math.random() * (Math.random() > 0.3 ? -10 : 10));
    this.dirY = -1;
    this.dirX = Math.random() > 0.5 ? 1 : -1;
  }
}


class Block {
  constructor({ width, height }, coords) {
    this.width = width;
    this.height = height;
    [this.x, this.y] = coords;
    this.img = new Image();
    this.img.src = 'img/block.png';
  }
}


class Game {
  constructor(canvas, options) {
    this.state = 'inactive';
    this.options = options;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    canvas.addEventListener('click', () => {
      if (game.state !== 'active') game.start();
    });

    this.draw();
  }


  start() {
    this.init();
    this.draw();

    const ballMover = setInterval(() => {
      if (this.state !== 'active') {
        clearInterval(ballMover);
      }

      this.moveBall();
    }, 1000 / this.options.ballSpeed);
  }


  init() {
    /* betweenSpace* - расстояния между блоками */
    const blocksNum = this.options.colsNum * this.options.rowsNum;
    const betweenSpaceX = (this.width - (this.options.blockSize.width * this.options.colsNum)) / (this.options.colsNum + 1);
    const betweenSpaceY = 15;

    this.state = 'active';

    if (!this.platform) {
      this.platform = new Platform(this.options.platformSize);
      document.addEventListener('mousemove', (e) => this.movePlatform(e.clientX));
    }

    this.ball = new Ball(this.options.ballRadius, this.options.ballSpeed);
    this.blocks = [];

    const currentBlockCoords = [betweenSpaceX, betweenSpaceY];

    for (let i = 1; i <= blocksNum; i++) {
      this.blocks.push(new Block(this.options.blockSize, currentBlockCoords));

      if (i % this.options.colsNum) {
        currentBlockCoords[0] += this.options.blockSize.width + betweenSpaceX;
      } else {
        currentBlockCoords[0] = betweenSpaceX;
        currentBlockCoords[1] += this.options.blockSize.height + betweenSpaceY;
      }
    }
  }


  movePlatform(mousePosX) {
    const canvasCoords = this.canvas.getBoundingClientRect();
    const leftLimitX = canvasCoords.left + (this.platform.width / 2);
    const rightLimitX = canvasCoords.right - (this.platform.width / 2);

    if (mousePosX > leftLimitX) {
      this.platform.x = mousePosX > rightLimitX ? (this.width - this.platform.width) : (mousePosX - leftLimitX);
    } else {
      this.platform.x = 0;
    }
  }


  moveBall() {
    const ballLeft = this.ball.x - this.ball.radius;
    const ballRight = this.ball.x + this.ball.radius;
    const ballTop = this.ball.y - this.ball.radius;
    const ballBottom = this.ball.y + this.ball.radius;

    /* Прроигрыш */
    if (ballBottom >= this.height) {
      this.state = 'lose';
    }

    /* Столкновение с боковыми стенками */
    if (ballRight >= this.width || ballLeft <= 0) {
      this.ball.dirX *= -1;
    }

    /* Столкновение с верхней стенкой */
    if (ballTop <= 0) {
      this.ball.dirY *= -1;
    }

    /* Столкновение с платформой */
    if (ballBottom === (this.platform.y + Math.round(this.ball.radius / 4))) {
      if ((ballRight >= this.platform.x) && (ballLeft <= this.platform.x + this.platform.width)) {
        this.ball.dirY *= -1;
      }
    }

    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const blockTop = this.blocks[i].y;
      const blockBottom = this.blocks[i].y + this.blocks[i].height;
      const blockLeft = this.blocks[i].x;
      const blockRight = this.blocks[i].x + this.blocks[i].width;

      /* Столкновение с верхней или нижней границей блока */
      if (ballTop === blockBottom || ballBottom === blockTop) {
        if (ballRight >= blockLeft && ballLeft <= blockRight) {
          this.ball.dirY *= -1;
          this.blocks.splice(i, 1);
          continue;
        }
      }

      /* Столкновение с боковой границей блока */
      if (ballLeft === Math.round(blockRight) || ballRight === Math.round(blockLeft)) {
        if (ballBottom >= blockTop && ballTop <= blockBottom) {
          this.ball.dirX *= -1;
          this.blocks.splice(i, 1);
          continue;
        }
      }
    }

    /* Победа */
    if (!this.blocks.length) {
      this.state = 'win';
    }

    this.ball.x += this.ball.dirX;
    this.ball.y += this.ball.dirY;
  }


  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    switch (this.state) {
      case 'inactive':
        this.drawMenu();
        break;

      case 'active':
        this.drawGame();
        requestAnimationFrame(this.draw.bind(this));
        break;

      case 'lose':
        this.drawMenu('Вы проиграли!');
        break;

      case 'win':
        this.drawMenu('Вы победили!');
        break;

      default:
    }
  }


  drawMenu(message = 'Arkanoid.js') {
    this.ctx.fillStyle = '#292929';
    this.ctx.font = 'bold 22px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.width / 2, 140);
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Щёлкните по канве, чтобы начать игру', this.width / 2, 165);
  }


  drawPlatform() {
    this.ctx.drawImage(this.platform.img, this.platform.x, this.platform.y, this.platform.width, this.platform.height);
  }


  drawBall() {
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.closePath();
  }


  drawBlock({ img, x, y, width, height }) {
    this.ctx.drawImage(img, x, y, width, height);
  }


  drawGame() {
    this.drawBall();
    this.drawPlatform();
    this.blocks.forEach((block) => this.drawBlock(block));
  }
}


const canvasElem = document.querySelector('#canvas');

const gameOptions = {
  platformSize: {
    width: 100,
    height: 20,
  },
  ballRadius: 8,
  ballSpeed: 200,
  blockSize: {
    width: 55,
    height: 20,
  },
  colsNum: 4,
  rowsNum: 3,
};

const game = new Game(canvasElem, gameOptions);
