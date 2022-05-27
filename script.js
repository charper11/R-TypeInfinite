window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    // ctx = instance of built-in canvas 2D api that holds all drawing methods/properties
    const ctx = canvas.getContext('2d');
    canvas.width = 900;
    canvas.height = 550;
    let enemies = [];
    let score = 0;
    let gameOver = false;

    //apply event listeners to keyboard events and hold array of all currently active keys
    class InputHandler {
        constructor(){
            this.keys = [];
            //add key to keys array on keydown
            window.addEventListener('keydown', e => {
                if ((   e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp' ||
                        e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight')
                        && this.keys.indexOf(e.key) === -1){
                    this.keys.push(e.key);
                }
            });
            //remove key from key array on keyup
            window.addEventListener('keyup', e => {
                if (    e.key === 'ArrowDown'  ||
                        e.key === 'ArrowUp' ||
                        e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight'){
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
        }
    }

    //endlessly scrolling background
    class Background {

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

    //display score and game over message
    function displayStatusText(context){
        context.fillStyle = 'white';
        //context.font = 'Orbitron';
        context.fillText('Score: ' + score, 20, 50);
        if(gameOver){
            context.textAlign = 'center';
            context.fillStyle = 'white';
            context.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        }
    }

    function updateScore(deltaTime){
        if(scoreTime > 1000) {
            score++;
            scoreTime = 0;
        } else {
            scoreTime += deltaTime;
        }
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

    //main animation loop running at 60fps
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0,0,canvas.width, canvas.height);
        player.draw(ctx);
        player.update(input);
        handleEnemies(deltaTime);
        updateScore(deltaTime);
        displayStatusText(ctx);
        if(!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});