
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

window.onload = function () {
    var child = document.getElementById("child");
    var childContext = child.getContext("2d");
    childContext.rect(0, 0, child.getAttribute("width"), child.getAttribute("height"));
    childContext.fill();

    GameEngine.init(960, 536, document.getElementById("input"), document.getElementById("main"));

    var game = new GameEngine.GameObject();
    game.setName("game");
    game.attachTo(GameEngine.root);

    //Fade.init();
    //Fade.object.transform.setAlpha(0);

    loadLoadingScreen();
};

function loadLoadingScreen() {
    var main = document.getElementById("main");
    var loadScreen = new GameEngine.GameObject();
    loadScreen.setName("LoadScreen");
    loadScreen.attachTo(GameEngine.root.getChild("game"));


    function show(onFinish) {
        loadScreen.transform.setGlobalPosition(parseInt(main.getAttribute("width")), 0);
        var component = loadScreen.addComponent("TimeLine");
        component.addPoint({Time: 0.2, GlobalPosition: {x: 0, y: 0}, onFinish: onFinish});
        component.start();
    }

    function hide(onFinish) {
        var component = loadScreen.addComponent("TimeLine");
        component.addPoint({
            Time: 0.2,
            GlobalPosition: {x: -parseInt(main.getAttribute("width")), y: 0},
            onFinish: onFinish
        });
        component.start();
    }

    var smile = new GameEngine.GameObject();
    smile.setName("smile");
    smile.addComponent("Sprite").setSourse("Assets/smile.png");
    smile.attachTo(loadScreen);
    smile.transform.setLocalPosition(350, 64);

    var text = new GameEngine.GameObject();
    text.attachTo(loadScreen);
    var textComponent = text.addComponent("Text");
    textComponent.text = "Loading... 0%";
    textComponent.color = "#d5b500";
    text.transform.setLocalPosition(400, 469);

    //specially animated for example
    show(function () {
        setTimeout(function () {
            var prevProgress = 0;
            GameEngine.AssetsCache.load(function (progress) {
                function animate() {
                    var tl = text.addComponent("TimeLine");
                    tl.addPoint({
                        Time: 1, onInterval: function (owner, parameters) {
                            prevProgress += (progress - prevProgress) * (parameters.elapsedTime / this.Time);
                            if (prevProgress > 1) prevProgress = 1;
                            textComponent.text = "Loading... " + Math.ceil(prevProgress * 100) + "%";
                        }, onFinish: function () {
                            if (prevProgress >= 1) {
                                setTimeout(function () {
                                    hide(function () {
                                        loadScreen.detach();
                                        Fade.init();
                                        loadMainScene();
                                        Fade.hide();
                                    });
                                }, 500);
                            }
                        }
                    });
                    tl.start();
                }

                if (!text.getComponent("TimeLine")) {
                    animate();
                } else {
                    text.removeComponent("TimeLine");
                    animate();
                }
            });
        }, 500);
    });
}

