window.addEventListener('load', function(){
    const canvas = document.getElementById('gamePlayCanvas');
    // ctx = instance of built-in canvas 2D api that holds all drawing methods/properties
    const ctx = canvas.getContext('2d');
    canvas.width = 900;
    canvas.height = 550;

    const gameBarCanvas = document.getElementById('gameBarCanvas');
    const barCtx = gameBarCanvas.getContext('2d');
    gameBarCanvas.width = 900;
    gameBarCanvas.height = 50;

    let enemies = [];
    let playerLasers = [];
    let beamPower = 0;
    let stars = [];
    let shields = [];
    let equippedShields = [];
    let score = 0;
    let gameOver = false;

    //star object for background
    class Star {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 1;
            this.height = 1;
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = 4;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.fillStyle = 'white';
            context.fillRect(this.x, this.y, this.width, this.height);
        }

        update() {
            this.x -= this.speed;
            //if star goes off screen, delete
            if (this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //endlessly scrolling background
    function background() {
        stars.push(new Star(canvas.width, canvas.height));
        stars.forEach(star => {
            star.draw(ctx);
            star.update();
        });
        //remove stars from array
        stars = stars.filter(star => !star.markedForDeletion);
    }

    //apply event listeners to keyboard events and hold array of all currently active keys
    class InputHandler {
        constructor(){
            this.keys = [];
            //add key to keys array on keydown
            window.addEventListener('keydown', e => {
                if ((   e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp' ||
                        e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight' ||
                        e.key === 'Control')
                        && this.keys.indexOf(e.key) === -1){
                    this.keys.push(e.key);
                }
            });
            //remove key from key array on keyup
            window.addEventListener('keyup', e => {
                if (    e.key === 'ArrowDown'  ||
                        e.key === 'ArrowUp' ||
                        e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight' ||
                        e.key === 'Control'){
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    //react to keys as they are pressed, drawing/updating player
    class Player {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 65;
            this.height = 25;
            this.x = 0;
            this.y = gameHeight/2 - this.height;
            this.image = document.getElementById('playerImage');
            this.xSpeed = 0;
            this.ySpeed = 0;
        }
        draw(context){
            context.drawImage(this.image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(input){
            const PLAYER_SPEED = 7;
            // horizontal movement
            this.x += this.xSpeed;
            if(input.keys.indexOf('ArrowRight') > -1){
                this.xSpeed = PLAYER_SPEED;
            } else if(input.keys.indexOf('ArrowLeft') > -1){
                this.xSpeed = -PLAYER_SPEED;
            } else {
                this.xSpeed = 0;
            }
            if(this.x < 0) this.x = 0;
            else if(this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

            // vertical movement
            this.y += this.ySpeed;
            if(input.keys.indexOf('ArrowUp') > -1){
                this.ySpeed = -PLAYER_SPEED;
            } else if(input.keys.indexOf('ArrowDown') > -1){
                this.ySpeed = PLAYER_SPEED;
            } else {
                this.ySpeed = 0;
            }
            if(this.y < 0) this.y = 0;
            else if(this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;

            //detect collision
            enemies.forEach(enemy => {
                if(this.x < enemy.x + enemy.width &&
                   this.x + this.width > enemy.x &&
                   this.y < enemy.y + enemy.height &&
                   this.y + this.height > enemy.y){
                       gameOver = true;
                   }
            });
        }
    }

    // generate player laser blasts
    class PlayerLaser {
        constructor(gameWidth, gameHeight, x, y){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 33;
            this.height = 9;
            this.image = document.getElementById("playerLaserImage");
            this.x = x;
            this.y = y;
            this.speed = 12;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(){
            this.x += this.speed;
            //remove laser from array if offscreen
            if(this.x > this.gameWidth + this.width) this.markedForDeletion = true;

            //detect collision
            enemies.forEach(enemy => {
                if(this.x < enemy.x + enemy.width &&
                   this.x + this.width > enemy.x &&
                   this.y < enemy.y + enemy.height &&
                   this.y + this.height > enemy.y){
                    this.markedForDeletion = true;
                    enemy.markedForDeletion = true;
                    score += 10;
                   }
            });
        }
    }

    //add, animate, and remove player laser
    function handlePlayerLaser(input, x, y, deltaTime){
        if(input.keys.indexOf('Control') > -1) {
            if(laserTimer > laserInterval) {
                if(beamPower < 10) beamPower++;
                laserTimer = 0;
            } else {
                laserTimer += deltaTime;
            }
        } else if(beamPower) {
            playerLasers.push(new PlayerLaser(canvas.width, canvas.height, x, y));
            laserTimer = 0;
            beamPower = 0;
        } else {
            laserTimer += deltaTime;
        }
        playerLasers.forEach(laser => {
            laser.draw(ctx);
            laser.update();
        });
        //remove gone/collided lasers from array
        playerLasers = playerLasers.filter(laser => !laser.markedForDeletion);
    }

    //generate enemies
    class Enemy {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 107;
            this.height = 115;
            this.image = document.getElementById("enemyImage");
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = 8;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(){
            this.x -= this.speed;
            //if enemy goes off screen, delete
            if(this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove enemies
    function handleEnemies(deltaTime){
        if(enemyTimer > enemyInterval + randomEnemyInterval) {
            enemies.push(new Enemy(canvas.width, canvas.height));
            enemyTimer = 0;
            randomEnemyInterval = Math.random()*1000;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update();
        });
        //remove gone/dead enemies from array
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    //generate shield items
    class ShieldItem {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 33;
            this.height = 25;
            this.image = document.getElementById("shieldImage");
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = 4;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update() {
            this.x -= this.speed;

            // if player collides with shield item, remove it and add equipped shield object
            if(this.x < player.x + player.width &&
                this.x + this.width > player.x &&
                this.y < player.y + player.height &&
                this.y + this.height > player.y){
                    this.markedForDeletion = true;
                    if(equippedShields.length === 0) {
                        equippedShields.push(new ShieldEquipped(player.x, player.y, true));
                    } else if(equippedShields.length === 1) {
                        equippedShields.push(new ShieldEquipped(player.x, player.y, false));
                    }
                }

            //if shield goes off screen, delete
            if (this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove shield items
    function handleShieldItem(deltaTime) {
        if (shieldTimer > randomShieldInterval) {
            shields.push(new ShieldItem(canvas.width, canvas.height));
            shieldTimer = 0;
            randomShieldInterval = (Math.random() * 120000) + 120000;
        } else {
            shieldTimer += deltaTime;
        }
        shields.forEach(shield => {
            shield.draw(ctx);
            shield.update();
        });
        //remove gone/equipped shields from array
        shields = shields.filter(shield => !shield.markedForDeletion);
    }

    //generate equipped shield
    class ShieldEquipped {
        constructor(x, y, isTop) {
            this.width = 33;
            this.height = 25;
            this.image = document.getElementById("shieldImage");
            this.x = x;
            this.y = y;
            this.markedForDeletion = false;
            this.isTop = isTop;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(x, y) {
            this.x = x;
            this.y = this.isTop ? y-50 : y+50;

            //detect collision
            enemies.forEach(enemy => {
                if(this.x < enemy.x + enemy.width &&
                   this.x + this.width > enemy.x &&
                   this.y < enemy.y + enemy.height &&
                   this.y + this.height > enemy.y){
                    enemy.markedForDeletion = true;
                    score += 10;
                   }
            });
        }
    }

    //add, animate, and remove equipped shield
    function handleShieldEquipped(x, y) {
        equippedShields.forEach(shield => {
            shield.draw(ctx);
            shield.update(x, y);
        });
        //remove unequipped shields from array
        equippedShields = equippedShields.filter(shield => !shield.markedForDeletion);
    }

    //display score and game over message
    function displayStatusText(gameContext, barContext){
        displayBeamStatus(barContext);
        barContext.fillStyle = 'white';
        barContext.font = '20px Orbitron';
        barContext.fillText('Beam ', 200, 20);
        barContext.fillText('Score: ' + score, 20, 30);
        barContext.fillText('Hi: ' + localStorage.getItem('hiScore'), 500, 30);
        if(gameOver){
            gameContext.fillStyle = 'white';
            gameContext.font = '20px Orbitron';
            gameContext.textAlign = 'center';
            gameContext.fillText('GAME OVER', canvas.width/2, canvas.height/2);
            gameContext.fillText('Press SPACE to play again', canvas.width/2, canvas.height/2+100);
        }
    }

    //beam icon
    function displayBeamStatus(barContext){
        barContext.fillStyle = "blue";
        barContext.fillRect(300, 5, 10*beamPower, 15);
        barContext.strokeStyle = "white";
        barContext.strokeRect(300, 5, 100, 15);
    }

    function updateScore(deltaTime){
        if(scoreTime > 1000) {
            score++;
            scoreTime = 0;
        } else {
            scoreTime += deltaTime;
        }
        if(score > localStorage.getItem('hiScore')) localStorage.setItem('hiScore', score);
    }

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    //helper vars for generating enemies on time
    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random()*1000;
    //helper var for score
    let scoreTime = 0;
    //helper for player laser
    let laserTimer = 0;
    let laserInterval = 100;
    //helper for generating shield item
    let shieldTimer = 0;
    let randomShieldInterval = Math.random()*120000;

    //main animation loop running at 60fps
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0,0,canvas.width, canvas.height);
        barCtx.clearRect(0,0,gameBarCanvas.width, gameBarCanvas.height);
        background();
        player.draw(ctx);
        player.update(input);
        handlePlayerLaser(input, player.x, player.y, deltaTime);
        handleEnemies(deltaTime);
        handleShieldItem(deltaTime);
        handleShieldEquipped(player.x, player.y);
        updateScore(deltaTime);
        displayStatusText(ctx, barCtx);
        if(!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});