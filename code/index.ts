import { clearAllKeys, upKey, leftKey, rightKey, downKey, mouse, Key, mouseX } from "./controls";
import {
    ctx, canvas, imgPlayer, imgNone, imgWheel1, imgWheel2, imgWheel3, imgWheel4, imgWheel5, imgWheel6, imgCamera,
    imgEarth1, imgEarth2, imgEarth3, imgEarth4, imgEarth5, imgGeyser, imgMountain, imgIron1, imgIron2, imgIron3, imgIron4,
    imgIron5, Layer, DrawQueueItem, DrawQueueType, renderItem, imgItems, imgIronItem, imgAbyss, imgArrow, imgCrafts, imgArrow1,
    imgMelter, imgMainSlot, imgIronIngot
} from "./drawing";

enum GameObjectType {
    NONE,
    PLAYER,
}

enum TileType {
    NONE,
    EARTH_1,
    EARTH_2,
    EARTH_3,
    EARTH_4,
    EARTH_5,
    MOUNTAIN,
    GEYSER,
    VOLCANO,
    LAVA,
    IRON,
    MELTER,
}

let TILE = {
    width: 200,
    height: 200,
    firstX: 0,
    firstY: 0,
    chunkSizeX: 8,
    chunkSizeY: 8,
    chunkCountX: 10,
    chunkCountY: 10,
}

class Tile {
    baseLayer: TileType;
    upperLayer: TileType;
    x: number;
    y: number;
    specialTimer: number;
    toughness: number;
    firstToughness: number;
    item: Item;
    count: number;
}

const map: Tile[] = [];

function getIndexFromCoords(x: number, y: number) {
    let result = y * TILE.chunkSizeX * TILE.chunkCountX + x;
    return (result);
}

function getTileUnderMouse() {
    let [x, y] = pixelsToTiles(mouse.worldX, mouse.worldY);
    let tile = map[getIndexFromCoords(x, y)];
    return (tile);
}

function tilesToPixels(x: number, y: number) {
    let result = [x * TILE.width, y * TILE.height];
    return result;
}

function pixelsToTiles(x: number, y: number) {
    let result = [Math.round(x / TILE.width), Math.round(y / TILE.height)];
    return result;
}

let chunkPrototypes = [
    [
        '  @!  ##',
        ' @!@   #',
        '@!@!   #',
        '@!!@   #',
        '!@!   # ',
        '@!@  #  ',
        '!@! #   ',
        '@!@ #   ',
    ],
    [
        'F! @  ##',
        '       #',
        '   #   #',
        '        ',
        ' @     #',
        '   #    ',
        '       #',
        ' #    ##',
    ],
    [
        '    ####',
        '   #   #',
        '        ',
        '        ',
        '        ',
        '       #',
        '   ##   ',
        ' #######',
    ],
    [
        '    @   ',
        '@    #  ',
        '        ',
        '    #   ',
        '@     # ',
        '     000',
        ' #   0*0',
        '@    000',
    ]
]

enum Item {
    IRON,
    MELTER,
    IRON_INGOT,
}

class RecipePart {
    item: Item;
    count: number;
    sprite: HTMLImageElement;
}

class Recipe {
    parts: RecipePart[];
    result: Item;
    sprite: HTMLImageElement;
    name: string;
    description1: string;
    description2: string;
    description3: string;
}

let recipes: Recipe[] = [
    {
        result: Item.MELTER,
        parts: [{ item: Item.IRON, count: 20, sprite: imgIronItem },],
        sprite: imgMelter,
        name: 'Плавильня',
        description1: 'Бегать с железом - это одно,',
        description2: 'а с железными слитками - другое.',
        description3: 'Можно поставить только на лаву',
    },
    {
        result: Item.MELTER,
        parts: [{ item: Item.IRON, count: 20, sprite: imgIronItem }],
        sprite: imgMelter,
        name: 'Плавильня',
        description1: 'Бегать с железом - это одно,',
        description2: 'а с железными слитками - другое.',
        description3: 'Можно поставить только на лаву',
    },
    {
        result: Item.MELTER,
        parts: [{ item: Item.IRON, count: 20, sprite: imgIronItem }],
        sprite: imgMelter,
        name: 'Плавильня',
        description1: 'Бегать с железом - это одно,',
        description2: 'а с железными слитками - другое.',
        description3: 'Можно поставить только на лаву',
    },
];

class InventorySlot {
    item: Item;
    count: number = 0;
}

let inventory: InventorySlot[] = [];

function addItem(item: Item, count: number) {
    for (let itemIndex = 0; itemIndex <= 5; itemIndex++) {
        if (!inventory[itemIndex]) {
            let slot = {
                item,
                count,
            };
            inventory[itemIndex] = slot;
            break;
        } else if (inventory[itemIndex].item === item) {
            inventory[itemIndex].count += count;
            break;
        }
    }
}

function removeItem(item: Item, count: number) {
    let success = false;
    for (let itemIndex = 0; itemIndex <= 5; itemIndex++) {
        if (inventory[itemIndex]) {
            if (inventory[itemIndex].item === item && inventory[itemIndex].count >= count) {

                inventory[itemIndex].count -= count;
                if (inventory[itemIndex].count === 0) {
                    inventory[itemIndex] = null;
                }
                success = true;
                return (success);
                break;
            }
        }
    }
    return (success);
}

let drawQueue: DrawQueueItem[] = [];

export function drawSprite(x: number, y: number, sprite: any, angle: number, width: number = 0, height: number = 0, layer = Layer.TILE) {
    if (x > camera.x - camera.width * 0.5 - 450 &&
        x < camera.x + camera.width * 0.5 + 450 &&
        y > camera.y - camera.height * 0.5 - 450 &&
        y < camera.y + camera.height * 0.5 + 450) {
        drawQueue.push({ x, y, sprite, angle, width, height, layer, type: DrawQueueType.IMAGE });
    }
}

