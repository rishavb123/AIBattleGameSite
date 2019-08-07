const c = document.getElementById("application");
const ctx = c.getContext('2d');

let regex = /[?&]([^=#]+)=([^&#]*)/g,
    url = window.location.href,
    params = {},
    match;
while(match = regex.exec(url)) {
    params[match[1]] = match[2];
}

if(window.innerWidth > window.innerHeight) {
    c.width = window.innerHeight;
    c.height = window.innerHeight;
} else {
    c.width = window.innerWidth;
    c.height = window.innerWidth;
}

window.addEventListener("resize", () => {
    if(window.innerWidth > window.innerHeight) {
        c.width = window.innerHeight;
        c.height = window.innerHeight;
    } else {
        c.width = window.innerWidth;
        c.height = window.innerWidth;
    }
});

class GameObject {

    collide() {}

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }

    outOfBounds() {
        return this.x > 100 || this.y > 100 || this.x + this.w < 0 || this.y + this.h < 0;
    }

    draw(draw=true) {
        if(draw) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x / 100 * c.width, this.y / 100 * c.height , this.w / 100 * c.width, this.h / 100 * c.height);
        }
    }

    remove() {
        remove(this);
    }

}

class Player extends GameObject {
    constructor(x, y, w, h, color) {
        super();
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dx = 0;
        this.dy = 0;
        this.bullets = [];
        this.action = -1;
        this.health = 100;
        this.rgb_color = color;
        this.color = `rgba(${color.red}, ${color.blue}, ${color.green}, 1)`
        this.alpha = 1;
    }

    collide(obj) {
        if (obj instanceof Bullet && obj.sender !== this) {
            obj.remove();
            this.health -= 10;
        }
        if (obj instanceof Enemy) {
            hitFeatures.unshift(obj.get_features());
            if(hitFeatures.length > 7)
                hitFeatures.pop();
            obj.remove();
            this.health -= 25;
        }
    }

    update(draw=true) {
        this.color = `rgba(${this.rgb_color.red}, ${this.rgb_color.green}, ${this.rgb_color.blue}, ${this.health / 100})`
        super.update(draw);
        if(this.outOfBounds())
            this.health--;
    }

    shoot() {
        if(this.bullets.length < 5) {
            let bullet = new Bullet(this.x + this.w / 4, this.y + this.h / 4, this.w / 2, this.h / 2, (this.dx == 0 && this.dy == 0) ? 3 : 3 * this.dx, 3 * this.dy, this);
            this.bullets.push(bullet);
            add(bullet);
        }
    }

    getBullet(i) {
        return this.bullets[i] || Bullet.defaultBullet;
    }

    set_action(action) {
        this.action = action;
        switch (action) {
            case LEFT:
                this.dx = -1;
                this.dy = 0;
                break;
            case UP:
                this.dy = -1;
                this.dx = 0;
                break;
            case RIGHT:
                this.dx = 1;
                this.dy = 0;
                break;
            case DOWN:
                this.dy = 1;
                this.dx = 0;
                break;
        }
    }

}

class Bullet extends GameObject {
    constructor(x, y, w, h, dx, dy, sender) {
        super();
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.w = w;
        this.h = h;
        this.sender = sender;
        this.color = 'white';
    }

    update(draw=true) {
        super.update(draw);
        if (this.outOfBounds()) {
            this.remove();
        }
    }

    remove() {
        this.sender.bullets.splice(this.sender.bullets.indexOf(this), 1);
        remove(this);
    }

}

class Enemy extends GameObject{
    constructor(x, y, w, h, maxDx, maxDy, alpha) {
        super();       

        if(Math.random() > 0.9)
            w += 10*randGauss();
        if(Math.random() > 0.9)
            h += 10*randGauss();
        if(Math.random() > 0.9)
            maxDx += 0.5 * randGauss();
        if(Math.random() > 0.9)
            maxDy += 0.5 * randGauss();
        if(Math.random() > 0.9)
            alpha += 0.5 * randGauss();

        if(w > Enemy.maxWidth)
            w = Enemy.maxWidth;
        if(w < Enemy.minWidth)
            w = Enemy.minWidth;
        if(h > Enemy.maxHeight)
            h = Enemy.maxHeight;
        if(h < Enemy.minHeight)
            h = Enemy.minHeight;
        if(maxDx > Enemy.maxSpeed)
            maxDx = Enemy.maxSpeed;
        if(maxDx < Enemy.minSpeed)
            maxDx = Enemy.minSpeed;
        if(maxDy > Enemy.maxSpeed)
            maxDy = Enemy.maxSpeed;
        if(maxDy < Enemy.minSpeed)
            maxDy = Enemy.minSpeed;
        if(alpha > Enemy.maxAlpha)
            alpha = Enemy.maxAlpha;
        if(alpha < Enemy.minAlpha)
            alpha = Enemy.minAlpha;        

        this.x = x;
        this.y = y;
        this.maxDx = maxDx;
        this.maxDy = maxDy;
        this.dx = 0;
        this.dy = 0;
        this.w = w;
        this.h = h;
        this.health = 100;
        this.alpha = alpha;
        this.color = `rgba(255,${255 * alpha},255,${alpha})`;
        this.side = this.x == 0? -1 : 1;
    }

