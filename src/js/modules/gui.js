// TODO select Faces where its aloud to place objects

var $ = require("jquery");
//var dat = require('dat-gui');
var THREE = require("three.js");
var calculate = require("./calculate");
require("../vendor/Roboto-Black_Regular");

//var gui = new dat.GUI();
var boxSize;
var attributes;
var configs = {};
var text;
var SELECTED, MOVE, DRAW;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
    offset = new THREE.Vector3(),
    projector = new THREE.Projector();
var objects = [];
var embossing;
var selectedFaces = [];

module.exports = {
    init: function init(box, mesh, url, scene) {
        mesh.scale.set(params.width, params.height, params.depth);
        buildGUI(mesh, scene);
    },
    toggleSelection: function toggleSelection(event, camera, renderer, mesh, controls){
        mouse.x = event.clientX / renderer.domElement.clientWidth * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        projector.unprojectVector( vector, camera );
        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        var intersects = ray.intersectObject( mesh, true );
        if ( intersects.length > 0 ) {
            DRAW = !DRAW;
            controls.enabled = !controls.enabled;
        }
    },
    checkSelection: function checkSelection(event, camera, renderer, mesh){
        if (DRAW) {
            mouse.x = event.clientX / renderer.domElement.clientWidth * 2 - 1;
            mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

            var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
            projector.unprojectVector( vector, camera );
            var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

            var intersects = ray.intersectObject( mesh, true );
            if ( intersects.length > 0 )
            {
                var test=-1;
                selectedFaces.forEach( function(arrayItem)
                {
                    if(intersects[0].faceIndex==arrayItem.faceIndex && intersects[0].object.id==arrayItem.object.id){
                        test=selectedFaces.indexOf(arrayItem);
                    }
                });
                if(test>=0){
                    intersects[ 0 ].face.color=new THREE.Color( 0x787878 );
                    selectedFaces.splice(test, 1);
                }
                else{
                    intersects[ 0 ].face.color.setHex( 0xff0000 );
                    selectedFaces.push(intersects[0].face);
                }
                intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
            }
        }
    },
    moveText: function moveText(event, camera, renderer, mesh) {
        if (SELECTED && MOVE) {
            mouse.x = event.clientX / renderer.domElement.clientWidth * 2 - 1;
            mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            var intersects = raycaster.intersectObject(mesh, true);
            if (intersects.length > 0) {

                SELECTED.position.copy(intersects[0].point.sub(offset));
                text.position.set(mouse.x, mouse.y, 0);
                if (intersects.length > 0) {
                    text.position.set(0, 0, 0);
                    text.lookAt(intersects[0].face.normal);
                    text.position.copy(intersects[0].point);
                }
            }
        }
    },
    selectText: function selectText(event, camera, renderer, mesh, controls,scene) {
        if (text !== undefined) {


            mouse.x = event.clientX / renderer.domElement.clientWidth * 2 - 1;
            mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(objects, true);

            if (intersects.length > 0 && !SELECTED) {
                $(".embedded--edit").css({ top: event.pageY, left: event.pageX, display: "block" });
                controls.enabled = false;
                SELECTED = intersects[0].object;
                SELECTED.material.color.set(16711680);
            }

            if (!intersects.length && SELECTED && $('.embedded--edit:hover').length === 0) {

                $(".embedded--edit").hide();
                $(".embedded--scale--input").hide();
                controls.enabled = true;
                SELECTED.material.color.set(7895160);

                SELECTED = null;
            }

            $('.embedded--edit').on('click', '.embedded--move', function(){
                MOVE = true;
                $(".embedded--edit").hide();
                $(".embedded--scale--input").hide();
                moveText();

            });
            $('.embedded--edit').on('click', '.embedded--delete', function(){
                $(".embedded--edit").hide();
                $(".embedded--scale--input").hide();
                scene.remove(SELECTED);
                controls.enabled = true;
                objects = $.grep(objects, function(e){
                    return e.uuid != SELECTED.uuid;
                });
                SELECTED = null;
            });
            $('.embedded--edit').on('click', '.embedded--scale', function(){
                $(".embedded--scale--input").toggle();
            });
            $(".embedded--scale--input").on('change', function(){
                var scaleValue = $(".embedded--scale--input").val();
                SELECTED.scale.set(scaleValue, scaleValue, scaleValue);
            });
        } else {}
    },
    dropText: function dropText(event, camera, renderer, mesh, controls) {
        if (MOVE) {
            event.preventDefault();
            $(".embedded--edit").hide();
            controls.enabled = true;
            SELECTED.material.color.set(7895160);

            //plane.position.copy( INTERSECTED.position );
            SELECTED = null;
            MOVE = false;
            renderer.domElement.style.cursor = "auto";
        }
    }

};