function loadMainScene() {
    var playerIsWinner = false;
    var selectedFruit = "wild";

    var background = new GameEngine.GameObject();
    background.setName("background");
    background.addComponent("Sprite").setSourse("Assets/BG.png");
    background.attachTo(GameEngine.root.getChild("game"));

    var spinButton = new GameEngine.GameObject();
    spinButton.setName("spinButton");
    spinButton.addComponent("Sprite").setSourse("Assets/BTN_Spin.png");
    spinButton.attachTo(background);
    spinButton.transform.setLocalPosition(824, 219);

    var drum1 = createDrum({Time: 2, decelerationTime: 0.5, speed: 50});
    drum1.setName("drum1");
    var spin = drum1.getComponent("spin");
    var drum2 = createDrum({Time: 3, decelerationTime: 0.5, speed: 50});
    drum2.setName("drum2");
    drum2.transform.setLocalPosition(240, 0);

    var drum3 = createDrum({Time: 4, decelerationTime: 0.5, speed: 50});
    drum3.setName("drum3");
    drum3.transform.setLocalPosition(480, 0);

    var objectsName = ["wild", "strawberry", "pineapple", "lemon", "cucumber", "bilberry"];

    function winAnimation() {
        var object = new GameEngine.GameObject();
        object.attachTo(background);
        object.transform.setLocalPosition(280, 268);
        object.transform.setAlpha(0);
        var textComponent = object.addComponent("Text");
        textComponent.text = "You win!!!";
        textComponent.font = "bold 100px arial";
        textComponent.color = "#a8f546";
        var timeLine = object.addComponent("TimeLine");
        timeLine.addPoint({Time: 2, Alpha: 1});
        timeLine.addPoint({Time: 2.1, LocalPosition: {x: 280, y: 218}});
        timeLine.addPoint({Time: 2.2, LocalPosition: {x: 280, y: 268}});
        timeLine.addPoint({Time: 2.3, LocalPosition: {x: 280, y: 218}});
        timeLine.addPoint({Time: 2.4, LocalPosition: {x: 280, y: 268}});
        timeLine.addPoint({
            Time: 4.4, Alpha: 0, onFinish: function (owner) {
                owner.detach();
            }
        });
        timeLine.start();
    }

    spinButton.input.onmousedown = function () {
        console.log("down");
        spinButton.input.enabled = false;
        spinButton.getComponent("Sprite").setSourse("Assets/BTN_Spin_d.png");
        console.log("Input: false");
        var timeLine = spinButton.addComponent("TimeLine");
        timeLine.addPoint({
            Time: 0.1, Scale: {x: spinButton.transform.getScale().x + 0.1, y: spinButton.transform.getScale().y + 0.1},
            LocalPosition: {
                x: spinButton.transform.getLocalPosition().x - 4.9,
                y: spinButton.transform.getLocalPosition().y - 4.9
            }
        });
        timeLine.addPoint({
            Time: 0.2, Scale: {x: spinButton.transform.getScale().x, y: spinButton.transform.getScale().y},
            LocalPosition: {x: spinButton.transform.getLocalPosition().x, y: spinButton.transform.getLocalPosition().y}
        });
        timeLine.start();

        drum1.winner = objectsName[getRandomInt(0, 6)];
        drum2.winner = objectsName[getRandomInt(0, 6)];
        drum3.winner = objectsName[getRandomInt(0, 6)];

        if (drum1.winner === selectedFruit && drum2.winner === selectedFruit && drum3.winner === selectedFruit) playerIsWinner = true;

        spin.start();
        drum2.getComponent("spin").start();
        drum3.getComponent("spin").start();
    };

    drum3.getComponent("spin").setOnFinish(function () {
        spinButton.input.enabled = true;
        spinButton.getComponent("Sprite").setSourse("Assets/BTN_Spin.png");
        console.log("Input: true");
        if (playerIsWinner) {
            playerIsWinner = false;
            console.log("You win!");
            winAnimation();
        } else {
            console.log("You lose!");
        }
    });

    var backForSelectMenu = new GameEngine.GameObject();
    backForSelectMenu.attachTo(background);
    backForSelectMenu.addComponent("Sprite").setSourse("Assets/backForSelectMenu.png");
    backForSelectMenu.transform.setLocalPosition(799, 51.5);
    backForSelectMenu.transform.setAlpha(0.7);

    var icon = new GameEngine.GameObject();
    icon.setName("icon");
    icon.attachTo(backForSelectMenu);
    icon.addComponent("Sprite").setSourse("Assets/SYM1.png");
    icon.transform.setScale(0.5, 0.5);
    icon.transform.setGlobalPosition(816.25, 90);//107.25);

    var text1 = new GameEngine.GameObject();
    text1.attachTo(background);
    text1.transform.setGlobalPosition(805, 75);
    var text1Component = text1.addComponent("Text");
    text1Component.font = "24px arial";
    text1Component.color = "#5f8bc2";
    text1Component.text = "Winning fruit";

    var text2 = new GameEngine.GameObject();
    text2.attachTo(background);
    text2.transform.setGlobalPosition(810, 190);
    var text2Component = text2.addComponent("Text");
    text2Component.font = "20px arial";
    text2Component.color = "#5f8bc2";
    text2Component.text = "Push this fruit";

    function setIconSprite (name) {
        var resource = {
            "wild": "SYM1.png",
            "strawberry": "SYM3.png",
            "pineapple": "SYM4.png",
            "lemon": "SYM5.png",
            "cucumber": "SYM6.png",
            "bilberry": "SYM7.png"
        };

        selectedFruit = name;
        var sprite = icon.getComponent("Sprite");
        sprite.setSourse("Assets/" + resource[name]);
    }

    icon.input.onmousedown = function () {
        fruitMenu(setIconSprite);
    };

}