    update(draw=true) {
        if(this.x < player.x)
            this.dx = this.maxDx;
        else 
            this.dx = -this.maxDx;
        if(this.y < player.y)
            this.dy = this.maxDy;
        else 
            this.dy = -this.maxDy;
        super.update(draw);
        this.health -= 0.8;
        if (this.outOfBounds() || this.health <= 0) {
            this.remove();
        }
    }

    get_features() {
        return [this.w, this.h, this.maxDx, this.maxDy, this.alpha, this.side];
    }

    get_normalized_features() {
        return [this.w / 100, this.h / 100, this.maxDx / 100, this.maxDy / 100];
    }

    collide(obj) {
        if (obj instanceof Bullet) {
            obj.sender.health += obj.sender.health < 90? 10 : 0;
            obj.remove();
            this.health -= 100;
        }
    }

    remove() {
        enemies.splice(enemies.indexOf(this), 1);
        remove(this);
    }

}

Enemy.minSpeed = 0.1;
Enemy.maxSpeed = 2;

Enemy.minAlpha = 0.2;
Enemy.maxAlpha = 1;

Enemy.minWidth = 3;
Enemy.maxWidth = 25;

Enemy.minHeight = 4;
Enemy.maxHeight = 25;

class HealthBar extends GameObject {
    constructor(x, y, w, h, player) {
        super();
        this.x = x;
        this.y = y;
        this.total_w = w;
        this.w = w;
        this.h = h;
        this.player = player;
        this.dx = 0;
        this.dy = 0;
    }

    update() {
        this.w = this.total_w * this.player.health / 100;
        ctx.fillStyle = `rgb(${255 - 2.55 * this.player.health}, ${2.55 * this.player.health}, 0)`;
        super.update();
    }
}

window.addEventListener("keydown", (e) => {
    switch (e.keyCode) {
        case 37:
            player.set_action(LEFT);
            break;
        case 38:
            player.set_action(UP);
            break;
        case 39:
            player.set_action(RIGHT);
            break;
        case 40:
            player.set_action(DOWN);
            break;
        case 32:
            if(!shooting) {
                player.shoot();
                shooting = true;
            }
            break;
    }
});

window.addEventListener("keyup", async (e) => {
    if(binding) {
        bind(e.keyCode, prompt("Name of Model: "));
    }
    else if(e.keyCode in keyBindings) {
        if(curAgent == keyBindings[e.keyCode])
            agentPlaying = false;
        else {
            await loadModel(keyBindings[e.keyCode]);
            agentPlaying = true;
        }
    }
    switch(e.keyCode) {
        case 32:
            shooting = false;
            break;
        case 80:
            agentPlaying = !agentPlaying;
            break;
        case 88:
            running = !running;
            if(running) animate();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
            break;
        case 82:
            reset(false);
            break;
        case 83:
            await saveModel(prompt("Name of Model: "));
            break;
        case 76:
            await loadModel(prompt("Name of Model: "));
            break;
        case 84:
            await train();
            break;
        case 67:
            clearStorage();
            break;
        case 66:
            binding = true;
            break;
        case 27:
            clearBindings();
            break;
    }
});

const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

const INPUT_NODES = 50;
const HIDDEN_LAYERS = [40, 30, 20];
const NUM_OUTPUT_CLASSES = 4;

let running = true;
let agentPlaying = false;
let binding = false;
let curAgent = "default";

let shooting = false;
let player = new Player(Math.random() * 95, Math.random() * 95, 5, 5, {
    red: '0',
    green: '255',
    blue: '255'
});

let keyBindings = localStorage.keyBindings? JSON.parse(localStorage.keyBindings) : {};

let score = parseFloat(localStorage.score) || 0;
let numGames = parseInt(localStorage.numGames) || 0;

let enemySpawn = params.enemies !== 'false';
let counts = params.training? (params.training !== 'true') : (params.counts !== 'false');
let aiControl = parseFloat(params.control) || 0.9 ;
if(params.control === '0')
    aiControl = 0;
let controlPeriod = Math.round((1 - aiControl) * 100 + 1);
if(params.model_name)
    loadModel(params.model_name);

let t = 0;

const maxEnemies = 5;