export function drawRect(x: number, y: number, width: number, height: number, angle: number, color: string, layer = Layer.TILE) {
    if (x > camera.x - camera.width * 0.5 - 450 &&
        x < camera.x + camera.width * 0.5 + 450 &&
        y > camera.y - camera.height * 0.5 - 450 &&
        y < camera.y + camera.height * 0.5 + 450) {
        drawQueue.push({ x, y, width, height, color, angle, layer, type: DrawQueueType.RECT });
    }
}

export function drawCircle(x: number, y: number, radius: number, color: string, layer = Layer.TILE) {
    if (x > camera.x - camera.width * 0.5 - 20 &&
        x < camera.x + camera.width * 0.5 + 20 &&
        y > camera.y - camera.height * 0.5 - 20 &&
        y < camera.y + camera.height * 0.5 + 20) {
        drawQueue.push({ x, y, radius, color, layer, type: DrawQueueType.CIRCLE });
    }
}

export function drawText(x: number, y: number, color: string, text: string, textSize: number, layer = Layer.UI) {
    if (x > camera.x - camera.width * 0.5 - 20 &&
        x < camera.x + camera.width * 0.5 + 20 &&
        y > camera.y - camera.height * 0.5 - 20 &&
        y < camera.y + camera.height * 0.5 + 20) {
        drawQueue.push({ x, y, color, text, layer, type: DrawQueueType.TEXT, textSize });
    }
}

let camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    angle: 0,
}

let timers: number[] = [];

let gameObjects: GameObject[] = [];

class GameObject {
    type: GameObjectType = GameObjectType.NONE;
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    color: string;

    exists: Boolean;

    speed: number;
    speedX: number;
    speedY: number;
    speedLimit: number;
    speedBackReduction: number;

    friction: number;

    accel: number;
    accelConst: number;

    rotationSpeed: number;

    solid: boolean;

    goForward: boolean;
    goRight: boolean;
    goLeft: boolean;
    goBackward: boolean;

    sprite: HTMLImageElement;

    leftWeel: number;
    rightWeel: number;
}

function addGameObject(type: GameObjectType, x: number, y: number) {
    let gameObject: GameObject = {
        type: type,

        x: x,
        y: y,

        width: 100,
        height: 100,
        angle: 0,
        color: 'grey',

        exists: true,

        speed: 0,
        speedX: 0,
        speedY: 0,
        speedLimit: 3,
        speedBackReduction: 0.5,
        friction: 0.95,
        accel: 0,
        accelConst: 0.04,
        rotationSpeed: 0.08,

        solid: false,

        goForward: false,
        goBackward: false,
        goLeft: false,
        goRight: false,

        sprite: imgNone,

        leftWeel: 1,
        rightWeel: 1,
    }

    if (gameObject.type === GameObjectType.PLAYER) {
        gameObject.sprite = imgPlayer;
    }

    if (gameObject.type === GameObjectType.NONE) {
        gameObject.exists = false;
    }

    let freeIndex = gameObjects.length;
    for (let gameObjectIndex = 0; gameObjectIndex < gameObjects.length; gameObjectIndex++) {
        const gameObject = gameObjects[gameObjectIndex];

        if (!gameObject.exists) {
            freeIndex = gameObjectIndex;
            break;
        }
    }
    gameObjects[freeIndex] = gameObject;

    return gameObject;
}

function controlPlayer(gameObject: GameObject) {
    if (upKey.isDown) {
        gameObject.goForward = true;
    }

    if (downKey.isDown) {
        gameObject.goBackward = true;
    }

    if (rightKey.isDown) {
        gameObject.goRight = true;
    }

    if (leftKey.isDown) {
        gameObject.goLeft = true;
    }
}

function deleteControls() {
    globalPlayer.goForward = false;
    globalPlayer.goBackward = false;
    globalPlayer.goLeft = false;
    globalPlayer.goRight = false;
}

function moveGameObject(gameObject: GameObject) {
    gameObject.accel = 0;
    if (gameObject.goForward) {
        gameObject.accel = gameObject.accelConst;
    } else if (gameObject.goBackward) {
        gameObject.accel = -gameObject.accelConst;
    } else {
        gameObject.speed *= gameObject.friction;
    }

    if (gameObject.goLeft) {
        gameObject.angle -= gameObject.rotationSpeed;
    }
    if (gameObject.goRight) {
        gameObject.angle += gameObject.rotationSpeed;
    }
    gameObject.speed += gameObject.accel;
    if (gameObject.speed > gameObject.speedLimit) {
        gameObject.speed = gameObject.speedLimit;
    }
    if (gameObject.speed < -0.75 * gameObject.speedLimit) {
        gameObject.speed = -0.75 * gameObject.speedLimit;
    }
    gameObject.speedX = gameObject.speed * Math.cos(gameObject.angle);
    gameObject.speedY = gameObject.speed * Math.sin(gameObject.angle);

    for (let tileIndex = 0; tileIndex < map.length; tileIndex++) {
        const other = map[tileIndex];

        const wallLeft = other.x * TILE.width - TILE.width / 2;
        const wallRight = other.x * TILE.width + TILE.width / 2;
        const wallTop = other.y * TILE.height - TILE.height / 2;
        const wallBottom = other.y * TILE.height + TILE.height / 2;

        const playerLeft = gameObject.x - gameObject.width / 2;
        const playerRight = gameObject.x + gameObject.width / 2;
        const playerTop = gameObject.y - gameObject.height / 2;
        const playerBottom = gameObject.y + gameObject.height / 2;

        if (other.baseLayer === TileType.MOUNTAIN || other.upperLayer === TileType.MELTER) {

            if (gameObject.speedX !== 0) {
                let side: number;
                let wallSide: number;
                if (gameObject.speedX > 0) {
                    side = playerRight;
                    wallSide = wallLeft;
                } else {
                    side = playerLeft;
                    wallSide = wallRight;
                }

                if (
                    !(playerRight + gameObject.speedX <= wallLeft ||
                        playerLeft + gameObject.speedX >= wallRight ||
                        playerTop >= wallBottom ||
                        playerBottom <= wallTop)
                ) {
                    gameObject.speedX = 0;
                    gameObject.x -= side - wallSide;
                }
            }

            if (gameObject.speedY !== 0) {
                let side: number;
                let wallSide: number;
                if (gameObject.speedY > 0) {
                    side = playerBottom;
                    wallSide = wallTop;
                } else {
                    side = playerTop;
                    wallSide = wallBottom;
                }

                if (
                    !(playerRight <= wallLeft ||
                        playerLeft >= wallRight ||
                        playerTop + gameObject.speedY >= wallBottom ||
                        playerBottom + gameObject.speedY <= wallTop)
                ) {
                    gameObject.speedY = 0;
                    gameObject.y -= side - wallSide;
                }
            }
        }
    }


    gameObject.x += gameObject.speedX;
    gameObject.y += gameObject.speedY;
}