function scale(mesh) {
    var size = calculate.size(mesh);
    calculate.price(size);
}

function buildGUI(mesh, scene) {
    var box = new THREE.Box3().setFromObject(mesh);
    var boxSize = box.size();

    var sizeX = boxSize.x * 2;
    var sizeY = boxSize.y * 2;
    var sizeZ = boxSize.z * 2;

    $("[data-form]").on("click", function () {
        var type = $(this).attr("data-form");
        addForm(type, scene);
    });

    $.each($("input"), function (index, input) {
        switch ($(input).attr("id")) {
            case "width":
                $(input).on("change", function () {
                    var scaleValue = parseFloat($(this).val());
                    mesh.scale.z = scaleValue / sizeX / 2;
                    scale(mesh);
                });
                break;
            case "height":
                $(input).on("change", function () {
                    var scaleValue = $(this).val();
                    mesh.scale.y = scaleValue / sizeY / 2;
                    scale(mesh);
                });
                break;
            case "depth":
                $(input).on("change", function () {
                    var scaleValue = parseFloat($(this).val());
                    mesh.scale.x = scaleValue / sizeZ / 2;
                    scale(mesh);
                });
                break;
            case "color":
                $(input).on("change", function () {
                    var colorValue = $(this).val();
                    var colorObject = new THREE.Color(colorValue);
                    mesh.material.color = colorObject;
                });
                break;
            case "size":
                $(input).on("change", function () {
                    var scaleValue = parseFloat($(this).val());
                    mesh.scale.set(scaleValue, scaleValue, scaleValue);
                    scale(mesh);
                });
                break;
            case "text":
                $(input).on("change", function () {
                    addForm("text", scene);
                });
                break;
            case "fontSize":
                $(input).on("change", function () {
                    addForm("text", scene);
                });
                break;
            case "fontHeight":
                $(input).on("change", function () {
                    addForm("text", scene);
                });
                break;
        }
    });
}

function addForm(type, scene) {
    var form;

    if (type == "text") {
        embossing = true;
        form = new THREE.TextGeometry($("#text").val(), {
            size: $("#fontSize").val(),
            height: 1,
            curveSegments: 2,
            font: "Roboto Black"
        });
    } else if (type == "cube") {
        form = new THREE.CubeGeometry(2, 2, 2);
    } else if (type == "circle") {
        form = new THREE.SphereGeometry(2, 32, 32);
    } else if (type == "star") {
        var starPoints = [];

        starPoints.push(new THREE.Vector2(0, 5));
        starPoints.push(new THREE.Vector2(1, 1));
        starPoints.push(new THREE.Vector2(4, 1));
        starPoints.push(new THREE.Vector2(2, -1));
        starPoints.push(new THREE.Vector2(3, -5));
        starPoints.push(new THREE.Vector2(0, -2));
        starPoints.push(new THREE.Vector2(-3, -5));
        starPoints.push(new THREE.Vector2(-2, -1));
        starPoints.push(new THREE.Vector2(-4, 1));
        starPoints.push(new THREE.Vector2(-1, 1));

        var starShape = new THREE.Shape(starPoints);

        var extrusionSettings = {
            amount: 2,
            size: 1,
            height: 1,
            curveSegments: 3,
            bevelThickness: 1,
            bevelSize: 2,
            bevelEnabled: false,
            material: 0,
            extrudeMaterial: 1
        };

        form = new THREE.ExtrudeGeometry(starShape, extrusionSettings);
    }

    form.computeBoundingBox();
    var centerOffset = -0.5 * (form.boundingBox.max.x - form.boundingBox.min.x);

    var Material = new THREE.MeshPhongMaterial({
        color: 7895160,
        specular: 1118481,
        shininess: 200
    });

    if (type == "text" && embossing) {
        var posX = text.position.x;
        var posY = text.position.y;
        var posZ = text.position.z;
        scene.remove(text);
        text = new THREE.Mesh(form, Material);

        text.position.x = posX;
        text.position.y = posY;
        text.position.z = posZ;
    } else {
        text = new THREE.Mesh(form, Material);
        text.position.x = centerOffset;
        text.position.y = 0;
        text.position.z = -5;

        SELECTED = text;
        MOVE = true;
    }
    text.name = text.uuid;
    scene.add(text);
    objects.push(text);

}