Bullet.defaultBullet = new Bullet(-1, -1, 0, 0, 0, 0);
Enemy.defaultEnemy = new Enemy(-1, -1, 0, 0, 0, 0, 0);
Enemy.add = (enemy) => {
    if(enemies.length < maxEnemies) {
        enemies.push(enemy)
        add(enemy)
    }
    else
        delete enemy;
}
Enemy.get = (index) => {
    return enemies[index] || Enemy.defaultEnemy;
}

let pHealthBar = new HealthBar(2, 2, 30, 5, player);
let gameObjects = [player, pHealthBar];
let enemies = [];
let hitFeatures = localStorage.hitFeatures? JSON.parse(localStorage.hitFeatures): [[5, 5, 0.8, 0.8, 0.8, 0]];
let i = 0;
let numGenerating = 0;

let model = create_model();
let shootingModel = create_shooting_model();

let xs = [];
let ys = [];
let shootingYs = [];

function remove(obj) {
    gameObjects.splice(gameObjects.indexOf(obj), 1);
    if (gameObjects.indexOf(obj) < i)
        i--;
    delete obj;
}

function add(obj) {
    gameObjects.push(obj);
}

function get_state() {
    let state = [player.x / 100, player.y / 100, player.dx / 100, player.dy / 100, player.health / 100];
    for(let i = 0; i < maxEnemies; i++)
    {
        let enemy = Enemy.get(i);
        state.push(enemy.x / 100, enemy.y / 100, enemy.dx / 100, enemy.dy / 100, enemy.health / 100);
        let arr = enemy.get_normalized_features();
        state = state.concat(arr);
    }
    return state;
}

function create_model() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
        inputDim: INPUT_NODES,
        units: INPUT_NODES,
        kernelInitializer: 'varianceScaling',
        activation: 'tanh'
    }));

    for(let NUM_OF_HIDDEN_NODES of HIDDEN_LAYERS)
        model.add(tf.layers.dense({
            units: NUM_OF_HIDDEN_NODES,
            kernelInitializer: 'varianceScaling',
            activation: 'relu'
        }));

    model.add(tf.layers.dense({
        units: NUM_OUTPUT_CLASSES,
        kernelInitializer: 'varianceScaling',
        activation: 'softmax'
    }));

    const optimizer = tf.train.adam();
    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    return model;
}

function create_shooting_model() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
        inputDim: INPUT_NODES,
        units: INPUT_NODES,
        kernelInitializer: 'varianceScaling',
        activation: 'tanh'
    }));

    for(let NUM_OF_HIDDEN_NODES of HIDDEN_LAYERS)
        model.add(tf.layers.dense({
            units: NUM_OF_HIDDEN_NODES,
            kernelInitializer: 'varianceScaling',
            activation: 'tanh'
        }));

    model.add(tf.layers.dense({
        units: 1,
        kernelInitializer: 'varianceScaling',
        activation: 'sigmoid'
    }));

    const optimizer = tf.train.adam();
    model.compile({
        optimizer: optimizer,
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });
    return model;
}

function create_multiplier() {
    let num = hitFeatures.length;
    let temp = [];
    let multiplierArr = [];
    let sum = 0;
    for(let i = 0; i < num; i++) {
        let multiple = Math.pow(0.8, i);
        temp.push(multiple);
        sum += multiple;
    }
    for(let i = 0; i < num; i++) 
        multiplierArr.push(temp[i] / sum);

    return tf.tensor([multiplierArr]);
}

function clearStorage() {
    reset();
    score = 0;
    numGames = 0;
    hitFeatures = [[5, 5, 0.8, 0.8, 0.8, 0]];
    localStorage.score = 0;
    localStorage.numGames = 0;
    localStorage.hitFeatures = JSON.stringify(hitFeatures);
}

function bind(key, networkName) {
    keyBindings[key] = networkName;
    localStorage.keyBindings = JSON.stringify(keyBindings);
    binding = false;
}

function clearBindings() {
    keyBindings = {};
    localStorage.keyBindings = "";
}

function randGauss() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

