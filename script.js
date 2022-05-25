window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    // ctx = instance of built-in canvas 2D api that holds all drawing methods/properties
    const ctx = canvas.getContext('2d');
    canvas.width = 900;
    canvas.height = 550;

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

    }

    //endlessly scrolling background
    class Background {

    }

    //generate enemies
    class Enemy {

    }

    //add, animate, and remove enemies
    function handleEnemies(){

    }

    //display score and game over message
    function displayStatusText(){

    }

    const input = new InputHandler();

    //main animation loop running at 60fps
    function animate(){

    }
});