function randomFloat(firstNumber: number, lastNumber: number) {
    let randomFloat: number = firstNumber + (lastNumber - firstNumber) * Math.random();
    return (randomFloat)
}

function randomInt(firstNumber: number, lastNumber: number) {
    let randomInt = Math.round(randomFloat(firstNumber, lastNumber));
    return (randomInt);
}

function addTimer(timerLength: number) {
    let timerIndex = timers.length;
    timers.push(timerLength);
    return timerIndex;
}

function updateTimers() {
    for (let timerIndex = 0; timerIndex < timers.length; timerIndex++) {
        if (timers[timerIndex] > 0) {
            timers[timerIndex]--;
        }
    }
}

function rotateVector(x: number, y: number, angle: number) {
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    let resultX = x * cos - y * sin;
    let resultY = -y * cos - x * sin;
    return [
        resultX,
        resultY,
    ];
}

function angleBetweenPoints(x1: number, y1: number, x2: number, y2: number) {
    const result = Math.atan2(y2 - y1, x2 - x1) + Math.PI;
    return result;
}

let particles: particle[] = []

class particle {
    x: number;
    y: number;
    color: string;
    radius: number;
    speedX: number;
    speedY: number;
    accelX: number;
    accelY: number;
    sizeDecrease: number;
}

function addParticle(x: number, y: number, color: string, speed: number, size: number, decrease: number, accel: number) {
    let randomAngle = randomFloat(0, Math.PI * 2);
    let randomSpeed = randomFloat(Math.abs(speed - 0.5), speed + 0.5);
    let [speedX, speedY] = rotateVector(randomSpeed, 0, randomAngle);
    let randomRadius = randomInt(size - 3, size + 3);
    let [accelX, accelY] = rotateVector(accel, 0, randomAngle);
    let randomSizeDecrease = randomFloat(Math.abs(decrease - 0.15), decrease + 0.15);

    let particle = {
        x: x,
        y: y,
        color: color,
        radius: randomRadius,
        speedX,
        speedY,
        accelX,
        accelY,
        sizeDecrease: randomSizeDecrease,
    };

    particles.push(particle);
}

type ParticleParams = {
    x: number;
    y: number;
    color: string;
    speed: number;
    size: number;
    decrease: number;
    accel: number;
    count: number;
}

function burstParticles({ x, y, color, speed, size, count, decrease, accel }: ParticleParams) {
    for (let particleIndex = 0; particleIndex < count; particleIndex++) {
        addParticle(x, y, color, speed, size, decrease, accel);
    }
}

function drawParticles() {
    for (let particleIndex = 0; particleIndex < particles.length; particleIndex++) {
        let particle = particles[particleIndex];
        drawCircle(particle.x, particle.y, particle.radius, particle.color);
        particle.radius -= particle.sizeDecrease;
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        particle.speedX += particle.accelX;
        particle.speedY += particle.accelY;


        if (particle.radius <= 0) {
            removeParticle(particleIndex);
        }
    }
}

function removeParticle(particleIndex: number) {
    let lastParticle = particles[particles.length - 1];
    if (particles[particleIndex].color === 'grey') {
        addItem(Item.IRON, 1);
    }
    particles[particleIndex] = lastParticle;
    particles.pop();
}

for (let chunkY = 0; chunkY < TILE.chunkCountY; chunkY++) {
    for (let chunkX = 0; chunkX < TILE.chunkCountX; chunkX++) {
        let protoIndex = randomInt(0, chunkPrototypes.length - 1);
        let proto = chunkPrototypes[protoIndex];
        console.assert(TILE.chunkSizeY === proto.length);
        console.assert(TILE.chunkSizeX === proto[0].length);

        for (let tileY = 0; tileY < proto.length; tileY++) {
            let line = proto[tileY];
            for (let tileX = 0; tileX < line.length; tileX++) {
                let char = line[tileX];
                let downTileType = null;
                let upTileType = TileType.NONE;
                let x = (chunkX * TILE.chunkSizeX + tileX);
                let y = (chunkY * TILE.chunkSizeX + tileY);
                let index = getIndexFromCoords(x, y);
                map[index] = { baseLayer: downTileType, upperLayer: upTileType, x, y, specialTimer: null, toughness: null, firstToughness: null, item: null, count: null };
                if (char === '0') {
                    downTileType = TileType.NONE;
                } else if (char === ' ') {
                    let chance = randomInt(1, 10);
                    if (chance >= 1 && chance <= 6) {
                        downTileType = TileType.EARTH_1;
                    }
                    if (chance === 7) {
                        downTileType = TileType.EARTH_2;
                    }
                    if (chance === 8) {
                        downTileType = TileType.EARTH_3;
                    }
                    if (chance === 9) {
                        downTileType = TileType.EARTH_4;
                    }
                    if (chance === 10) {
                        downTileType = TileType.EARTH_5;
                    }
                } else if (char === '#') {
                    downTileType = TileType.MOUNTAIN;
                } else if (char === '@') {
                    downTileType = TileType.GEYSER;
                    map[index].specialTimer = addTimer(randomInt(500, 1400));
                } else if (char === '*') {
                    downTileType = TileType.VOLCANO;
                } else if (char === '!') {
                    downTileType = TileType.LAVA;
                } else if (char === 'F') {
                    downTileType = TileType.EARTH_1;
                    upTileType = TileType.IRON;
                    map[index].toughness = 1000;
                    map[index].firstToughness = 1000;
                }
                map[index].baseLayer = downTileType;
                map[index].upperLayer = upTileType;
            }
        }
    }
}

