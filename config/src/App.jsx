// import  { useEffect, useRef, useState } from 'react';
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import marble from "./assets/marble.png";
import crate from "./assets/crate.gif";
import texturePaint from "./assets/texturePaint.png";

import { useEffect, useRef, useState } from "react";

function App() {
  const fileRef = useRef();
  const canvasRef = useRef();

  const textureLoader = new THREE.TextureLoader();

  const [images, setImages] = useState([
    {
      url: marble,
      name: "Marbel",
      material: new THREE.MeshStandardMaterial({
        map: textureLoader.load(marble),
      }),
    },
    {
      url: crate,
      name: "Wood",
      material: new THREE.MeshStandardMaterial({
        map: textureLoader.load(crate),
      }),
    },
    {
      url: texturePaint,
      name: "Texture Paint",
      material: new THREE.MeshStandardMaterial({
        map: textureLoader.load(texturePaint),
      }),
    },
  ]);
  const sc = new THREE.Scene();
  const [scene, setScene] = useState(sc);
  const [selectedMesh, setSelectedMesh] = useState({});

  const caster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // let selectedMesh = new THREE.Mesh();
  // let materials = {};
  const [materials, setMaterials] = useState({});

  const sizes = { width: window.innerWidth, height: window.innerHeight };
  const cameraSettings = {
    fov: 75,
    near: 0.1,
    far: 1280,
    position: new THREE.Vector3(0, 2, 0),
  };

  let camera, renderer, orbitControls, light;

  console.log();

  function init() {
    const canvas = document.querySelector("canvas.webgl");
    setupScene();
    setupCamera();
    setupRenderer(canvas);
    setUpLights();
    setupOrbitControls();
    setupEventListeners();
    setupHelpers();
  }

  function setupScene() {
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    
  }

  function setupCamera() {
    camera = new THREE.PerspectiveCamera(
      cameraSettings.fov,
      sizes.width / sizes.height,
      cameraSettings.near,
      cameraSettings.far
    );
    camera.position.copy(cameraSettings.position);
    scene.add(camera);
  }

  function setUpLights() {
    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);
  }

  function setupHelpers() {
    // const gridHelper = new THREE.GridHelper(10, 10);
    // scene.add(gridHelper);
    const size = 1000
    const gridRatio = 1
    const divisions = size * gridRatio

    const geometry = new THREE.PlaneGeometry(divisions, divisions);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    plane.rotation.x = -Math.PI * 0.5
    
    
    const colorCenterLine = new THREE.Color(0x000000)
    const colorGrid = new THREE.Color(0xdedede)
    const gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid)
    scene.add(gridHelper)
    gridHelper.name = 'gridHelper'
  }

  function setupRenderer(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(sizes.width, sizes.height);
  }

  function setupOrbitControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.update();
  }

  function setupEventListeners() {
    window.addEventListener("resize", onWindowResize, false);
    // window.addEventListener("click", onClick);

    const canvas = canvasRef.current;
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("click", onClick);
    };
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
  }

  const renderTextures = ({ bmp, name, material }) => {
    console.log(bmp);
    // create a canvas
    const canvas = document.createElement("canvas");
    // resize it to the size of our ImageBitmap
    canvas.width = 100;
    canvas.height = 100;
    // get a bitmaprenderer context
    const ctx = canvas.getContext("bitmaprenderer");
    ctx.transferFromImageBitmap(bmp);
    // get it back as a Blob
    const blob2 = canvas.toDataURL();
    setImages((prev) => [...prev, { url: blob2, name, material }]);
  };

  const handleLoadFile = (file) => {
    const loader = new GLTFLoader();
    loader.load(URL.createObjectURL(file), (glb) => {
      scene.add(glb.scene);
      console.log(glb);
      const materialsTemp = {};
      // glb.scene.traverse((object) => {
      //   if (object.isMesh) {
      //     materials[object.material.name || "default"] = object.material;
      //     console.log(`${object.material.name}`, object.material.map.image);

      //     var c = document.getElementById("previewMaterial");
      //     var ctx = c.getContext("2d");
      //     // draw image fit to canvas
      //     ctx.drawImage(
      //       object.material.map.image,
      //       0,
      //       0,
      //       object.material.map.image.width,
      //       object.material.map.image.height,
      //       0,
      //       0,
      //       c.width,
      //       c.height
      //     );
      //   }
      // });

      glb.scene.traverse(async (object) => {
        if (object.isMesh) {
          materialsTemp[object.material.name || "default"] = object.material;
          // console.log(`${object.material.name}`, object.material.map.image);
          renderTextures({
            bmp: await createImageBitmap(object.material.map.image),
            name: object.material.name,
            material: object.material,
          });
        }
      });

      setMaterials(materialsTemp);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleLoadFile(file);
  };

  useEffect(() => {
    init();
    animate();
  }, []);

  console.log("scene bahar", scene);

  function onClick(event) {
    event.preventDefault();
    // event.stopPropagation();

    mouse.x = (event.clientX / renderer.domElement.offsetWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.offsetHeight) * 2 + 1;

    caster.setFromCamera(mouse, camera);

    const intersects = caster.intersectObjects(scene.children);
    console.log("scene", scene);
    if (intersects.length > 0) {
      const intersection = [];
      console.log({ intersects });
      // intersects.traverse(obj=> {
      //   obj.object.traverse(att=>{
      //     if(att.type === 'Mesh'){
      //       intersection.push(att);
      //     }
      //   })
      // })
      intersects?.map((item) => {
        item.object.traverse((mesh) => {
          if (mesh.type === "Mesh") {
            if (!intersection.find((int) => int.uuid === mesh.uuid)) {
              intersection.push(mesh);
            }
          }
        });
      });
      // intersection[0];
      // console.log({ intersection });

      setSelectedMesh(intersection[0]);
    }
  }

  const handleChangeMaterial = (selectedMaterial, newMaterial) => {
    scene.children.forEach((item) => {
      if (item.type === "Group") {
        item.children.forEach((obj) => {
          if (obj.type === "Group") {
            obj.children.forEach((child) => {
              if (child.name === selectedMaterial.name) {
                child.material = newMaterial;
                child.material.needsUpdate = true;
              }
            });
          } else {
            if (obj.name === selectedMaterial.name) {
              obj.material = newMaterial;
              obj.material.needsUpdate = true;
            }
          }
        });
      }
    });
  };

  return (
    <div>
      <button onClick={() => fileRef.current.click()}>Upload GLB</button>
      <input ref={fileRef} type="file" onChange={handleFileChange} hidden />
      <div style={{ position: "fixed", top: 50 }}>
        Selected Mesh: {selectedMesh?.name}
      </div>
      <canvas ref={canvasRef} className="webgl" />
      {/* <canvas id="previewMaterial" style={{ width: 100, height: 100 }} /> */}

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "20vw",
          height: "100vh",
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          background: "#000",
          flexDirection: "column",
          padding: "8px",
          boxShadow: "rgba(255, 255, 255, 0.5) 0px 5px 5px",
        }}
      >
        <p style={{ color: "#fff" }}>Available Textures</p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "calc(100vh - 100px)",
            overflow: "auto",
          }}
        >
          {images?.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                borderBottom: "1px solid white",
              }}
            >
              <img
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeMaterial(selectedMesh, item.material);
                }}
                src={item?.url}
                key={i}
                style={{ width: 100, height: 100 }}
              />
              <p style={{ color: "#fff", textOverflow: "ellipsis" }}>
                {item?.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