async function train(EPOCH = 8) {

    console.log("");    
    console.log("Training . . .");
    console.log("");
    console.log("Preparing Data . . .");
    const xDataset = tf.data.array(xs);
    const yDataset = tf.data.array(ys);
    const shootingDataset = tf.data.array(shootingYs);

    const xyDataset = tf.data.zip({ xs: xDataset, ys: yDataset }).batch(4).shuffle(4);
    const xshootingDataset = tf.data.zip({ xs: xDataset, ys: shootingDataset }).batch(4).shuffle(4);

    console.log("Done Preparing Data");
    console.log("");

    console.log("Training Main Model . . .");
    const history = await model.fitDataset(xyDataset, {
        epochs: EPOCH,
        callbacks: {
            onEpochEnd: (epoch, logs) => console.log("Epoch:", epoch, "\n\tloss:", logs.loss, "\n\taccuracy:", logs.acc)
        }
    });
    console.log("history: ", history);
    console.log("Done Training Main Model");
    console.log("");

    console.log("Training Shooting Model . . .");
    const shootingHistory = await shootingModel.fitDataset(xshootingDataset, {
        epochs: EPOCH,
        callbacks: {
            onEpochEnd: (epoch, logs) => console.log("Epoch:", epoch, "\n\tloss:", logs.loss, "\n\taccuracy:", logs.acc)
        }
    });
    console.log("history: ", shootingHistory);
    console.log("Done Training Main Model");
    console.log("");

    console.log("Removing Old Data . . .");
    xs = [];
    ys = [];
    shootingYs = [];
    console.log("Done Removing Old Data");
    console.log("");

    console.log("Done Training");
    console.log("");

    alert("Done Training!");
}

async function saveModel(name) {
    console.log("Saving Model . . .");
    curAgent = name;
    await model.save(`localstorage://${name}`);
    await shootingModel.save(`localstorage://${name}-shooting`);
    console.log("Done Saving Model");
    console.log("");
}

async function loadModel(name) {
    console.log("Loading Model . . .");
    curAgent = name;
    model = await tf.loadLayersModel(`localstorage://${name}`);
    shootingModel = await tf.loadLayersModel(`localstorage://${name}-shooting`);
    const optimizer = tf.train.adam();
    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    const shootingOptimizer = tf.train.adam();
    shootingModel.compile({
        optimizer: shootingOptimizer,
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });
    console.log("Done Loading Model");
    console.log("");
}

function reset(updateScore = true) {
    if(enemySpawn && updateScore)
        score = (score * numGames + t) / (++numGames);
    localStorage.score = score;
    localStorage.numGames = numGames;
    t = 0;
    for(let obj of gameObjects)
        obj.remove();
    player = new Player(Math.random() * 95, Math.random() * 95, 5, 5, {
        red: '0',
        green: '255',
        blue: '255'
    });
    numGenerating = 0;
    pHealthBar = new HealthBar(2, 2, 30, 5, player);
    gameObjects = [player, pHealthBar];
}

function animate() {
    if(running)
        requestAnimationFrame(animate);
    ctx.clearRect(0, 0, c.width, c.height);
    
    if(player.action != -1) {
        t++;
        xs.push(get_state());
        ys.push(Array.from(tf.oneHot(player.action, NUM_OUTPUT_CLASSES).dataSync()));
        shootingYs.push(shooting? [1]: [0]);

        if(t%150 == 0 && enemySpawn) {
            numGenerating += 0.2;
            let [w, h, dx, dy, alpha] = tf.matMul(create_multiplier(), tf.tensor(hitFeatures)).dataSync();
            for(let j = 0; j < numGenerating; j++) {
                const enemy = new Enemy(Math.random() > 0.5? 0 : 100 - w, Math.random() * 100, w, h, dx, dy, alpha);
                Enemy.add(enemy);
            }
        }
    }

    if(agentPlaying && t%controlPeriod == 0) {
        let x = get_state();
        let stateTensor = tf.tensor([x]);
        if(x[0] < 0)
            player.set_action(RIGHT);
        else if(x[0] > 0.95)
            player.set_action(LEFT);
        else if(x[1] < 0)
            player.set_action(DOWN);
        else if(x[1] > 0.95)
            player.set_action(UP);
        else {
            player.set_action(tf.argMax(model.predict(stateTensor), 1).dataSync()[0]);
        }
        if(shootingModel.predict(stateTensor).dataSync()[0] > 0.6) {
            player.shoot();
        }
        if(enemySpawn && counts) {
            score += 0.01;
            localStorage.score = score;
        }
    }
    for (i = 0; i < gameObjects.length; i++) {
        const obj = gameObjects[i];
        obj.update();
        for (let j = i + 1; j < gameObjects.length; j++) {
            const obj2 = gameObjects[j];
            if (obj.x + obj.w >= obj2.x && obj.x <= obj2.x + obj2.w && obj.y + obj.h >= obj2.y && obj.y <= obj2.y + obj2.h) {
                obj.collide(obj2);
                obj2.collide(obj);
            }
        }
    }
    localStorage.hitFeatures = JSON.stringify(hitFeatures);
    ctx.fillStyle = 'white';
    ctx.font = "20px Courier New";
    let s = "Score: " + Math.round(score * 1000) / 1000;
    ctx.fillText(s, c.width - s.length * 14, 30);
    if(player.health <= 0) {
        reset(counts);
    }

}

animate();