export function screenToWorld(x: number, y: number) {
    const result = [
        x + camera.x - camera.width * 0.5,
        y + camera.y - camera.height * 0.5,
    ];
    return result;
}

export function worldToScreen(x: number, y: number) {
    const result = [
        x - camera.x + camera.width * 0.5,
        y - camera.y + camera.height * 0.5,
    ];
    return result;
}

function distanceBetweenPoints(x1: number, y1: number, x2: number, y2: number) {
    let distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    return distance;
}

let globalPlayer = addGameObject(GameObjectType.PLAYER, 0, 0);

function moveToTile(mouseTile: Tile) {
    let [x, y] = tilesToPixels(mouseTile.x, mouseTile.y);
    let angle = angleBetweenPoints(x, y, globalPlayer.x, globalPlayer.y);
    if (globalPlayer.angle > angle) {
        while (globalPlayer.angle + Math.PI * 1 < angle || globalPlayer.angle - Math.PI * 1 >= angle) {
            angle += Math.PI * 2;
        }
    }
    if (globalPlayer.angle < angle) {
        while (globalPlayer.angle + Math.PI * 1 < angle || globalPlayer.angle - Math.PI * 1 >= angle) {
            angle -= Math.PI * 2;
        }
    }

    if (globalPlayer.angle + globalPlayer.rotationSpeed > angle && globalPlayer.angle < angle) {
        globalPlayer.angle = angle;
    } else if (globalPlayer.angle - globalPlayer.rotationSpeed < angle && globalPlayer.angle > angle) {
        globalPlayer.angle = angle;
    } else if (globalPlayer.angle > angle) {
        globalPlayer.leftWeel++;
        globalPlayer.goLeft = true;
    } else if (globalPlayer.angle < angle) {
        globalPlayer.rightWeel++;
        globalPlayer.goRight = true;
    }
    if (!(globalPlayer.x > x - (TILE.width / 2 + 51) &&
        globalPlayer.x < x + (TILE.width / 2 + 51) &&
        globalPlayer.y > y - (TILE.height / 2 + 51) &&
        globalPlayer.y < y + (TILE.height / 2 + 51))
    ) {
        globalPlayer.goForward = true;
        globalPlayer.leftWeel++;
        globalPlayer.rightWeel++;
    }
}

let craftMode = false;
let slot = 0;
let mainSlot = 0;

function updateTile(tileType: TileType, tile: Tile) {
    let sprite = imgNone;
    switch (tileType) {
        case TileType.GEYSER: {
            sprite = imgGeyser;
            if (
                tile.x * TILE.width > globalPlayer.x - camera.width / 2
                && tile.x * TILE.width < globalPlayer.x + camera.width / 2
                && tile.y * TILE.height > globalPlayer.y - camera.height / 2
                && tile.y * TILE.height < globalPlayer.y + camera.height / 2
            ) {
                if (timers[tile.specialTimer] <= 0) {
                    timers[tile.specialTimer] = randomInt(500, 2000);
                }
                if (timers[tile.specialTimer] <= 150) {
                    burstParticles({
                        x: tile.x * TILE.width,
                        y: tile.y * TILE.height,
                        color: 'red',
                        speed: 5,
                        size: 40,
                        decrease: 0.8,
                        accel: -0.05,
                        count: 1,
                    });
                }
            }
        } break;
        case TileType.EARTH_1: {
            sprite = imgEarth1
        } break;
        case TileType.EARTH_2: {
            sprite = imgEarth2
        } break;
        case TileType.EARTH_3: {
            sprite = imgEarth3
        } break;
        case TileType.EARTH_4: {
            sprite = imgEarth4
        } break;
        case TileType.EARTH_5: {
            sprite = imgEarth5
        } break;
        case TileType.LAVA: {
            sprite = imgAbyss;
            const wallLeft = tile.x * TILE.width - TILE.width / 2;
            const wallRight = tile.x * TILE.width + TILE.width / 2;
            const wallTop = tile.y * TILE.height - TILE.height / 2;
            const wallBottom = tile.y * TILE.height + TILE.height / 2;
            if (
                globalPlayer.x - globalPlayer.width / 4 < wallRight &&
                globalPlayer.x - globalPlayer.width / 4 > wallLeft &&
                globalPlayer.y - globalPlayer.height / 4 > wallTop &&
                globalPlayer.y - globalPlayer.height / 4 < wallBottom &&
                globalPlayer.x + globalPlayer.width / 4 < wallRight &&
                globalPlayer.x + globalPlayer.width / 4 > wallLeft &&
                globalPlayer.y - globalPlayer.height / 4 > wallTop &&
                globalPlayer.y - globalPlayer.height / 4 < wallBottom &&
                globalPlayer.x - globalPlayer.width / 4 < wallRight &&
                globalPlayer.x - globalPlayer.width / 4 > wallLeft &&
                globalPlayer.y + globalPlayer.height / 4 > wallTop &&
                globalPlayer.y + globalPlayer.height / 4 < wallBottom &&
                globalPlayer.x + globalPlayer.width / 4 < wallRight &&
                globalPlayer.x + globalPlayer.width / 4 > wallLeft &&
                globalPlayer.y + globalPlayer.height / 4 > wallTop &&
                globalPlayer.y + globalPlayer.height / 4 < wallBottom
            ) {
                globalPlayer.exists = false;
            }
        } break;
        case TileType.MELTER: {
            sprite = imgMelter;
            if (timers[tile.specialTimer] > 0) {
                drawText(tile.x * TILE.width - TILE.width / 2 + TILE.width / 2, tile.y * TILE.height + TILE.height / 6 - TILE.height / 2, 'blue', `${Math.round(timers[tile.specialTimer] / 60)}`, 30, Layer.UI);
            }
            if (!mouse.isDown) {
                tile.toughness = tile.firstToughness;
            }
        } break;
        case TileType.IRON: {
            if (tile.toughness <= tile.firstToughness && tile.toughness > tile.firstToughness / 5 * 4) {
                sprite = imgIron1;
            }
            if (tile.toughness <= tile.firstToughness / 5 * 4 && tile.toughness > tile.firstToughness / 5 * 3) {
                sprite = imgIron2;
            }
            if (tile.toughness <= tile.firstToughness / 5 * 3 && tile.toughness > tile.firstToughness / 5 * 2) {
                sprite = imgIron3;
            }
            if (tile.toughness <= tile.firstToughness / 5 * 2 && tile.toughness > tile.firstToughness / 5 * 1) {
                sprite = imgIron4;
            }
            if (tile.toughness <= tile.firstToughness / 5 * 1 && tile.toughness > 0) {
                sprite = imgIron5;
            }
        } break;
        case TileType.MOUNTAIN: {
            sprite = imgMountain;
        }
    }
    let [spriteX, spriteY] = tilesToPixels(tile.x, tile.y);
    drawSprite(spriteX, spriteY, sprite, 0, TILE.width, TILE.height, Layer.TILE);
}

