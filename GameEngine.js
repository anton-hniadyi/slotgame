var Vector2 = function (x, y) {
    if (!isNaN(x) && !isNaN(y)) {
        this.x = x;
        this.y = y;
    } else {
        this.x = 0;
        this.y = 0;
    }
};

var GameEngine = {
    init: function (sizeX, sizeY, canvas1, canvas2) {
        this.renderImageCanvas = canvas1;
        this.mainCanvas = canvas2;
        this.mainCanvas.setAttribute("width", sizeX);
        this.mainCanvas.setAttribute("height", sizeY);
        this.canvasSize = {x: sizeX, y: sizeY};

        this.mainCanvas.addEventListener("mousedown", function (event) {
            GameEngine.InputSystem.detectGameObject(event, "mousedown");
        });

        this.mainCanvas.addEventListener("mousemove", function (event) {
            GameEngine.InputSystem.detectGameObject(event, "mousemove");
        });

        this.root = new GameEngine.GameObject();
        this.root.setName("root");
    },
    RenderSystem: {
        render: function () {
            if (GameEngine.root) {
                var context = GameEngine.mainCanvas.getContext("2d");
                context.clearRect(0, 0, GameEngine.canvasSize.x, GameEngine.canvasSize.y);

                var stack = [];

                Number.prototype.degree = function () {
                    return this * Math.PI / 180;
                };

                function drawImage(image, fromX, fromY, gameObject) {
                    context.save();
                    //ctx.translate(fromX + (image.width * gameObject.render.getScale().x) / 2, fromY + (image.height * gameObject.render.getScale().y) / 2);
                    //var angle = 30;
                    //ctx.rotate(angle.degree());
                    //ctx.translate(-(fromX + (image.width * gameObject.render.getScale().x) / 2), -(fromY + (image.height * gameObject.render.getScale().y) / 2));
                    context.globalAlpha = gameObject.transform.getAlpha();
                    context.scale(gameObject.render.getScale().x, gameObject.render.getScale().y);
                    context.drawImage(image, fromX / gameObject.render.getScale().x, fromY / gameObject.render.getScale().y);
                    //ctx.drawImage(image, fromX / gameObject.render.getScale().x - (image.width * gameObject.render.getScale().x) / 2, fromY / gameObject.render.getScale().y - (image.height * gameObject.render.getScale().y) / 2);
                    context.restore();
                }

                function drawText(textComponent, x, y, gameObject) {
                    context.save();
                    context.globalAlpha = gameObject.transform.getAlpha();
                    context.scale(gameObject.render.getScale().x, gameObject.render.getScale().y);
                    if (textComponent.type === "fill") {
                        context.font = textComponent.font;
                        context.fillStyle = textComponent.color;
                        context.fillText(textComponent.text, x, y);
                    } else if (textComponent.type === "stroke") {
                        context.font = textComponent.font;
                        context.strokeStyle = textComponent.color;
                        context.strokeText(textComponent.text, x / gameObject.render.getScale().x, y / gameObject.render.getScale().y);
                    }
                    context.restore();
                }

                function drawStack() {
                    while (stack[0] && (stack[0].text || stack[0].sprite.isLoaded)) {
                        var temp = stack.shift();
                        if (temp.sprite)
                            drawImage(temp.sprite.image, temp.pos.x, temp.pos.y, temp.obj);

                        if (temp.text)
                            drawText(temp.text, temp.pos.x, temp.pos.y, temp.obj)
                    }

                    if (stack[0]) {
                        stack[0].sprite.onload = function () {
                            drawStack();
                        }
                    }
                }

                function run(object) {
                    var children = object.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        var sprite = children[i].getComponent("Sprite");
                        var text = children[i].getComponent("Text");
                        var pos = children[i].transform.getGlobalPosition();
                        if (sprite) {
                            if (sprite.isLoaded && stack.length < 1)
                                drawImage(sprite.image, pos.x, pos.y, children[i]);
                            else
                                stack.push({sprite: sprite, pos: pos, obj: children[i]});
                        }

                        if (text) {
                            if (stack.length < 1)
                                drawText(text, pos.x, pos.y, children[i]);
                            else
                                stack.push({text: text, pos: pos, obj: children[i]});
                        }
                        drawStack();
                        run(children[i]);
                    }
                }

                run(GameEngine.root);
            }
        }
    },
    InputSystem: {
        currentObjectID: -1,
        detectGameObject: function (event, type) {
            var self = this;
            var position = {
                x: event.pageX - GameEngine.mainCanvas.offsetLeft,
                y: event.pageY - GameEngine.mainCanvas.offsetTop
            };

            function getBase64Image(img) {
                GameEngine.renderImageCanvas.width = img.width;
                GameEngine.renderImageCanvas.height = img.height;

                var ctx = GameEngine.renderImageCanvas.getContext("2d");
                ctx.clearRect(0, 0, GameEngine.renderImageCanvas.getAttribute("width"), GameEngine.renderImageCanvas.getAttribute("height"));
                ctx.drawImage(img, 0, 0);

                return ctx;
            }

            function findObjectByID(id, startObject) {
                if (startObject.getID() === id) {
                    return startObject;
                } else if (startObject.getChildren().length > 0) {
                    var children = startObject.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        var object = findObjectByID(id, children[i]);
                        if (object) {
                            return object;
                        }
                    }
                }
            }

            function detect(object) {
                if (object && object instanceof GameEngine.GameObject) {
                    var children = object.getChildren();
                    if (children.length > 0) {
                        for (var i = 0; i < children.length; i++) {
                            if (detect(children[children.length - 1 - i])) {
                                return true;
                            }
                        }
                    }

                    var sprite = object.getComponent("Sprite");

                    if (object.input.enabled
                        && sprite
                        && object.transform.getGlobalPosition().x / object.getParent().render.getScale().x < position.x && object.transform.getGlobalPosition().x / object.getParent().render.getScale().x + sprite.image.width * object.render.getScale().x > position.x
                        && object.transform.getGlobalPosition().y / object.getParent().render.getScale().x < position.y && object.transform.getGlobalPosition().y / object.getParent().render.getScale().x + sprite.image.height * object.render.getScale().y > position.y) {

                        var pixel = getBase64Image(sprite.image).getImageData((position.x - object.transform.getGlobalPosition().x / object.getParent().render.getScale().x) / object.render.getScale().x, (position.y - object.transform.getGlobalPosition().y / object.getParent().render.getScale().y) / object.render.getScale().y, 1, 1).data;
                        var isOpaque = pixel[3] === 255;
                        if (!isOpaque) {
                            return false;
                        } else {
                            if (type === "mousemove" && object.getID() !== self.currentObjectID) {
                                var currentObject = findObjectByID(self.currentObjectID, GameEngine.root);
                                self.currentObjectID = object.getID();
                                if (currentObject && currentObject.input["onmouseout"]) {
                                    currentObject.input["onmouseout"]();
                                }
                                if (object.input["onmouseover"]) object.input["onmouseover"]();
                            }

                            if (type === "mousedown" && object.input["onmousedown"]) {
                                object.input["onmousedown"]();
                            }
                            return true;
                        }
                    }
                }
            }

            if (!detect(GameEngine.root)) this.currentObjectID = -1;
        }
    },
    AssetsCache: {
        filePath: "AssetsPathsForCaching.json",
        imagesStore: [],
        load: function (onAssetLoaded, onFinish) {
            var self = this;
            var jsonObject, filesCount = 0, loadedFilesCount = 0;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.filePath, true);
            xhr.send();

            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;

                if (xhr.status != 200) {
                    console.error(xhr.status + ': ' + xhr.statusText);
                } else {
                    jsonObject = JSON.parse(xhr.responseText);
                    for (var path in jsonObject) {
                        filesCount += jsonObject[path].length;
                    }

                    for (var path in jsonObject) {
                        for (var k in jsonObject[path]) {
                            var image = new Image();
                            image.onload = function () {
                                ++loadedFilesCount;
                                var progress = loadedFilesCount / filesCount;
                                if (onAssetLoaded) {
                                    onAssetLoaded(progress);
                                }

                                if (progress === 1 && onFinish) {
                                    console.log(loadedFilesCount);
                                    onFinish();
                                }
                            };
                            image.src = path + jsonObject[path][k];
                            self.imagesStore[path + jsonObject[path][k]] = image;
                        }
                    }
                }
            };
        }
    },
    ComponentsClasses: {
        Sprite: function () {
            var name = "Sprite";
            var self = this;

            this.setSourse = function (path) {
                if (GameEngine.AssetsCache.imagesStore[path]) {
                    self.image = GameEngine.AssetsCache.imagesStore[path];
                    self.isLoaded = true;
                    if (self.onload) self.onload();
                } else {
                    self.image = new Image();
                    self.isLoaded = false;
                    self.image.src = path;
                    self.image.onload = function () {
                        self.isLoaded = true;
                        GameEngine.AssetsCache.imagesStore[path] = self.image;
                        if (self.onload) self.onload();
                    };
                }
            };

            this.getName = function () {
                return name;
            };

            this.setName = function (newName) {
                name = newName;
            };
        },
        TimeLine: function (owner) {
            var name = "TimeLine",
                startGlobalPosition = {x: 0, y: 0},
                startLocalPosition = {x: 0, y: 0},
                startScale = {x: 1, y: 1},
                startAlpha = 1,
                oldTime = 0,
                elapsedTime = 0,
                deltaTime = 0.016,
                points = [],
                id,
                isCyclic = false,
                removeOnFinish = true,
                iter = 0;

            this.setRemoveOnFinish = function (value) {
                removeOnFinish = value;
            };

            this.setCyclic = function (value) {
                isCyclic = value;
            };

            this.getName = function () {
                return name;
            };

            this.setName = function (newName) {
                name = newName;
            };

            this.addPoint = function (parameters) {
                if (!id && parameters && typeof(parameters.Time) === "number") {
                    points.push(parameters);
                }
            };

            this.start = function () {
                startGlobalPosition.x = owner.transform.getGlobalPosition().x;
                startGlobalPosition.y = owner.transform.getGlobalPosition().y;
                startLocalPosition.x = owner.transform.getLocalPosition().x;
                startLocalPosition.y = owner.transform.getLocalPosition().y;
                startScale.x = owner.transform.getScale().x;
                startScale.y = owner.transform.getScale().y;
                startAlpha = owner.transform.getAlpha();
                id = setInterval(onUpdate, deltaTime * 1000);
            };

            this.stop = function () {
                clearInterval(id);
            };

            this.setOnFinish = function (func) {
                points[points.length - 1].onFinish = func;
            };

            var onUpdate = function () {
                elapsedTime += deltaTime;
                var progress = (elapsedTime - oldTime) / (points[iter].Time - oldTime);

                if (points[iter].GlobalPosition) {
                    if (progress > 1) startGlobalPosition = points[iter].GlobalPosition;
                    owner.transform.setGlobalPosition(startGlobalPosition.x + (points[iter].GlobalPosition.x - startGlobalPosition.x) * progress,
                        startGlobalPosition.y + (points[iter].GlobalPosition.y - startGlobalPosition.y) * progress);

                }

                if (points[iter].LocalPosition) {
                    if (progress > 1) startLocalPosition = points[iter].LocalPosition;
                    owner.transform.setLocalPosition(startLocalPosition.x + (points[iter].LocalPosition.x - startLocalPosition.x) * progress,
                        startLocalPosition.y + (points[iter].LocalPosition.y - startLocalPosition.y) * progress);

                }

                if (points[iter].Scale) {
                    if (progress > 1) startScale = points[iter].Scale;
                    owner.transform.setScale(startScale.x + (points[iter].Scale.x - startScale.x) * progress, startScale.y + (points[iter].Scale.y - startScale.y) * progress);

                }

                if (!isNaN(points[iter].Alpha)) {
                    if (progress > 1) startAlpha = points[iter].Alpha;
                    owner.transform.setAlpha(startAlpha + (points[iter].Alpha - startAlpha) * progress);

                }

                if (points[iter].onInterval) {
                    points[iter].onInterval(owner, {
                        oldTime: oldTime,
                        elapsedTime: elapsedTime,
                        deltaTime: deltaTime,
                        nextPoint: points[iter]
                    });
                }

                if (progress > 1) {
                    if (points[iter].onPoint) {
                        points[iter].onPoint(owner, {
                            oldTime: oldTime,
                            elapsedTime: elapsedTime,
                            deltaTime: deltaTime,
                            nextPoint: points[iter]
                        });
                    }
                    oldTime = points[iter].Time;
                    if (isCyclic) {
                        ++iter;
                    } else {
                        if (points[iter].onFinish) {
                            points[iter].onFinish(owner, {
                                oldTime: oldTime,
                                elapsedTime: elapsedTime,
                                deltaTime: deltaTime,
                                nextPoint: points[iter]
                            });
                        }

                        if (elapsedTime >= points[points.length - 1].Time) {
                            if (removeOnFinish) {
                                owner.removeComponent(name);
                                owner = null;
                            } else {
                                clearInterval(id);
                            }
                        }
                        ++iter;
                    }
                    if (iter === points.length) {
                        iter = 0;
                        elapsedTime = 0;
                        oldTime = 0;
                    }

                }
                GameEngine.RenderSystem.render();
            };
        },
        Text: function () {
            var name = "Text";

            this.getName = function () {
                return name;
            };

            this.setName = function (newName) {
                name = newName;
            };

            this.text = "";
            this.font = "32px arial";
            this.type = "fill"; //or "stroke"
            this.color = "#000000";
        }
    },
    GameObject: (new function () {
        var idDonor = 0x0;
        //BD - Back Doors
        var registerBD = [];

        this.GameObjectConstructor = function () {
            var self = this;
            var ID = idDonor++;
            var backDoor = {transform: {}};
            registerBD[ID] = backDoor;
            var name = "GameObject";
            var parent = null;
            var children = [];
            var components = [];
            var layer = -1;
            var owner = this;

            //private methods
            var recalculateChildrenPosition,
                recalculateChildrenScale;

            this.render = {};

            this.input = {enabled: true};

            this.getID = function () {
                return ID;
            };

            this.equals = function (gameObject) {
                if (gameObject instanceof GameEngine.GameObject && gameObject.getID() === ID) {
                    return true;
                } else {
                    return false;
                }
            };

            this.getName = function () {
                return name;
            };

            this.setName = function (newName) {
                if (typeof(newName) === "string") {
                    name = newName;
                } else {
                    console.error("Type of data is not String!");
                }
            };

            this.attachTo = function (gameObject) {
                if (gameObject instanceof GameEngine.GameObject) {
                    this.detach();
                    parent = gameObject;
                    layer = parent.getChildren().length;
                    parent.__addChild(this);
                    self.transform.setGlobalPosition(parent.transform.getGlobalPosition().x + self.transform.getLocalPosition().x, parent.transform.getGlobalPosition().y + self.transform.getLocalPosition().y);
                    backDoor.transform.setSPScale(parent.render.getScale().x, parent.render.getScale().y);
                    recalculateChildrenScale();
                    GameEngine.RenderSystem.render();
                }
            };

            this.detach = function () {
                if (parent) {
                    parent.__removeChild(layer);
                    parent = null;
                    layer = -1;
                    GameEngine.RenderSystem.render();
                }
            };

            this.addComponent = function (componentName) {
                var component = new GameEngine.ComponentsClasses[componentName](owner);
                components.push(component);
                GameEngine.RenderSystem.render();
                return component;
            };

            this.getComponent = function (componentName) {
                for (var i = 0; i < components.length; i++) {
                    if (components[i].getName() === componentName) {
                        return components[i];
                    }
                }
            };

            this.removeComponent = function (componentName) {
                for (var i = 0; i < components.length; i++) {
                    if (components[i].getName() === componentName) {
                        if (components[i].stop) components[i].stop();
                        components.splice(i, 1);
                        break;
                    }
                }
                GameEngine.RenderSystem.render();
            };

            this.getParent = function () {
                return parent;
            };

            this.getChildren = function () {
                return children;
            };

            this.getChild = function (name) {
                for (var k in children) {
                    if (children[k].getName() === name) {
                        return children[k];
                    }
                }
            };

            this.transform = new (function () {
                //sp - start point, for example 'spScale' - start point of Scale
                var globalPosition = new Vector2(), //full released
                    localPosition = new Vector2(), //full released
                    scale = {x: 1, y: 1}, //full released
                    spScale = {x: 1, y: 1},
                    rotation = 0, //not released
                    spRotation = 0,
                    alpha = 1, //partly released
                    spAlpha = 1;

                owner.render.getScale = function () {
                    return {x: scale.x * spScale.x, y: scale.y * spScale.y};
                };

                backDoor.transform.getSPScale = function () {
                    return spScale;
                };

                backDoor.transform.setSPScale = function (x, y) {
                    spScale.x = x;
                    spScale.y = y;
                    recalculateChildrenScale();
                };

                backDoor.transform.getSPRotation = function () {
                    return spRotation;
                };

                backDoor.transform.setSPRotation = function (newAngle) {
                    spRotation = newAngle;
                };

                backDoor.transform.getSPAlpha = function () {
                    return spAlpha;
                };

                backDoor.transform.setSPAlpha = function (newAlpha) {
                    spAlpha = newAlpha;
                };

                backDoor.transform.setGlobalPosition = function (x, y) {
                    if (typeof(x) === "number" && typeof(y) === "number") {
                        globalPosition.x = x;
                        globalPosition.y = y;
                        if (parent) {
                            var parentGlobalPos = parent.transform.getGlobalPosition();
                            localPosition.x = globalPosition.x - parentGlobalPos.x;
                            localPosition.y = globalPosition.y - parentGlobalPos.y;
                        } else {
                            localPosition.x = globalPosition.x;
                            localPosition.y = globalPosition.y;
                        }
                        recalculateChildrenPosition();
                    } else {
                        console.error("Type of 'x' or 'y' is not Number!");
                    }
                };

                backDoor.transform.setLocalPosition = function (x, y) {
                    if (typeof(x) === "number" && typeof(y) === "number") {
                        localPosition.x = x;// * (scale.x * spScale.x);
                        localPosition.y = y;// * (scale.y * spScale.y);
                        if (parent) {
                            var parentGlobalPos = parent.transform.getGlobalPosition();
                            globalPosition.x = parentGlobalPos.x + localPosition.x;
                            globalPosition.y = parentGlobalPos.y + localPosition.y;
                        } else {
                            globalPosition.x = localPosition.x;
                            globalPosition.y = localPosition.y;
                        }
                        recalculateChildrenPosition();
                    } else {
                        console.error("Type of 'x' or 'y' is not Number!");
                    }
                };

                this.getGlobalPosition = function () {
                    return globalPosition;
                };

                this.setGlobalPosition = function (x, y) {
                    backDoor.transform.setGlobalPosition(x, y);
                    GameEngine.RenderSystem.render();
                };

                this.getLocalPosition = function () {
                    return localPosition;
                };

                this.setLocalPosition = function (x, y) {
                    backDoor.transform.setLocalPosition(x, y);
                    GameEngine.RenderSystem.render();
                };

                this.getScale = function () {
                    return scale;
                };

                this.setScale = function (x, y) {
                    scale.x = x;
                    scale.y = y;
                    recalculateChildrenScale();
                    GameEngine.RenderSystem.render();
                };

                this.getRotation = function () {
                    //return rotation;
                };

                this.setRotation = function (angle) {
                    //if (typeof(angle) === "number") {
                    //    rotation = angle;
                    //} else {
                    //    console.error("Type of data is not Number!");
                    //}
                };

                this.getAlpha = function () {
                    return alpha;
                };

                this.setAlpha = function (newAlpha) {
                    if (typeof(newAlpha) === "number") {
                        alpha = newAlpha;
                        GameEngine.RenderSystem.render();
                    } else {
                        console.error("Type of data is not Number!");
                    }
                };

                recalculateChildrenPosition = function () {
                    for (var i = 0; i < children.length; i++) {
                        var childLocalPos = children[i].transform.getLocalPosition();
                        var childBD = registerBD[children[i].getID()];
                        if (childBD) {
                            childBD.transform.setGlobalPosition(globalPosition.x + childLocalPos.x, globalPosition.y + childLocalPos.y);
                        }
                    }
                };

                recalculateChildrenScale = function () {
                    for (var i = 0; i < children.length; i++) {
                        var childBD = registerBD[children[i].getID()];
                        if (childBD) {
                            childBD.transform.setSPScale(scale.x * spScale.x, scale.y * spScale.y);
                        }
                    }
                };
            });

            this.__addChild = function (child) {
                children.push(child);
            };

            this.__removeChild = function (layer) {
                children.splice(layer, 1);
            };
        };
    }).GameObjectConstructor
};