function fruitMenu(onSelected) {
    var background = new GameEngine.GameObject();
    background.attachTo(GameEngine.root.getChild("game"));
    background.addComponent("Sprite").setSourse("Assets/fade.png");
    background.transform.setAlpha(0.8);

    function animation(object) {
        var startScale = {x: object.transform.getScale().x, y: object.transform.getScale().y};
        var startPos = {x: object.transform.getLocalPosition().x, y: object.transform.getLocalPosition().y};
        var cursorOnButton = false;

        object.input.onmouseover = function () {
            object.removeComponent("out");
            console.log(object.getName() + ": 'object.getComponent('out')' is " + (object.getComponent("out")));
            console.log(object.getName() + ": IN!");

            var sprite = object.getComponent("Sprite");
            var timeLine = object.addComponent("TimeLine");
            timeLine.setName("in");
            timeLine.addPoint({
                Time: 0.3, Scale: {x: startScale.x + 0.2, y: startScale.y + 0.2},
                LocalPosition: {
                    x: object.transform.getLocalPosition().x - (sprite.image.width * 0.2) / 2,
                    y: object.transform.getLocalPosition().y - (sprite.image.height * 0.2) / 2
                },
                onInterval: function (owner) {
                    if (owner.transform.getScale().x > startScale.x + 0.2
                        || owner.transform.getScale().y > startScale.y + 0.2
                        || owner.transform.getLocalPosition().x < startPos.x - (sprite.image.width * 0.2) / 2
                        || owner.transform.getLocalPosition().y < startPos.y - (sprite.image.height * 0.2) / 2) {

                        owner.transform.setScale(startScale.x + 0.2, startScale.y + 0.2);
                        owner.transform.setLocalPosition(startPos.x - (sprite.image.width * 0.2) / 2, startPos.y - (sprite.image.height * 0.2) / 2);
                        owner.removeComponent("in");
                    }
                }
            });
            timeLine.start();

            cursorOnButton = true;
        };

        object.input.onmouseout = function () {
            object.removeComponent("in");
            console.log(object.getName() + ": 'object.getComponent('in')' is " + (object.getComponent("in")));
            console.log(object.getName() + ": out!");

            var sprite = object.getComponent("Sprite");
            var timeLine = object.addComponent("TimeLine");
            timeLine.setName("out");
            timeLine.addPoint({
                Time: 0.3, Scale: {x: object.transform.getScale().x - 0.2, y: object.transform.getScale().y - 0.2},
                LocalPosition: {
                    x: object.transform.getLocalPosition().x + (sprite.image.width * 0.2) / 2,
                    y: object.transform.getLocalPosition().y + (sprite.image.height * 0.2) / 2
                },
                onInterval: function (owner) {
                    if (owner.transform.getScale().x < startScale.x
                        || owner.transform.getScale().y < startScale.y
                        || owner.transform.getLocalPosition().x > startPos.x
                        || owner.transform.getLocalPosition().y > startPos.y) {

                        owner.transform.setScale(startScale.x, startScale.y);
                        owner.transform.setLocalPosition(startPos.x, startPos.y);
                        owner.removeComponent("out");
                    }
                }
            });
            timeLine.start();


            cursorOnButton = false;
        };
    }

    function select (object) {
        object.input.onmousedown = function () {
            if (onSelected) {
                onSelected(object.getName());
            }
            background.detach();
        }
    }

    var text = new GameEngine.GameObject();
    text.attachTo(background);
    text.transform.setGlobalPosition(350, 50);
    var textComponent = text.addComponent("Text");
    textComponent.font = "32px arial";
    textComponent.color = "#5f8bc2";
    textComponent.text = "Please, select fruit:";

    var wild = new GameEngine.GameObject();
    wild.setName("wild");
    wild.addComponent("Sprite").setSourse("Assets/SYM1.png");
    wild.attachTo(background);
    wild.transform.setScale(0.8, 0.8);
    wild.transform.setLocalPosition(97.5, 120);
    animation(wild);
    select(wild);

    var strawberry = new GameEngine.GameObject();
    strawberry.setName("strawberry");
    strawberry.addComponent("Sprite").setSourse("Assets/SYM3.png");
    strawberry.attachTo(background);
    strawberry.transform.setLocalPosition(362.5, 98);//200);
    animation(strawberry);
    select(strawberry);

    var pineapple = new GameEngine.GameObject();
    pineapple.setName("pineapple");
    pineapple.addComponent("Sprite").setSourse("Assets/SYM4.png");
    pineapple.attachTo(background);
    pineapple.transform.setLocalPosition(627.5, 98);//360);
    animation(pineapple);
    select(pineapple);

    var lemon = new GameEngine.GameObject();
    lemon.setName("lemon");
    lemon.addComponent("Sprite").setSourse("Assets/SYM5.png");
    lemon.attachTo(background);
    lemon.transform.setLocalPosition(97.5, 350);//510);
    animation(lemon);
    select(lemon);

    var cucumber = new GameEngine.GameObject();
    cucumber.setName("cucumber");
    cucumber.addComponent("Sprite").setSourse("Assets/SYM6.png");
    cucumber.attachTo(background);
    cucumber.transform.setLocalPosition(362.5, 350);//652);
    animation(cucumber);
    select(cucumber);

    var bilberry = new GameEngine.GameObject();
    bilberry.setName("bilberry");
    bilberry.addComponent("Sprite").setSourse("Assets/SYM7.png");
    bilberry.attachTo(background);
    bilberry.transform.setLocalPosition(627.5, 350);//796);
    animation(bilberry);
    select(bilberry);
}