function updateTileMap() {
    for (let y = 0; y < TILE.chunkCountY * TILE.chunkSizeY; y++) {
        for (let x = 0; x < TILE.chunkCountX * TILE.chunkSizeX; x++) {
            let tile = map[getIndexFromCoords(x, y)];
            updateTile(tile.baseLayer, tile);
            updateTile(tile.upperLayer, tile);
        }
    }
}

function updateGameObject(gameObject: GameObject) {
    if (gameObject.sprite !== imgNone) {
        drawSprite(gameObject.x, gameObject.y, gameObject.sprite, gameObject.angle, gameObject.width, gameObject.height);
    } else {
        drawRect(gameObject.x, gameObject.y, gameObject.width, gameObject.height, -gameObject.angle, gameObject.color);
    }

    if (gameObject.type === GameObjectType.PLAYER) {

        controlPlayer(gameObject);

        camera.x = gameObject.x;
        camera.y = gameObject.y;

        drawSprite(globalPlayer.x, globalPlayer.y + camera.height / 2 - 50, imgItems, 0, 300, 50, Layer.UI);

        drawSprite(globalPlayer.x - camera.width / 2 + 10, globalPlayer.y - camera.height / 4, imgArrow, 0, 30, 50, Layer.UI);

        if (mouse.wentDown && mouse.worldX > globalPlayer.x - camera.width / 2 - 10 &&
            mouse.worldX < globalPlayer.x - camera.width / 2 + 25 &&
            mouse.worldY > globalPlayer.y - camera.height / 4 - 25 &&
            mouse.worldY < globalPlayer.y - camera.height / 4 + 25
        ) {
            if (craftMode === true) {
                craftMode = false;
            } else {
                craftMode = true;
            }
        }

        if (craftMode && mouse.wentDown && mouse.worldX > globalPlayer.x - camera.width / 2 + 130 &&
            mouse.worldX < globalPlayer.x - camera.width / 2 + 170 &&
            mouse.worldY > globalPlayer.y - camera.height / 4 + 2 &&
            mouse.worldY < globalPlayer.y - camera.height / 4 + 30 &&
            recipes[slot - 1]) {
            slot--;
        }
        if (craftMode && mouse.wentDown && mouse.worldX > globalPlayer.x - camera.width / 2 + 130 &&
            mouse.worldX < globalPlayer.x - camera.width / 2 + 170 &&
            mouse.worldY > globalPlayer.y - camera.height / 4 + 422 &&
            mouse.worldY < globalPlayer.y - camera.height / 4 + 450 &&
            recipes[slot + 3]) {
            slot++;
        }

        if (craftMode) {
            //табличка
            drawSprite(globalPlayer.x - camera.width / 2 + 150, globalPlayer.y - camera.height / 4 + 200 + 25, imgCrafts, 0, 300, 400, Layer.UI);
            //стрелочки
            drawSprite(globalPlayer.x - camera.width / 2 + 150, globalPlayer.y - camera.height / 4 + 15, imgArrow1, 0, 40, 26, Layer.UI);
            drawSprite(globalPlayer.x - camera.width / 2 + 150, globalPlayer.y - camera.height / 4 + 435, imgArrow1, 1 * Math.PI, 40, 26, Layer.UI);
            //спрайты предметов
            for (let itemIndex = 0; itemIndex < 3; itemIndex++) {
                drawSprite(globalPlayer.x - camera.width / 2 + 60, globalPlayer.y - camera.height / 4 + 90 + 133 * itemIndex,
                    recipes[slot + itemIndex].sprite, 0, 70, 70, Layer.UI);

                drawText(globalPlayer.x - camera.width / 2 + 100, globalPlayer.y - camera.height / 4 + 50 + 133 * itemIndex,
                    'black', recipes[slot + itemIndex].name, 25, Layer.UI);

                //их составляющие
                for (let partIndex = 0; partIndex < recipes[slot + itemIndex].parts.length; partIndex++) {
                    let row = 0;
                    if (partIndex > 2) {
                        row = 1;
                    }
                    drawSprite(
                        globalPlayer.x - camera.width / 2 + 130 + 50 * partIndex - 150 * row, globalPlayer.y - camera.height / 4 + 90 + 133 * itemIndex + 50 * row,
                        recipes[slot + itemIndex].parts[partIndex].sprite, 0, 30, 30, Layer.UI
                    );
                    drawText(
                        globalPlayer.x - camera.width / 2 + 120 + 50 * partIndex - 150 * row, globalPlayer.y - camera.height / 4 + 70 + 133 * itemIndex + 50 * row,
                        'black', `${recipes[slot + itemIndex].parts[partIndex].count}`, 15, Layer.UI
                    );

                    //крафт

                    if (
                        mouse.worldX >= globalPlayer.x - camera.width / 2 &&
                        mouse.worldX <= globalPlayer.x - camera.width / 2 + 300 &&
                        mouse.worldY >= globalPlayer.y - camera.height / 4 + 25 + 133 * itemIndex &&
                        mouse.worldY <= globalPlayer.y - camera.height / 4 + 133 + 25 + 133 * itemIndex
                    ) {
                        drawText(globalPlayer.x + camera.width / 2 - 425, globalPlayer.y - 50, 'green', recipes[slot + itemIndex].description1, 25, Layer.UI);
                        drawText(globalPlayer.x + camera.width / 2 - 425, globalPlayer.y, 'green', recipes[slot + itemIndex].description2, 25, Layer.UI);
                        drawText(globalPlayer.x + camera.width / 2 - 425, globalPlayer.y + 50, 'green', recipes[slot + itemIndex].description3, 25, Layer.UI);
                        if (mouse.wentDown) {
                            addItem(recipes[slot + itemIndex].result, 1);
                            let success = removeItem(recipes[slot + itemIndex].parts[partIndex].item, recipes[slot + itemIndex].parts[partIndex].count);
                            if (!success) {
                                removeItem(recipes[slot + itemIndex].result, 1);
                            }
                        }
                    }
                }
            }
        }

        for (let particleIndex = 0; particleIndex < particles.length; particleIndex++) {
            let particle = particles[particleIndex];
            if (particle.color === 'grey' && particle.radius < 15) {
                let particleAngle = angleBetweenPoints(globalPlayer.x, globalPlayer.y, particle.x, particle.y);
                let particleSpeed = rotateVector(6, 0, particleAngle);
                particle.accelX = 0;
                particle.accelY = 0;
                particle.x += particleSpeed[0] - particle.speedX;
                particle.y -= particleSpeed[1] + particle.speedY;
                if (distanceBetweenPoints(particle.x, particle.y, gameObject.x, gameObject.y) <= 5) {
                    removeParticle(particleIndex);
                }
            }

            if (gameObject.width / 2 + particle.radius >= distanceBetweenPoints(gameObject.x, gameObject.y, particle.x, particle.y)) {
                if (particle.color === 'red') {
                    gameObject.exists = false;
                }
            }
        }

        let mouseTile = getTileUnderMouse();

        if (mouseTile && mouseTile.upperLayer === TileType.IRON && mouse.isDown) {
            moveToTile(mouseTile);
            if (globalPlayer.goForward === false) {
                mouseTile.toughness--;
                if (mouseTile.toughness % 200 === 0 || mouseTile.toughness === 0) {
                    let color = 'grey';
                    burstParticles({
                        x: mouse.worldX,
                        y: mouse.worldY,
                        color: color,
                        speed: 1,
                        size: 20,
                        decrease: 0,
                        accel: 0,
                        count: 20,
                    });
                }
            }
            if (mouseTile.toughness <= 0) {
                let x = mouseTile.x;
                let y = mouseTile.y;
                mouseTile.upperLayer = TileType.NONE;
            }

            let stripeWidth = 300;
            let width = stripeWidth * (mouseTile.toughness / mouseTile.firstToughness);
            drawRect(globalPlayer.x + width / 2 - 150, globalPlayer.y + camera.height / 4, width, 50, 0, 'green', Layer.UI);
        }

        if (mouseTile && mouseTile.upperLayer === TileType.MELTER && mouse.isDown) {
            moveToTile(mouseTile);
            if (globalPlayer.goForward === false) {
                mouseTile.toughness--;
            }
            if (mouseTile.toughness <= 0) {
                addItem(Item.MELTER, 1);
                let x = mouseTile.x;
                let y = mouseTile.y;
                mouseTile.upperLayer = TileType.NONE;
            }

            let stripeWidth = 300;
            let width = stripeWidth * (mouseTile.toughness / mouseTile.firstToughness);
            drawRect(globalPlayer.x + width / 2 - 150, globalPlayer.y + camera.height / 4, width, 50, 0, 'green', Layer.UI);
        }

        //рисование предметов в инвентаре

        for (let itemIndex = 0; itemIndex <= 4; itemIndex++) {
            if (inventory[itemIndex]) {
                let x = globalPlayer.x - 125;
                let y = globalPlayer.y + camera.height / 2 - 50;
                let sprite = null;
                if (inventory[itemIndex].item === Item.IRON) {
                    sprite = imgIronItem;
                }
                if (inventory[itemIndex].item === Item.MELTER) {
                    sprite = imgMelter;
                }
                if (inventory[itemIndex].item === Item.IRON_INGOT) {
                    sprite = imgIronIngot;
                }

                if (itemIndex === mainSlot) {
                    drawSprite(x + 50 * itemIndex, y, imgMainSlot, 0, 50, 50, Layer.UI)
                }

                drawSprite(x + 50 * itemIndex, y, sprite, 0, 40, 40, Layer.UI);
                drawText(x - 5 + 50 * itemIndex, y - 34, 'black', `${inventory[itemIndex].count}`, 25, Layer.UI);
            }
        }

        if (
            mouse.worldX >= globalPlayer.x - 145 &&
            mouse.worldX <= globalPlayer.x - 105 &&
            mouse.worldY >= globalPlayer.y + camera.height / 2 - 70 &&
            mouse.worldY <= globalPlayer.y + camera.height / 2 - 30 &&
            mouse.wentDown
        ) {
            mainSlot = 0;
        }
        if (
            mouse.worldX >= globalPlayer.x - 95 &&
            mouse.worldX <= globalPlayer.x - 55 &&
            mouse.worldY >= globalPlayer.y + camera.height / 2 - 70 &&
            mouse.worldY <= globalPlayer.y + camera.height / 2 - 30 &&
            mouse.wentDown
        ) {
            mainSlot = 1;
        }
        if (
            mouse.worldX >= globalPlayer.x - 45 &&
            mouse.worldX <= globalPlayer.x - 5 &&
            mouse.worldY >= globalPlayer.y + camera.height / 2 - 70 &&
            mouse.worldY <= globalPlayer.y + camera.height / 2 - 30 &&
            mouse.wentDown
        ) {
            mainSlot = 2;
        }
        if (
            mouse.worldX >= globalPlayer.x + 5 &&
            mouse.worldX <= globalPlayer.x + 45 &&
            mouse.worldY >= globalPlayer.y + camera.height / 2 - 70 &&
            mouse.worldY <= globalPlayer.y + camera.height / 2 - 30 &&
            mouse.wentDown
        ) {
            mainSlot = 3;
        }
        if (
            mouse.worldX >= globalPlayer.x + 55 &&
            mouse.worldX <= globalPlayer.x + 95 &&
            mouse.worldY >= globalPlayer.y + camera.height / 2 - 70 &&
            mouse.worldY <= globalPlayer.y + camera.height / 2 - 30 &&
            mouse.wentDown
        ) {
            mainSlot = 4;
        }
        if (
            mouse.worldX >= globalPlayer.x + 105 &&
            mouse.worldX <= globalPlayer.x + 145 &&
            mouse.worldY >= globalPlayer.y + camera.height / 2 - 70 &&
            mouse.worldY <= globalPlayer.y + camera.height / 2 - 30 &&
            mouse.wentDown
        ) {
            mainSlot = 5;
        }

        if (mouseTile && mouseTile.baseLayer === TileType.LAVA && mouse.wentDown && !mouseTile.upperLayer) {
            if (inventory[mainSlot] && inventory[mainSlot].item === Item.MELTER) {
                mouseTile.upperLayer = TileType.MELTER;
                mouseTile.toughness = 200;
                mouseTile.firstToughness = 200;
                mouseTile.specialTimer = addTimer(0);
                removeItem(Item.MELTER, 1);
            }
        }

        if (mouseTile && mouse.wentDown && mouseTile.upperLayer === TileType.MELTER) {
            if (mouseTile.item === null && inventory[mainSlot] && (inventory[mainSlot].item === Item.IRON)) {
                mouseTile.item = inventory[mainSlot].item;
                mouseTile.count = inventory[mainSlot].count;
                removeItem(inventory[mainSlot].item, inventory[mainSlot].count);
                mouseTile.specialTimer = addTimer(mouseTile.count * 5 * 60);
                console.log(timers[mouseTile.specialTimer]);
            } else if (timers[mouseTile.specialTimer] <= 0) {
                console.log(timers[mouseTile.specialTimer]);
                if (mouseTile.item === Item.IRON) {
                    addItem(Item.IRON_INGOT, mouseTile.count);
                }
                mouseTile.item = null;
                mouseTile.count = null;
            }
        }

        let angle = angleBetweenPoints(mouse.worldX, mouse.worldY, gameObject.x, gameObject.y);

        drawSprite(gameObject.x, gameObject.y, imgCamera, angle, 30, 30);

        let [wheel1X, wheel1Y] = rotateVector(46, 40, -gameObject.angle);
        let [wheel2X, wheel2Y] = rotateVector(9, 45, -gameObject.angle);
        let [wheel3X, wheel3Y] = rotateVector(-48, 45, -gameObject.angle);
        let [wheel4X, wheel4Y] = rotateVector(46, -40, -gameObject.angle);
        let [wheel5X, wheel5Y] = rotateVector(9, -45, -gameObject.angle);
        let [wheel6X, wheel6Y] = rotateVector(-48, -45, -gameObject.angle);

        if (gameObject.goForward) {
            gameObject.leftWeel++;
            gameObject.rightWeel++;
        } else
            if (gameObject.goBackward) {
                gameObject.leftWeel--;
                gameObject.rightWeel--;
            } else {
                if (gameObject.goLeft) {
                    gameObject.rightWeel++;
                }
                if (gameObject.goRight) {
                    gameObject.leftWeel++;
                }
            }

        if (gameObject.leftWeel > 6) {
            gameObject.leftWeel = 1;
        }
        if (gameObject.rightWeel > 6) {
            gameObject.rightWeel = 1;
        }
        if (gameObject.leftWeel < 1) {
            gameObject.leftWeel = 6;
        }
        if (gameObject.rightWeel < 1) {
            gameObject.rightWeel = 6;
        }

        if (gameObject.leftWeel === 1) {
            drawSprite(gameObject.x + wheel1X, gameObject.y + wheel1Y, imgWheel1, gameObject.angle);
            drawSprite(gameObject.x + wheel2X, gameObject.y + wheel2Y, imgWheel1, gameObject.angle);
            drawSprite(gameObject.x + wheel3X, gameObject.y + wheel3Y, imgWheel1, gameObject.angle);
        }
        if (gameObject.leftWeel === 2) {
            drawSprite(gameObject.x + wheel1X, gameObject.y + wheel1Y, imgWheel2, gameObject.angle);
            drawSprite(gameObject.x + wheel2X, gameObject.y + wheel2Y, imgWheel2, gameObject.angle);
            drawSprite(gameObject.x + wheel3X, gameObject.y + wheel3Y, imgWheel2, gameObject.angle);
        }
        if (gameObject.leftWeel === 3) {
            drawSprite(gameObject.x + wheel1X, gameObject.y + wheel1Y, imgWheel3, gameObject.angle);
            drawSprite(gameObject.x + wheel2X, gameObject.y + wheel2Y, imgWheel3, gameObject.angle);
            drawSprite(gameObject.x + wheel3X, gameObject.y + wheel3Y, imgWheel3, gameObject.angle);
        }
        if (gameObject.leftWeel === 4) {
            drawSprite(gameObject.x + wheel1X, gameObject.y + wheel1Y, imgWheel4, gameObject.angle);
            drawSprite(gameObject.x + wheel2X, gameObject.y + wheel2Y, imgWheel4, gameObject.angle);
            drawSprite(gameObject.x + wheel3X, gameObject.y + wheel3Y, imgWheel4, gameObject.angle);
        }
        if (gameObject.leftWeel === 5) {
            drawSprite(gameObject.x + wheel1X, gameObject.y + wheel1Y, imgWheel5, gameObject.angle);
            drawSprite(gameObject.x + wheel2X, gameObject.y + wheel2Y, imgWheel5, gameObject.angle);
            drawSprite(gameObject.x + wheel3X, gameObject.y + wheel3Y, imgWheel5, gameObject.angle);
        }
        if (gameObject.leftWeel === 6) {
            drawSprite(gameObject.x + wheel1X, gameObject.y + wheel1Y, imgWheel6, gameObject.angle);
            drawSprite(gameObject.x + wheel2X, gameObject.y + wheel2Y, imgWheel6, gameObject.angle);
            drawSprite(gameObject.x + wheel3X, gameObject.y + wheel3Y, imgWheel6, gameObject.angle);
        }

        if (gameObject.rightWeel === 1) {
            drawSprite(gameObject.x + wheel4X, gameObject.y + wheel4Y, imgWheel1, gameObject.angle);
            drawSprite(gameObject.x + wheel5X, gameObject.y + wheel5Y, imgWheel1, gameObject.angle);
            drawSprite(gameObject.x + wheel6X, gameObject.y + wheel6Y, imgWheel1, gameObject.angle);
        }
        if (gameObject.rightWeel === 2) {
            drawSprite(gameObject.x + wheel4X, gameObject.y + wheel4Y, imgWheel2, gameObject.angle);
            drawSprite(gameObject.x + wheel5X, gameObject.y + wheel5Y, imgWheel2, gameObject.angle);
            drawSprite(gameObject.x + wheel6X, gameObject.y + wheel6Y, imgWheel2, gameObject.angle);
        }
        if (gameObject.rightWeel === 3) {
            drawSprite(gameObject.x + wheel4X, gameObject.y + wheel4Y, imgWheel3, gameObject.angle);
            drawSprite(gameObject.x + wheel5X, gameObject.y + wheel5Y, imgWheel3, gameObject.angle);
            drawSprite(gameObject.x + wheel6X, gameObject.y + wheel6Y, imgWheel3, gameObject.angle);
        }
        if (gameObject.rightWeel === 4) {
            drawSprite(gameObject.x + wheel4X, gameObject.y + wheel4Y, imgWheel4, gameObject.angle);
            drawSprite(gameObject.x + wheel5X, gameObject.y + wheel5Y, imgWheel4, gameObject.angle);
            drawSprite(gameObject.x + wheel6X, gameObject.y + wheel6Y, imgWheel4, gameObject.angle);
        }
        if (gameObject.rightWeel === 5) {
            drawSprite(gameObject.x + wheel4X, gameObject.y + wheel4Y, imgWheel5, gameObject.angle);
            drawSprite(gameObject.x + wheel5X, gameObject.y + wheel5Y, imgWheel5, gameObject.angle);
            drawSprite(gameObject.x + wheel6X, gameObject.y + wheel6Y, imgWheel5, gameObject.angle);
        }
        if (gameObject.rightWeel === 6) {
            drawSprite(gameObject.x + wheel4X, gameObject.y + wheel4Y, imgWheel6, gameObject.angle);
            drawSprite(gameObject.x + wheel5X, gameObject.y + wheel5Y, imgWheel6, gameObject.angle);
            drawSprite(gameObject.x + wheel6X, gameObject.y + wheel6Y, imgWheel6, gameObject.angle);
        }

        moveGameObject(gameObject);
    }
}


function loop() {
    drawQueue = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.rotate(-camera.angle);
    ctx.translate(-camera.x + camera.width / 2, -camera.y + camera.height / 2);

    [mouse.worldX, mouse.worldY] = screenToWorld(mouse.x, mouse.y);

    updateTileMap();

    for (let gameObjectIndex = 0; gameObjectIndex < gameObjects.length; gameObjectIndex++) {
        let gameObject = gameObjects[gameObjectIndex];
        if (gameObject.exists) {
            updateGameObject(gameObject);
        }
    }

    drawParticles();

    drawQueue.sort((a, b) => b.layer - a.layer);
    for (let itemIndex = 0; itemIndex < drawQueue.length; itemIndex++) {
        const item = drawQueue[itemIndex];
        renderItem(item);

    }

    ctx.restore();

    updateTimers();
    deleteControls();
    clearAllKeys();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);