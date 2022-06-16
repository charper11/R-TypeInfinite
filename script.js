window.addEventListener('load', function(){
    const canvas = document.getElementById('gamePlayCanvas');
    // ctx = instance of built-in canvas 2D api that holds all drawing methods/properties
    const ctx = canvas.getContext('2d');
    canvas.width = 705;
    canvas.height = 490;

    const gameBarCanvas = document.getElementById('gameBarCanvas');
    const barCtx = gameBarCanvas.getContext('2d');
    gameBarCanvas.width = 900;
    gameBarCanvas.height = 50;

    let enemies = [];
    let playerBeams = [];
    let beamPower = 0;
    let stars = [];
    let shields = [];
    let equippedShields = [];
    let force = [];
    let equippedForce = [];
    let largeShip = [];
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
                        e.key === 's')
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
                        e.key === 's'){
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
            this.height = 30;
            this.frameX = 2;
            this.frameWait = 0;
            this.x = 0;
            this.y = gameHeight/2 - this.height;
            this.image = document.getElementById('playerImage');
            this.xSpeed = 0;
            this.ySpeed = 0;
        }
        draw(context){
            context.strokeStyle = 'white';
            context.beginPath();
            context.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(input){
            const PLAYER_SPEED = 3.5;
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
                //change sprite: if spriteX is at pos < 4 move up
                //wait to go from 3 to 4
                if(this.frameX < 4){
                    if(this.frameX === 3 && this.frameWait < 10){
                        this.frameWait++;
                    } else {
                        this.frameX++;
                        this.frameWait = 0;
                    }
                }
            } else if(input.keys.indexOf('ArrowDown') > -1){
                this.ySpeed = PLAYER_SPEED;
                //change sprite: if spriteX is at pos > 0 move down
                //wait to go from 1 to 0
                if(this.frameX > 0){
                    if(this.frameX === 1 && this.frameWait < 10){
                        this.frameWait++;
                    } else {
                        this.frameX--;
                        this.frameWait = 0;
                    }
                }
            } else {
                this.ySpeed = 0;
                //change sprite: if spriteX is at pos 0, 1, 3, 4, move up/down by 1
                if(this.frameX < 2) {
                    if(this.frameX === 1 && this.frameWait < 10){
                        this.frameWait++;
                    } else {
                        this.frameX++;
                        this.frameWait = 0;
                    }
                } else if(this.frameX > 2) {
                    if(this.frameX === 3 && this.frameWait < 10){
                        this.frameWait++;
                    } else {
                        this.frameX--;
                        this.frameWait = 0;
                    }
                }
            }
            if(this.y < 0) this.y = 0;
            else if(this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;

            //detect enemy collision
            enemies.forEach(enemy => {
                if(this.x < enemy.x + enemy.width &&
                   this.x + this.width > enemy.x &&
                   this.y < enemy.y + enemy.height &&
                   this.y + this.height > enemy.y){
                       gameOver = true;
                   }
            });

            //detect large ship collision
            largeShip.forEach(ship => {
                if(this.x < ship.x + ship.width &&
                   this.x + this.width > ship.x &&
                   this.y < ship.y + ship.height &&
                   this.y + this.height > ship.y){
                       gameOver = true;
                   }
            });
        }
    }

    // generate player beam blasts
    class PlayerBeam {
        constructor(gameWidth, gameHeight, x, y){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 32;
            this.height = 8;
            this.image = document.getElementById("playerBeamImage");
            this.x = x;
            this.y = y;
            this.speed = 25;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(){
            this.x += this.speed;
            //remove beam from array if offscreen
            if(this.x > this.gameWidth + this.width) this.markedForDeletion = true;

            //detect collision with enemy
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
            //detect collision with large ship
            largeShip.forEach(ship => {
                if(this.x < ship.x + ship.width &&
                   this.x + this.width > ship.x &&
                   this.y < ship.y + ship.height &&
                   this.y + this.height > ship.y){
                    this.markedForDeletion = true;
                   }
            });
        }
    }

    //add, animate, and remove player beam
    function handlePlayerBeam(input, x, y, deltaTime){
        if(input.keys.indexOf('s') > -1) {
            if(beamTimer > beamInterval) {
                if(beamPower < 10) beamPower++;
                beamTimer = 0;
            } else {
                beamTimer += deltaTime;
            }
        } else if(beamPower) {
            playerBeams.push(new PlayerBeam(canvas.width, canvas.height, x, y));
            beamTimer = 0;
            beamPower = 0;
        } else {
            beamTimer += deltaTime;
        }
        playerBeams.forEach(beam => {
            beam.draw(ctx);
            beam.update();
        });
        //remove gone/collided beams from array
        playerBeams = playerBeams.filter(beam => !beam.markedForDeletion);
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
            this.speed = 4;
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
            if(largeShip.length === 0) {
                enemies.push(new Enemy(canvas.width, canvas.height));
            } else {
                enemies.push(new Enemy(canvas.width, canvas.height-largeShip[0].height));
            }
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
            if(largeShip.length === 0){
                shields.push(new ShieldItem(canvas.width, canvas.height));
            } else {
                shields.push(new ShieldItem(canvas.width, canvas.height-largeShip[0].height));
            }
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

    //generate force items
    class ForceItem {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 63;
            this.height = 53;
            this.image = document.getElementById("forceImage");
            this.x = 0;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = -4;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update() {
            this.x -= this.speed;

            // if player collides with force item, remove it and add equipped force object
            if(this.x < player.x + player.width &&
                this.x + this.width > player.x &&
                this.y < player.y + player.height &&
                this.y + this.height > player.y){
                    this.markedForDeletion = true;
                    if(equippedForce.length === 0) {
                        equippedForce.push(new ForceEquipped(player.x, player.y));
                    }
                }

            //if force goes off screen, delete
            if (this.x > this.gameWidth + this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove force items
    function handleForceItem(deltaTime) {
        if (forceTimer > randomForceInterval) {
            if(largeShip.length === 0){
                force.push(new ForceItem(canvas.width, canvas.height));
            } else {
                force.push(new ForceItem(canvas.width, canvas.height-largeShip[0].height));
            }
            forceTimer = 0;
            randomForceInterval = (Math.random() * 120000) + 300000;
        } else {
            forceTimer += deltaTime;
        }
        force.forEach(f => {
            f.draw(ctx);
            f.update();
        });
        //remove gone/equipped force items from array
        force = force.filter(f => !f.markedForDeletion);
    }

    //generate equipped force
    class ForceEquipped {
        constructor(x, y) {
            this.width = 63;
            this.height = 53;
            this.image = document.getElementById("forceImage");
            this.x = x+33;
            this.y = y;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(x, y) {
            this.x = x+63;
            this.y = y;

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

    //add, animate, and remove equipped force
    function handleForceEquipped(x, y) {
        equippedForce.forEach(f => {
            f.draw(ctx);
            f.update(x, y);
        });
        //remove unequipped force from array
        equippedForce = equippedForce.filter(f => !f.markedForDeletion);
    }

    //generate large ship that moves across the bottom of screen
    class LargeShip {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 1845;
            this.height = 330;
            this.image = document.getElementById("largeShipImage");
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.speed = 2;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(){
            this.x -= this.speed;
            //if ship goes off screen, delete
            if(this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove large ship
    function handleLargeShip(deltaTime){
        if(largeShipTimer > largeShipInterval) {
            largeShip.push(new LargeShip(canvas.width, canvas.height));
            largeShipTimer = 0;
            largeShipInterval = Math.random()*100000;
        } else {
            largeShipTimer += deltaTime;
        }
        largeShip.forEach(ship => {
            ship.draw(ctx);
            ship.update();
        });
        //remove gone large ship from array
        largeShip = largeShip.filter(ship => !ship.markedForDeletion);
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
    //helper for player beam
    let beamTimer = 0;
    let beamInterval = 100;
    //helper for generating shield item
    let shieldTimer = 0;
    let randomShieldInterval = Math.random()*120000;
    //helper for generating force item
    let forceTimer = 0;
    let randomForceInterval = Math.random()*120000;
    //helper for generating large ship
    let largeShipTimer = 0;
    let largeShipInterval = 10000;

    //main animation loop running at 60fps
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0,0,canvas.width, canvas.height);
        barCtx.clearRect(0,0,gameBarCanvas.width, gameBarCanvas.height);
        background();
        player.draw(ctx);
        player.update(input);
        handlePlayerBeam(input, player.x+player.width-10, player.y+player.height/2, deltaTime);
        handleEnemies(deltaTime);
        handleShieldItem(deltaTime);
        handleShieldEquipped(player.x, player.y);
        handleForceItem(deltaTime);
        handleForceEquipped(player.x, player.y);
        handleLargeShip(deltaTime);
        updateScore(deltaTime);
        displayStatusText(ctx, barCtx);
        if(!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});