var createDrum = function (parameters) {
    function newPos(startPos) {
        var indent = 15;
        startPos.y += 155 + indent;
        return startPos;
    }

    //58
    var startPos = {y: -252};

    var background = GameEngine.root.getChild("game").getChild("background");
    var drum = new GameEngine.GameObject();
    drum.setName("drum");
    drum.attachTo(background);

    var wild = new GameEngine.GameObject();
    wild.setName("wild");
    wild.addComponent("Sprite").setSourse("Assets/SYM1.png");
    wild.attachTo(drum);
    wild.transform.setScale(0.8, 0.8);
    wild.transform.setLocalPosition(93, startPos.y + 15);

    var strawberry = new GameEngine.GameObject();
    strawberry.setName("strawberry");
    strawberry.addComponent("Sprite").setSourse("Assets/SYM3.png");
    strawberry.attachTo(drum);
    strawberry.transform.setLocalPosition(69, newPos(startPos).y);//200);

    var pineapple = new GameEngine.GameObject();
    pineapple.setName("pineapple");
    pineapple.addComponent("Sprite").setSourse("Assets/SYM4.png");
    pineapple.attachTo(drum);
    pineapple.transform.setLocalPosition(69, newPos(startPos).y);//360);

    var lemon = new GameEngine.GameObject();
    lemon.setName("lemon");
    lemon.addComponent("Sprite").setSourse("Assets/SYM5.png");
    lemon.attachTo(drum);
    lemon.transform.setLocalPosition(69, newPos(startPos).y);//510);

    var cucumber = new GameEngine.GameObject();
    cucumber.setName("cucumber");
    cucumber.addComponent("Sprite").setSourse("Assets/SYM6.png");
    cucumber.attachTo(drum);
    cucumber.transform.setLocalPosition(69, newPos(startPos).y);//652);

    var bilberry = new GameEngine.GameObject();
    bilberry.setName("bilberry");
    bilberry.addComponent("Sprite").setSourse("Assets/SYM7.png");
    bilberry.attachTo(drum);
    var bottom = newPos(startPos).y;
    bilberry.transform.setLocalPosition(69, bottom);//796);

    var spin = drum.addComponent("TimeLine");
    spin.setName("spin");
    spin.setRemoveOnFinish(false);

    spin.addPoint(
        {
            Time: parameters.Time,
            top: -252,
            bottom: newPos(startPos).y,
            speed: parameters.speed,
            decelerationTime: parameters.decelerationTime,
            winY: 213,
            onInterval: function (drum, parameters) {
                var speed = this.speed;
                if (!this.first) {
                    this.height = (this.top - this.bottom < 0) ? (this.top - this.bottom) * -1 : (this.top - this.bottom);
                    var sp = speed;
                    var dis1 = 0;
                    while (sp > 0) {
                        sp = sp - speed * (parameters.deltaTime / this.decelerationTime);
                        dis1 += sp;
                    }
                    var dis2 = speed * ((this.Time - this.decelerationTime) / parameters.deltaTime);
                    var startY = this.winY - ((dis1 + dis2) - Math.ceil((dis1 + dis2) / this.height) * this.height);
                    if (drum.winner === "wild")  startY += 15;
                    if (this.top > startY) {
                        startY += this.height;
                    }

                    var currentY = drum.getChild(drum.winner).transform.getLocalPosition().y;
                    speed = startY - currentY;
                    if (speed < 0) {
                        speed = (this.height - currentY) + startY;
                    }
                    speed += this.speed;
                }

                if (parameters.elapsedTime >= this.Time - this.decelerationTime) {
                    var percent = (parameters.elapsedTime - (this.Time - this.decelerationTime)) / this.decelerationTime;
                    speed *= 1 - percent;
                }

                var children = drum.getChildren();
                for (var i = 0; i < children.length; i++) {
                    var pos = children[i].transform.getLocalPosition();

                    if (pos.y + speed >= this.bottom) {
                        children[i].transform.setLocalPosition(pos.x, this.top + (pos.y + speed - this.bottom));
                    } else {
                        children[i].transform.setLocalPosition(pos.x, pos.y + speed);
                    }
                }
                this.first = true;
            },
            onPoint: function () {
                this.first = false;
            }
        });
    return drum;
};

var Fade = {
    object: new GameEngine.GameObject(),
    init: function () {
        this.object.attachTo(GameEngine.root);
        var sprite = this.object.addComponent("Sprite");
        sprite.setSourse("Assets/fade.png");
        this.object.input.enabled = false;
    },
    show: function (onFinish) {
        this.object.transform.setAlpha(0);
        var showComponent = this.object.addComponent("TimeLine");
        showComponent.addPoint({
            Time: 1, Alpha: 1, onFinish: function (owner) {
                owner.transform.setAlpha(0);
                if (onFinish) onFinish();
            }
        });
        showComponent.start();
    },
    hide: function (onFinish) {
        this.object.transform.setAlpha(1);
        var hideComponent = this.object.addComponent("TimeLine");
        hideComponent.addPoint({
            Time: 1, Alpha: 0, onFinish: function (owner) {
                owner.transform.setAlpha(0);
                if (onFinish) onFinish();
            }
        });
        hideComponent.start();
    }
};

