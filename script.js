window.addEventListener('load', function(){
    const GAME_WIDTH = 705;
    const GAME_HEIGHT = 480;
    const INFO_HEIGHT = 50;
    const canvas = document.getElementById('gamePlayCanvas');
    // ctx = instance of built-in canvas 2D api that holds all drawing methods/properties
    const ctx = canvas.getContext('2d');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT + INFO_HEIGHT;

    let enemies = [];
    let enemyFires = [];
    let playerBeams = [];
    let beamPower = 0;
    let stars = [];
    let shields = [];
    let equippedShields = [];
    let force = [];
    let equippedForce = [];
    let topWall = [];
    let bottomWall = [];
    let explosions = [];
    let sparks = [];
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
        constructor(gameWidth, gameHeight, x) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = Math.floor(Math.random()*3)+1;
            this.height = Math.floor(Math.random()*3)+1;
            this.x = x;
            this.y = Math.random() * (this.gameHeight - this.height);
            this.speed = (this.height === 1 && this.width > 1) ? 4 : Math.floor(Math.random()*2)+1;
            this.markedForDeletion = false;
            this.color = Math.floor(Math.random()*4);
            this.colorOptions = ['rgb(0, 0, 255)', 'rgb(31, 81, 255)', 'rgb(139,0,139)', 'rgb(64,224,208)'];
        }

        draw(context) {
            context.fillStyle = this.colorOptions[this.color];
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
        if(stars.length < 100) stars.push(new Star(canvas.width, GAME_HEIGHT, canvas.width));
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
            this.x = 150;
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
                                       enemy.hitboxHeight[enemy.frameX]/2,
                                       false,
                                       false)) {
                    gameOver = true;
                }
            });

            //detect enemy fire collision
            enemyFires.forEach(fire => {
                if (collisionDetection(this.x + this.width/2,
                                       this.y + this.height/2,
                                       this.width/2,
                                       this.height/2,
                                       fire.x + fire.width/2,
                                       fire.y + fire.height/2,
                                       fire.width/2,
                                       fire.height/2,
                                       false,
                                       true)) {
                    gameOver = true;
                }
            });

            //detect wall collision
            bottomWall.forEach(w => {
                if(this.x < w.x + w.widthTotal &&
                   this.x + this.width > w.x &&
                   this.y < w.hitboxY + w.hitboxHeight &&
                   this.y + this.height > w.hitboxY){
                       gameOver = true;
                   }
            });
            topWall.forEach(w => {
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
        constructor(gameWidth, gameHeight, x, y, width, height, image, power, speed){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = width;
            this.height = height;
            this.image = document.getElementById(image);
            this.frameX = 0;
            this.frameTimer = 0;
            this.maxFrame = 1;
            this.frameInterval = 1000/20;
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.power = power;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
            context.strokeStyle = 'white';
            context.beginPath();
            context.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI*2);
            context.stroke();
        }

        update(deltaTime){
            this.x += this.speed;
            //remove beam from array if offscreen
            if(this.x > this.gameWidth + this.width) this.markedForDeletion = true;

            //handle sprite
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
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
                                       enemy.hitboxHeight[enemy.frameX]/2,
                                       false,
                                       false)) {
                    if(enemy.shield <= 0) {
                        enemy.markedForDeletion = true;
                        explosions.push(new Explosion(enemy.x, enemy.y));
                    } else {
                        enemy.shield -= this.power;
                        enemy.frameY = 1;
                    }
                    this.power--;
                    if(this.power === 0) this.markedForDeletion = true;
                    score += 10;
                    // handle item drop if player shoots item robot
                    if(enemy.name === "itemRobot"){
                        if(equippedForce.length === 0){
                            force.push(new ForceItem(canvas.width, GAME_HEIGHT));
                        } else {
                            shields.push(new ShieldItem(canvas.width, GAME_HEIGHT, enemy.x, enemy.y));
                        }
                    }
                }
            });
            //detect collision with wall
            bottomWall.forEach(w => {
                if(this.x < w.x + w.widthTotal &&
                   this.x + this.width > w.x &&
                   this.y < w.y + w.height &&
                   this.y + this.height > w.y){
                    this.markedForDeletion = true;
                   }
            });
            topWall.forEach(w => {
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
            //add spark animation when charging up
            if(sparks.length === 0 && beamPower > 1){
                if(equippedForce.length === 0) sparks.push(new ChargeSparks(x, player.y-player.height/2));
                else sparks.push(new ChargeSparks(x+equippedForce[0].width, player.y-player.height/2));
            }
            if(beamTimer > beamInterval) {
                if(beamPower < 10) beamPower++;
                beamTimer = 0;
            } else {
                beamTimer += deltaTime;
            }
        } else if(beamPower) {
            switch(beamPower) {
                case 1:
                    playerBeams.push(new PlayerBeam(canvas.width, GAME_HEIGHT, x, y, 32, 8, "charge1Image", 1, 25));
                    break;
                case 2:
                    playerBeams.push(new PlayerBeam(canvas.width, GAME_HEIGHT, x, y, 34, 24, "charge2Image", 2, 20));
                    break;
                case 3:
                    playerBeams.push(new PlayerBeam(canvas.width, GAME_HEIGHT, x, y, 66, 24, "charge3Image", 3, 15));
                    break;
                case 4:
                    playerBeams.push(new PlayerBeam(canvas.width, GAME_HEIGHT, x, y, 98, 28, "charge4Image", 4, 15));
                    break;
                case 5:
                    playerBeams.push(new PlayerBeam(canvas.width, GAME_HEIGHT, x, y, 130, 28, "charge5Image", 5, 15));
                    break;
                default:
                    //6
                    playerBeams.push(new PlayerBeam(canvas.width, GAME_HEIGHT, x, y, 161, 32, "charge6Image", 6, 15));
            }
            beamTimer = 0;
            beamPower = 0;
            //end spark animation on fire
            sparks.forEach(spark => {spark.markedForDeletion = true;});
        } else {
            beamTimer += deltaTime;
        }
        playerBeams.forEach(beam => {
            beam.draw(ctx);
            beam.update(deltaTime);
        });
        //remove gone/collided beams from array
        playerBeams = playerBeams.filter(beam => !beam.markedForDeletion);
    }

    // handle sparks on beam charge up
    class ChargeSparks {
        constructor(x, y){
            this.x = x;
            this.y = y;
            this.width = 62;
            this.height = 64;
            this.image = document.getElementById("chargeSparks");
            this.frameX = 7;
            this.frameTimer = 0;
            this.frameInterval = 1000/20;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(x, y, deltaTime){
            //stay with player, adjust if force equipped
            this.y = y;
            if(equippedForce.length === 0) this.x = x;
            else this.x = x+equippedForce[0].width;

            //handle sprite
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX <= 0) this.frameX = 7;
                else this.frameX--;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }
    }

    //animate and remove sparks
    function handleSparks(x, y, deltaTime) {
        sparks.forEach(spark => {
            spark.draw(ctx);
            spark.update(x, y, deltaTime);
        });
        //remove sparks on fire
        sparks = sparks.filter(spark => !spark.markedForDeletion);
    }

    // handle explosion on enemy death
    class Explosion {
        constructor(x, y){
            this.x = x;
            this.y = y;
            this.width = 72;
            this.height = 60;
            this.image = document.getElementById("enemyExplosion");
            this.frameX = 3;
            this.frameTimer = 0;
            this.frameInterval = 1000/20;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime){
            this.x--;
            //handle sprite
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX <= 0) this.markedForDeletion = true;
                else this.frameX--;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }
    }

    //animate and remove explosion
    function handleExplosions(deltaTime) {
        explosions.forEach(explosion => {
            explosion.draw(ctx);
            explosion.update(deltaTime);
        });
        //remove finished explosions
        explosions = explosions.filter(explosion => !explosion.markedForDeletion);
    }

    //generate enemies
    class Enemy {
        constructor(gameWidth, gameHeight, willFire){
            this.name = "enemy1";
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 40;
            this.height = 50;
            this.hitboxHeight = [50, 30, 15, 14, 30];
            this.image = document.getElementById("enemyImage");
            this.frameX = 0;
            this.maxFrameX = 4;
            this.frameTimer = 0;
            this.frameInterval = 1000/10;
            this.x = this.gameWidth;
            this.y = Math.random() * (this.gameHeight - this.height) + (topWall.length * 64);
            this.speed = 3;
            this.willFire = willFire;
            this.fireInterval = (Math.random() * (this.gameWidth / (this.speed*60)))*1000;
            this.fireTimer = 0;
            this.shield = 0;
            this.markedForDeletion = false;
        }

        draw(context){
            context.strokeStyle = 'white';
            context.beginPath();
            context.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.hitboxHeight[this.frameX]/2, 0, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime){
            //move enemy
            this.x -= this.speed;
            //handle sprite
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX === this.maxFrameX) {
                    this.frameX = 0;
                } else {
                    this.frameX++;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            //if enemy goes off screen, delete
            if(this.x < 0 - this.width) this.markedForDeletion = true;
        }

        fire(deltaTime){
            if(this.fireTimer > this.fireInterval){
                const angle = this.getFireAngle();
                enemyFires.push(new EnemyFire(canvas.width, GAME_HEIGHT, this.x, this.y, Math.cos(angle), Math.sin(angle)));
                this.willFire = false;
                this.fireTimer = 0;
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
            if(bottomWall.length === 0 && topWall.length === 0) {
                enemies.push(new Enemy(canvas.width, GAME_HEIGHT, willFire));
            } else if(bottomWall.length > 0 && topWall.length > 0) {
                enemies.push(new Enemy(canvas.width, GAME_HEIGHT-(bottomWall[0].height*2), willFire));
            } else {
                enemies.push(new Enemy(canvas.width, GAME_HEIGHT-64, willFire));
            }
            enemyTimer = 0;
            randomEnemyInterval = Math.random()*1000;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
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
            this.speed = 4;
            this.xSpeed = xSpeed * this.speed;
            this.ySpeed = ySpeed * this.speed;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image, this.width * this.frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + 6, this.y + this.height/2, 6, 0, Math.PI*2);
            context.stroke();
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
            bottomWall.forEach(w => {
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

    class LargeEnemy extends Enemy {
        constructor(gameWidth, gameHeight){
            super(gameWidth, gameHeight);
            this.width = 98;
            this.height = 90;
            this.image = document.getElementById("largeEnemy");
            this.willFire = false;
            this.fireInterval = (Math.random() * 2000)+1000;
            this.shield = 6;
            this.frameY = 0;
            this.hitboxHeight = [90];
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, 0, this.height*this.frameY, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime){
            //movement
            this.x -= this.speed;
            //fire
            this.fire(deltaTime);
            //reset frameY incase its been hit
            this.frameY = 0;
            //if enemy goes off screen, delete
            if(this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove large enemies
    function handleLargeEnemies(deltaTime){
        if(largeEnemyTimer > largeEnemyInterval) {
            if(bottomWall.length === 0 && topWall.length === 0) {
                enemies.push(new LargeEnemy(canvas.width, GAME_HEIGHT));
            } else if(bottomWall.length > 0 && topWall.length > 0) {
                enemies.push(new LargeEnemy(canvas.width, GAME_HEIGHT-(bottomWall[0].height*2)));
            } else {
                enemies.push(new LargeEnemy(canvas.width, GAME_HEIGHT-64));
            }
            largeEnemyTimer = 0;
            largeEnemyInterval = Math.random() * 10000;
        } else {
            largeEnemyTimer += deltaTime;
        }
    }

    //generate item robots
    class ItemRobot extends Enemy {
        constructor(gameWidth, gameHeight){
            super(gameWidth, gameHeight);
            this.name = "itemRobot";
            this.width = 73;
            this.height = 61;
            this.image = document.getElementById("itemRobot");
            this.speed = 3;
            this.willFire = false;
            this.hitboxHeight = [55];
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.hitboxHeight[this.frameX]/2, 0, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update(){
            //move enemy
            this.x -= this.speed;
            //if enemy goes off screen, delete
            if(this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove item robot
    function handleItemRobots(deltaTime){
        if(robotTimer > randomRobotInterval) {
            if(bottomWall.length === 0 && topWall.length === 0) {
                enemies.push(new ItemRobot(canvas.width, GAME_HEIGHT));
            } else if(bottomWall.length > 0 && topWall.length > 0) {
                enemies.push(new ItemRobot(canvas.width, GAME_HEIGHT-(bottomWall[0].height*2)));
            } else {
                enemies.push(new ItemRobot(canvas.width, GAME_HEIGHT-64));
            }
            robotTimer = 0;
            randomRobotInterval = Math.random() * 30000;
        } else {
            robotTimer += deltaTime;
        }
    }

    //generate shield items
    class ShieldItem {
        constructor(gameWidth, gameHeight, x, y) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
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
            this.speed = 2;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + 12, this.y + this.height/2, 12, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.frameArray[this.frameX], 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime) {
            //movement
            this.x -= this.speed;

            //handle sprite
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            // if player collides with shield item, remove it and add equipped shield object
            if(this.x < player.x + player.width &&
                this.x + this.width > player.x &&
                this.y < player.y + player.height &&
                this.y + this.height > player.y){
                    this.markedForDeletion = true;
                    if(equippedShields.length === 0) {
                        equippedShields.push(new ShieldEquipped(player.x, player.y, true));
                    } else if(equippedShields.length === 1) {
                        if(equippedShields[0].isTop){
                            equippedShields.push(new ShieldEquipped(player.x, player.y, false));
                        } else {
                            equippedShields.push(new ShieldEquipped(player.x, player.y, true));
                        }
                    }
                }

            //if shield goes off screen, delete
            if (this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove shield items
    function handleShieldItem(deltaTime) {
        shields.forEach(shield => {
            shield.draw(ctx);
            shield.update(deltaTime);
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
            this.frameY = 0;
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
            this.lifespan = 60000;
            this.damageTimer = 100;
            this.damageInterval = 100;
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + 12, this.y + this.height/2, 12, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.frameArray[this.frameX], this.height*this.frameY, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(x, y, deltaTime) {
            //handle location
            if(this.xQueue.length === 0) {
                this.x = x + 20;
                this.y = this.isTop ? y-50 : y+50;
            }
            this.xQueue.push(x);
            if(this.xQueue.length > 10) this.xQueue.shift();
            this.yQueue.push(y);
            if(this.yQueue.length > 10) this.yQueue.shift();

            if(this.lagTimer > this.lagInterval) {
                this.x = this.xQueue.shift() + 20;
                this.y = this.isTop ? this.yQueue.shift()-50 : this.yQueue.shift()+50;
                this.lagTimer = 0;
            } else {
                this.lagTimer += deltaTime;
            }

            //handle lifespan
            if(this.lifespan <= 0) this.markedForDeletion = true;
            else this.lifespan -= deltaTime;

            //handle sprite
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                //blink if force is about to expire
                if(this.lifespan < 5000){
                    this.frameY = this.frameY === 1 ? 0 : 1;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            //detect enemy collision
            if(this.damageTimer > this.damageInterval){
                enemies.forEach(enemy => {
                    if (collisionDetection(this.x + this.width/2,
                                        this.y + this.height/2,
                                        this.width/2,
                                        this.height/2,
                                        enemy.x + enemy.width/2,
                                        enemy.y + enemy.height/2,
                                        enemy.width/2,
                                        enemy.hitboxHeight[enemy.frameX]/2,
                                        true,
                                        false)) {
                        if(enemy.shield <= 0){
                            enemy.markedForDeletion = true;
                            explosions.push(new Explosion(enemy.x, enemy.y));
                        } else {
                            enemy.shield--;
                            enemy.frameY = 1;
                            this.damageTimer = 0;
                        }
                        score += 10;
                        // handle item drop if shield hits item robot
                        if(enemy.name === "itemRobot"){
                            if(equippedForce.length === 0){
                                force.push(new ForceItem(canvas.width, GAME_HEIGHT));
                            } else {
                                shields.push(new ShieldItem(canvas.width, GAME_HEIGHT, enemy.x, enemy.y));
                            }
                        }
                    }
                });
            } else {
                this.damageTimer += deltaTime;
            }

            //detect enemy fire collision
            enemyFires.forEach(fire => {
                if (collisionDetection(this.x + this.width/2,
                                       this.y + this.height/2,
                                       this.width/2,
                                       this.height/2,
                                       fire.x + fire.width/2,
                                       fire.y + fire.height/2,
                                       fire.width/2,
                                       fire.height/2,
                                       true,
                                       true)) {
                    fire.markedForDeletion = true;
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
            this.y = player.y;
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
            this.frameY = 0;
            this.frameArray = [0, 68, 136, 196, 258, 324];
            this.maxFrame = 5;
            this.frameTimer = 0;
            this.frameInterval = 1000/18;
            this.x = x+33;
            this.y = y;
            this.lifespan = 60000;
            this.damageTimer = 100;
            this.damageInterval = 100;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + 36/2, this.y + this.height/2, 36/2, 0, Math.PI*2);
            context.stroke();
            context.drawImage(this.image, this.frameArray[this.frameX], this.frameY*this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(x, y, deltaTime) {
            this.x = x+65;
            this.y = y;

            //handle lifespan
            if(this.lifespan <= 0) this.markedForDeletion = true;
            else this.lifespan -= deltaTime;

            //handle sprite
            if(this.frameTimer > this.frameInterval) {
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX ++;
                //blink if force is about to expire
                if(this.lifespan < 5000){
                    this.frameY = this.frameY === 1 ? 0 : 1;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            //detect enemy collision
            if(this.damageTimer > this.damageInterval) {
                enemies.forEach(enemy => {
                    if (collisionDetection(this.x + this.width / 2,
                                        this.y + this.height / 2,
                                        this.width / 2,
                                        this.height / 2,
                                        enemy.x + enemy.width / 2,
                                        enemy.y + enemy.height / 2,
                                        enemy.width / 2,
                                        enemy.hitboxHeight[enemy.frameX] / 2,
                                        true,
                                        false)) {
                        if(enemy.shield <= 0) {
                            enemy.markedForDeletion = true;
                            explosions.push(new Explosion(enemy.x, enemy.y));
                        } else {
                            enemy.shield--;
                            enemy.frameY = 1;
                            this.damageTimer = 0;
                        }
                        score += 10;
                        // handle item drop if player shoots item robot
                        if(enemy.name === "itemRobot"){
                            shields.push(new ShieldItem(canvas.width, GAME_HEIGHT, enemy.x, enemy.y));
                        }
                    }
                });
            } else {
                this.damageTimer += deltaTime;
            }

            //detect enemy fire collision
            enemyFires.forEach(fire => {
                if (collisionDetection(this.x + this.width/2,
                                       this.y + this.height/2,
                                       this.width/2,
                                       this.height/2,
                                       fire.x + fire.width/2,
                                       fire.y + fire.height/2,
                                       fire.width/2,
                                       fire.height/2,
                                       true,
                                       true)) {
                    fire.markedForDeletion = true;
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
    class BottomWall {
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
            //if wall goes off screen, delete
            if(this.x < 0 - this.widthTotal) this.markedForDeletion = true;
        }
    }

    //add, animate, and remove bottom wall
    function handleBottomWall(deltaTime){
        if(wallTimer > wallInterval) {
            //get size of wall
            const count = (Math.random()*20)+10;
            bottomWall.push(new BottomWall(canvas.width, GAME_HEIGHT, count));
            wallTimer = 0;
            wallInterval = Math.random()*100000;
        } else {
            if(bottomWall.length === 0) wallTimer += deltaTime;
        }
        bottomWall.forEach(w => {
            w.draw(ctx);
            w.update();
        });
        //remove gone wall from array
        bottomWall = bottomWall.filter(w => !w.markedForDeletion);
    }

    //generate wall that moves across the top of screen
    class TopWall extends BottomWall {
        constructor(gameWidth, gameHeight, count){
            super(gameWidth, gameHeight, count);
            this.imageStart = document.getElementById("topWallStart");
            this.imageMiddle = document.getElementById("topWallMiddle");
            this.imageEnd = document.getElementById("topWallEnd");
            this.y = 0;
            this.hitboxY = 0;
        }
    }

    //add, animate, and remove top wall
    function handleTopWall(deltaTime){
        if(topWallTimer > topWallInterval) {
            //get size of wall
            const count = (Math.random()*20)+10;
            topWall.push(new TopWall(canvas.width, GAME_HEIGHT, count));
            topWallTimer = 0;
            topWallInterval = Math.random()*100000;
        } else {
            if(topWall.length === 0) topWallTimer += deltaTime;
        }
        topWall.forEach(w => {
            w.draw(ctx);
            w.update();
        });
        //remove gone wall from array
        topWall = topWall.filter(w => !w.markedForDeletion);
    }

    //display score and game over message
    function displayStatusText(context){
        //give info bar distinguished color
        context.fillStyle = 'rgb(40, 40, 43)';
        context.fillRect(0, GAME_HEIGHT, GAME_WIDTH, INFO_HEIGHT);
        displayBeamStatus(context);
        context.fillStyle = 'white';
        context.font = '20px Orbitron';
        context.fillText('Beam ', 200, GAME_HEIGHT+20);
        context.fillText('Score: ' + score, 20, GAME_HEIGHT+30);
        context.fillText('Hi: ' + localStorage.getItem('hiScore'), 500, GAME_HEIGHT+30);
        if(gameOver){
            context.fillStyle = 'white';
            context.font = '20px Orbitron';
            context.textAlign = 'center';
            context.fillText('GAME OVER', canvas.width/2, GAME_HEIGHT/2);
            context.fillText('Press SPACE to play again', canvas.width/2, GAME_HEIGHT/2+100);
        }
    }

    //beam icon
    function displayBeamStatus(context){
        context.fillStyle = "blue";
        context.fillRect(300, GAME_HEIGHT+5, 10*beamPower, 15);
        context.strokeStyle = "white";
        context.strokeRect(300, GAME_HEIGHT+5, 100, 15);
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
    const player = new Player(canvas.width, GAME_HEIGHT);
    //add stars for the game start
    for(let i = 0; i < 100; i++) stars.push(new Star(canvas.width, GAME_HEIGHT, Math.random() * canvas.width));
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
    //helper for generating wall
    let wallTimer = 0;
    let topWallTimer = 0;
    let wallInterval = 10000;
    let topWallInterval = 10000;
    // helper for large enemy
    let largeEnemyTimer = 0;
    let largeEnemyInterval = Math.random()*12000;
    // helper for item robot
    let robotTimer = 0;
    let randomRobotInterval = Math.random()*30000;

    //main animation loop running at 60fps
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0,0,canvas.width, canvas.height);
        background();
        player.draw(ctx);
        player.update(input);
        handlePlayerBeam(input, player.x+player.width-10, player.y+player.height/2, deltaTime);
        handleSparks(player.x+player.width-10, player.y-player.height/2, deltaTime);
        handleExplosions(deltaTime);
        handleEnemies(deltaTime);
        handleLargeEnemies(deltaTime);
        handleEnemyFire(deltaTime);
        handleItemRobots(deltaTime);
        handleShieldItem(deltaTime);
        handleShieldEquipped(player.x, player.y, deltaTime);
        handleForceItem(deltaTime);
        handleForceEquipped(player.x, player.y, deltaTime);
        handleBottomWall(deltaTime);
        handleTopWall(deltaTime);
        updateScore(deltaTime);
        displayStatusText(ctx);
        if(!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});