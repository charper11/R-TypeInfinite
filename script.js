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
    let enemyFires = [];
    let playerBeams = [];
    let beamPower = 0;
    let stars = [];
    let shields = [];
    let equippedShields = [];
    let force = [];
    let equippedForce = [];
    let wall = [];
    let score = 0;
    let gameOver = false;

    //detect collision of two ellipsoids
    function collisionDetection(X1, Y1, W1, H1, X2, Y2, W2, H2, isCircle1, isCircle2) {

        const EllipsoidRadius = (w, h, direction) => {
            direction = [direction[0] / w, direction[1] / h];
            let m = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1]);
            if (m > 0) direction = [direction[0] / m, direction[1] / m];
            direction = [direction[0] * w, direction[1] * h];
            return Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1]);
        }

        let direction = [X1 - X2, Y1 - Y2];
        let distance = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1]);

        let radius1 = isCircle1 ? W1 : EllipsoidRadius(W1, H1, direction);
        let radius2 = isCircle2 ? W2 : EllipsoidRadius(W2, H2, direction);
        return distance < radius1 + radius2;
    }

    //star object for background
    class Star {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 1;
            this.height = 1;
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = 1;
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
                if (collisionDetection(this.x + this.width/2,
                                       this.y + this.height/2,
                                       this.width/2,
                                       this.height/2,
                                       enemy.x + enemy.width/2,
                                       enemy.y + enemy.height/2,
                                       enemy.width/2,
                                       enemy.height/2,
                                       false,
                                       false)) {
                    gameOver = true;
                }
            });

            //detect wall collision
            wall.forEach(w => {
                if(this.x < w.x + w.widthTotal &&
                   this.x + this.width > w.x &&
                   this.y < w.hitboxY + w.hitboxHeight &&
                   this.y + this.height > w.hitboxY){
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

            //detect enemy collision
            enemies.forEach(enemy => {
                if (collisionDetection(this.x + this.width/2,
                                       this.y + this.height/2,
                                       this.width/2,
                                       this.height/2,
                                       enemy.x + enemy.width/2,
                                       enemy.y + enemy.height/2,
                                       enemy.width/2,
                                       enemy.height/2,
                                       false,
                                       false)) {
                    this.markedForDeletion = true;
                    enemy.markedForDeletion = true;
                    score += 10;
                }
            });
            //detect collision with wall
            wall.forEach(w => {
                if(this.x < w.x + w.widthTotal &&
                   this.x + this.width > w.x &&
                   this.y < w.y + w.height &&
                   this.y + this.height > w.y){
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
        constructor(gameWidth, gameHeight, willFire){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 42;
            this.height = 48;
            this.image = document.getElementById("enemyImage");
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = 3;
            this.willFire = willFire;
            this.fireInterval = Math.random() * (this.gameWidth / this.speed);
            this.fireTimer = 0;
            this.markedForDeletion = false;
        }

        draw(context){
            context.strokeStyle = 'white';
            context.beginPath();
            context.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(){
            this.x -= this.speed;
            //if enemy goes off screen, delete
            if(this.x < 0 - this.width) this.markedForDeletion = true;
        }

        fire(deltaTime){
            if(this.fireTimer > this.fireInterval){
                const angle = this.getFireAngle();
                enemyFires.push(new EnemyFire(canvas.width, canvas.height, this.x, this.y, Math.cos(angle), Math.sin(angle)));
                this.willFire = false;
            } else {
                this.fireTimer += deltaTime;
            }
        }

        getFireAngle(){
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            return Math.atan2(dy, dx);
        }
    }

    //add, animate, and remove enemies
    function handleEnemies(deltaTime){
        if(enemyTimer > enemyInterval + randomEnemyInterval) {
            // each enemy has a 25% of firing
            const willFire = Math.random() < 0.25;
            if(wall.length === 0) {
                enemies.push(new Enemy(canvas.width, canvas.height, willFire));
            } else {
                enemies.push(new Enemy(canvas.width, canvas.height-wall[0].height, willFire));
            }
            enemyTimer = 0;
            randomEnemyInterval = Math.random()*1000;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update();
            if(enemy.willFire) enemy.fire(deltaTime);
        });
        //remove gone/dead enemies from array
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    // generate enemy fire
    class EnemyFire {
        constructor(gameWidth, gameHeight, x, y, xSpeed, ySpeed){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 12;
            this.height = 12;
            this.image = document.getElementById("enemyFire");
            this.frameX = 0;
            this.frameTimer = 0;
            this.maxFrame = 3;
            this.frameInterval = 1000/20;
            this.x = x;
            this.y = y;
            this.speed = 2;
            this.xSpeed = xSpeed * this.speed;
            this.ySpeed = ySpeed * this.speed;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime){
            //fire direction
            this.x += this.xSpeed;
            this.y += this.ySpeed;
            //remove beam from array if offscreen
            if(this.x > this.gameWidth + this.width || this.x < 0 || this.y > this.gameHeight + this.width || this.y < 0) this.markedForDeletion = true;

            //handle sprite
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            //detect collision with wall
            wall.forEach(w => {
                if(this.x < w.x + w.widthTotal &&
                   this.x + this.width > w.x &&
                   this.y < w.y + w.height &&
                   this.y + this.height > w.y){
                    this.markedForDeletion = true;
                   }
            });
        }
    }

    //animate and remove enemy fire
    function handleEnemyFire(deltaTime){
        enemyFires.forEach(fire => {
            fire.draw(ctx);
            fire.update(deltaTime);
        });
        //remove gone/collided beams from array
        enemyFires = enemyFires.filter(fire => !fire.markedForDeletion);
    }

    //generate shield items
    class ShieldItem {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 24;
            this.height = 24;
            this.frameX = 0;
            this.image = document.getElementById("shieldImage");
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = 4;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
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
            if(wall.length === 0){
                shields.push(new ShieldItem(canvas.width, canvas.height));
            } else {
                shields.push(new ShieldItem(canvas.width, canvas.height-wall[0].height));
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
            this.width = 24;
            this.height = 24;
            this.image = document.getElementById("shieldImage");
            this.frameX = 0;
            this.frameArray = [0, 44, 86, 130, 176, 222, 264, 304, 346, 386, 426, 470]
            this.maxFrame = 11;
            this.frameTimer = 0;
            this.frameInterval = 1000/20;
            this.x = x;
            this.y = y;
            this.lagTimer = 0;
            this.lagInterval = 1000/60;
            this.xQueue = [];
            this.yQueue = [];
            this.markedForDeletion = false;
            this.isTop = isTop;
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + 12, this.y + this.height/2, 12, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.frameArray[this.frameX], 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(x, y, deltaTime) {
            //handle location
            if(this.xQueue.length === 0) {
                this.x = x + 15;
                this.y = this.isTop ? y-50 : y+50;
            }
            this.xQueue.push(x);
            if(this.xQueue.length > 10) this.xQueue.shift();
            this.yQueue.push(y);
            if(this.yQueue.length > 10) this.yQueue.shift();

            if(this.lagTimer > this.lagInterval) {
                this.x = this.xQueue.shift() + 15;
                this.y = this.isTop ? this.yQueue.shift()-50 : this.yQueue.shift()+50;
                this.lagTimer = 0;
            } else {
                this.lagTimer += deltaTime;
            }

            //handle sprite
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            //detect enemy collision
            enemies.forEach(enemy => {
                if (collisionDetection(this.x + this.width/2,
                                       this.y + this.height/2,
                                       this.width/2,
                                       this.height/2,
                                       enemy.x + enemy.width/2,
                                       enemy.y + enemy.height/2,
                                       enemy.width/2,
                                       enemy.height/2,
                                       true,
                                       false)) {
                    enemy.markedForDeletion = true;
                    score += 10;
                }
            });
        }
    }

    //add, animate, and remove equipped shield
    function handleShieldEquipped(x, y, deltaTime) {
        equippedShields.forEach(shield => {
            shield.draw(ctx);
            shield.update(x, y, deltaTime);
        });
        //remove unequipped shields from array
        equippedShields = equippedShields.filter(shield => !shield.markedForDeletion);
    }

    //generate force items
    class ForceItem {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 34;
            this.height = 36;
            this.image = document.getElementById("forceImage");
            this.frameX = 0;
            this.x = 0;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = -1;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
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
            if(wall.length === 0){
                force.push(new ForceItem(canvas.width, canvas.height));
            } else {
                force.push(new ForceItem(canvas.width, canvas.height-wall[0].height));
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
            this.width = 36;
            this.height = 36;
            this.image = document.getElementById("forceImage");
            this.frameX = 0;
            this.frameArray = [0, 68, 136, 196, 258, 324];
            this.maxFrame = 5;
            this.frameTimer = 0;
            this.frameInterval = 1000/18;
            this.x = x+33;
            this.y = y;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + 36/2, this.y + this.height/2, 36/2, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.frameArray[this.frameX], 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(x, y, deltaTime) {
            this.x = x+65;
            this.y = y;

            //handle sprite
            if(this.frameTimer > this.frameInterval) {
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX ++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            //detect enemy collision
            enemies.forEach(enemy => {
                if (collisionDetection(this.x + this.width / 2,
                                       this.y + this.height / 2,
                                       this.width / 2,
                                       this.height / 2,
                                       enemy.x + enemy.width / 2,
                                       enemy.y + enemy.height / 2,
                                       enemy.width / 2,
                                       enemy.height / 2,
                                       true,
                                       false)) {
                    enemy.markedForDeletion = true;
                    score += 10;
                }
            });
        }
    }

    //add, animate, and remove equipped force
    function handleForceEquipped(x, y, deltaTime) {
        equippedForce.forEach(f => {
            f.draw(ctx);
            f.update(x, y, deltaTime);
        });
        //remove unequipped force from array
        equippedForce = equippedForce.filter(f => !f.markedForDeletion);
    }

    //generate wall that moves across the bottom of screen
    class Wall {
        constructor(gameWidth, gameHeight, count){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.count = count;
            this.widthStart = 54;
            this.widthMiddle = 70;
            this.widthEnd = 46;
            this.widthTotal = 100+(count*70);
            this.height = 64;
            this.hitboxHeight = 54;
            this.imageStart = document.getElementById("wallStart");
            this.imageMiddle = document.getElementById("wallMiddle");
            this.imageEnd = document.getElementById("wallEnd");
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.hitboxY = this.gameHeight - this.hitboxHeight;
            this.speed = 2;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.imageStart, this.x, this.y, this.widthStart, this.height);
            for(let i = 0; i < this.count; i++){
                context.drawImage(this.imageMiddle, this.x+this.widthStart+(this.widthMiddle*i), this.y, this.widthMiddle, this.height);
            }
            context.drawImage(this.imageEnd, this.x+this.widthTotal-this.widthEnd, this.y, this.widthEnd, this.height);
            context.strokeStyle = 'white';
            context.strokeRect(this.x, this.hitboxY, this.widthTotal, this.hitboxHeight);
        }

        update(){
            this.x -= this.speed;
            //if ship goes off screen, delete
            if(this.x < 0 - this.widthTotal) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove wall
    function handleWall(deltaTime){
        if(wallTimer > wallInterval) {
            //get size of wall
            const count = (Math.random()*20)+10;
            wall.push(new Wall(canvas.width, canvas.height, count));
            wallTimer = 0;
            wallInterval = Math.random()*100000;
        } else {
            if(wall.length === 0) wallTimer += deltaTime;
        }
        wall.forEach(w => {
            w.draw(ctx);
            w.update();
        });
        //remove gone wall from array
        wall = wall.filter(w => !w.markedForDeletion);
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
    //helper for generating wall
    let wallTimer = 0;
    let wallInterval = 10000;

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
        handleEnemyFire(deltaTime);
        handleShieldItem(deltaTime);
        handleShieldEquipped(player.x, player.y, deltaTime);
        handleForceItem(deltaTime);
        handleForceEquipped(player.x, player.y, deltaTime);
        handleWall(deltaTime);
        updateScore(deltaTime);
        displayStatusText(ctx, barCtx);
        if(!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});